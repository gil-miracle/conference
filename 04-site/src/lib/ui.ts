export const OPEN_LOGIN_EVENT = "miracle:open-login";

/** 로그인 시트 열기 — 어느 컴포넌트에서든 호출 (클라이언트 전용) */
export function openLogin() {
  window.dispatchEvent(new Event(OPEN_LOGIN_EVENT));
}
