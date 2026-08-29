/**
 * 방명록 글자 수.
 *
 * 폼과 서버가 같은 수를 봐야 한다 -- 화면에서는 더 쓸 수 있는데 등록에서
 * 막히면 쓴 글을 잃는다.
 *
 * 300자는 다섯 문장쯤이다. 200자는 기도를 적다 문장 중간에서 끊기고,
 * DB가 허용하는 500자는 카드가 늘어선 화면에서 한 사람이 화면을 다 먹는다.
 */
export const GUESTBOOK_MAX = 300;
/** guestbook.display_name의 DB 제약과 같은 수 — 넘기면 등록이 통째로 실패한다 */
export const GUESTBOOK_NAME_MAX = 20;
