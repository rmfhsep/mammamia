import { Storage } from '@apps-in-toss/web-framework';

async function getItem(key: string): Promise<string | null> {
  try {
    return await Storage.getItem(key);
  } catch {
    // 앱인토스 브릿지가 없는 환경(로컬 브라우저 개발 등)에서는 localStorage로 대체합니다.
    return localStorage.getItem(key);
  }
}

async function setItem(key: string, value: string): Promise<void> {
  try {
    await Storage.setItem(key, value);
  } catch {
    localStorage.setItem(key, value);
  }
}

/** 기기 로컬 저장소에서 JSON 값을 읽어옵니다. 값이 없거나 파싱에 실패하면 null을 반환합니다. */
export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** 기기 로컬 저장소에 값을 JSON으로 직렬화해 저장합니다. */
export async function setJSON<T>(key: string, value: T): Promise<void> {
  await setItem(key, JSON.stringify(value));
}
