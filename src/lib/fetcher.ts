/**
 * 관리자 화면 폴링 주기(ms) — 대시보드·참가자 명단·가입 승인이 같은 값을 쓴다.
 * 화면마다 다르면 「저긴 바뀌었는데 여긴 왜 안 바뀌지」가 된다. 보는 사람은
 * 운영진 몇 명뿐이고 탭이 뒤로 가면 SWR가 멈추므로 서버 부담은 없다.
 */
export const ADMIN_POLL_MS = 3000;

/** SWR 공용 fetcher — 비정상 응답은 throw해서 error 상태로 */
export async function jsonFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res.json() as Promise<T>;
}
