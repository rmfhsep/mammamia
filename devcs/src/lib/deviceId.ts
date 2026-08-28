const STORAGE_KEY = 'devcs.deviceId';

/** 로그인 없이 풀이 기록을 서버에 저장하기 위한 익명 기기 식별자. 최초 방문 시 발급해 localStorage에 고정한다. */
export function getDeviceId(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;

  const id = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, id);
  return id;
}
