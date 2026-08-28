/**
 * 서울 열린데이터광장 "지하철역 편의시설위치정보 수유실 현황"(getFcNrsrm) API로
 * 서울 지하철역 수유실 데이터를 Cafe 컬렉션에 시드합니다.
 *
 * 사전 준비:
 * 1. backend/.env 에 SEOUL_OPENDATA_KEY 추가
 * 2. backend/data/seoul-subway-coords.csv 준비 (컬럼: 연번,호선,고유역번호,역명,위도,경도,작성일자,작성기준일)
 *    — data.go.kr "서울교통공사_1~8호선 역사 좌표(위경도) 정보" 파일데이터를 로그인 없이 다운로드
 *
 * 실행: npx tsx scripts/seed-seoul-nursing-rooms.ts
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { prisma } from '../lib/db';

const SEOUL_OPENDATA_KEY = process.env.SEOUL_OPENDATA_KEY;
const PAGE_SIZE = 100;

type NursingRoomItem = {
  stnCd: string;
  lineNm: string;
  stnNm: string;
  fcltSeNm: string;
  dtlPstn: string;
  exitNo: string;
  utztnHr: string;
  dprSwchbrdCnt: number | string; // 기저귀교환대수
  gateInoutSe: string;
  stnFlr: string;
};

type StationCoord = { lat: number; lng: number };

function loadStationCoords(): Map<string, StationCoord> {
  const csvPath = path.join(__dirname, '../data/seoul-subway-coords.csv');
  const raw = readFileSync(csvPath, 'utf-8');
  const lines = raw.trim().split('\n').slice(1); // 헤더 제외

  const coords = new Map<string, StationCoord>();
  for (const line of lines) {
    const [, , , stationName, lat, lng] = line.split(',').map((cell) => cell.trim());
    if (!stationName || !lat || !lng) continue;
    // 동일 역명이 여러 호선에 걸쳐 나와도 물리적으로 같은 위치라 첫 값만 사용합니다.
    if (!coords.has(stationName)) {
      coords.set(stationName, { lat: Number(lat), lng: Number(lng) });
    }
  }
  return coords;
}

async function fetchAllNursingRooms(): Promise<NursingRoomItem[]> {
  if (!SEOUL_OPENDATA_KEY) {
    throw new Error('SEOUL_OPENDATA_KEY가 backend/.env에 설정되어 있지 않습니다.');
  }

  const items: NursingRoomItem[] = [];
  let start = 1;

  while (true) {
    const end = start + PAGE_SIZE - 1;
    const url = `http://openapi.seoul.go.kr:8088/${SEOUL_OPENDATA_KEY}/json/getFcNrsrm/${start}/${end}/`;
    const res = await fetch(url);
    const data = await res.json();

    const header = data.response?.header;
    if (!header || header.resultCode !== '00') {
      throw new Error(`서울 열린데이터광장 API 오류: ${JSON.stringify(header)}`);
    }

    const rawItem = data.response.body?.items?.item ?? [];
    const pageItems: NursingRoomItem[] = Array.isArray(rawItem) ? rawItem : [rawItem];
    items.push(...pageItems);

    if (pageItems.length < PAGE_SIZE) break;
    start += PAGE_SIZE;
  }

  return items;
}

async function main() {
  const stationCoords = loadStationCoords();
  const nursingRooms = await fetchAllNursingRooms();

  let created = 0;
  let skippedNoCoord = 0;

  for (const room of nursingRooms) {
    const coord = stationCoords.get(room.stnNm);
    if (!coord) {
      skippedNoCoord++;
      console.warn(`좌표 없음, 건너뜀: ${room.stnNm}`);
      continue;
    }

    const diaperTableCount = Number(room.dprSwchbrdCnt) || 0;

    await prisma.cafe.create({
      data: {
        name: `${room.stnNm}역 ${room.fcltSeNm}`,
        address: `${room.lineNm} ${room.stnNm}역 ${room.exitNo}번 출구 인근 · ${room.dtlPstn}`,
        lat: coord.lat,
        lng: coord.lng,
        hasNursingRoom: true, // 이 데이터셋은 전부 수유실 데이터라 확정
        hasDiaperTable: diaperTableCount > 0, // dprSwchbrdCnt(기저귀교환대수) 기준
        facilityNote: `이용시간: ${room.utztnHr} · ${room.stnFlr}층 · ${room.gateInoutSe}`,
        source: 'PUBLIC_DATA',
        // 카카오 장소 ID가 없는 공공데이터라, MongoDB unique 인덱스(kakaoPlaceId)가
        // null끼리 충돌하는 걸 피하려고 역코드+시설구분으로 합성 고유값을 넣습니다.
        kakaoPlaceId: `seoul-subway-${room.stnCd}-${room.fcltSeNm}`,
      },
    });
    created++;
  }

  console.log(`완료: ${created}건 생성, ${skippedNoCoord}건 좌표 없어 건너뜀`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
