import type { PersonLite } from "./types";

/**
 * 배정 화면 공통 계산 — 숙소와 조가 같은 모양이라 한곳에 둔다.
 * 참가자 목록을 배정 키(room_id / team_id)로 묶고 미배정 인원을 분리한다.
 */
export function groupByAssignment(
  people: PersonLite[],
  field: "room_id" | "team_id"
) {
  const grouped = new Map<string, PersonLite[]>();
  const unassigned: PersonLite[] = [];

  for (const person of people) {
    const key = person[field];
    if (!key) {
      unassigned.push(person);
      continue;
    }
    const bucket = grouped.get(key);
    if (bucket) bucket.push(person);
    else grouped.set(key, [person]);
  }

  return {
    unassigned,
    /** 배정 없는 그룹도 빈 배열로 받아 호출부에서 ?? 를 반복하지 않게 */
    membersOf: (id: string) => grouped.get(id) ?? [],
  };
}
