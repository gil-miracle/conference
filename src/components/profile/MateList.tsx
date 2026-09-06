import type { RoomMate } from "@/lib/types";

/**
 * 같은 방·같은 조 사람들.
 *
 * 운영진 화면과 같은 규칙으로 그린다 — 성별로 색이 갈리고, 방장·조장에는
 * 표가 붙는다. 같은 방을 두 화면에서 다르게 읽으면, 데스크에서 「그 방
 * 방장이 누구죠」를 물었을 때 참가자 화면으로는 확인할 수가 없다.
 *
 * 이름만 든 옛 모양(문자열 배열)도 받는다. 화면과 DB 함수는 서로 다른 때에
 * 올라가므로, 함수가 아직 옛 모양을 내려주는 동안에도 이름은 보여야 한다 —
 * 안 그러면 방 사람들이 통째로 빈칸이 된다.
 */
export default function MateList({ people }: { people: (RoomMate | string)[] }) {
  const rows = people.map((p) =>
    typeof p === "string" ? { name: p, gender: null, leader: false } : p
  );
  if (rows.length === 0) return null;
  return (
    <div className="mates">
      {rows.map((p) => (
        <span key={p.name} data-g={p.gender ?? ""} className={p.leader ? "lead" : undefined}>
          {p.name}
        </span>
      ))}
    </div>
  );
}
