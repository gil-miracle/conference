/**
 * 정해진 순서 목록.
 *
 * 여섯 게임이 저마다 방식은 달라도 내놓는 답은 같다 — 번호 붙은 이름 줄.
 * 모양이 어긋나면 "게임마다 결과가 다른 것"처럼 보이므로 한곳에서 그린다.
 *
 * 이름은 여기서 줄이지 않는다. 한 줄을 통째로 쓰는 자리라 자를 이유가 없고,
 * 마지막에 확인하는 화면이라 온전한 이름이 보여야 한다.
 */
export default function OrderList({
  names,
  /** 방금 정해진 사람 — 한 명씩 쌓이는 게임에서 눈이 갈 곳을 만든다 */
  highlightLast = false,
  /** 아직 진행 중이면 흐리게 (섞는 모습을 보여주는 동안) */
  dim = false,
}: {
  names: readonly string[];
  highlightLast?: boolean;
  dim?: boolean;
}) {
  if (names.length === 0) return null;

  return (
    <ol className={`order-list${dim ? " spinning" : ""}`}>
      {names.map((name, i) => (
        <li
          // 이 목록은 쌓이기만 하고 순서가 바뀌지 않아 자리가 곧 정체성이다.
          // 이름만으로 키를 잡으면 동명이인 한 쌍에 화면이 깨진다.
          key={`${i}-${name}`}
          className={highlightLast && i === names.length - 1 ? "just" : undefined}
        >
          <span className="no">{String(i + 1).padStart(2, "0")}</span>
          <b>{name}</b>
        </li>
      ))}
    </ol>
  );
}
