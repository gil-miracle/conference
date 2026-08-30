import "@/styles/admin.css";
import "@/styles/host.css";

export const metadata = { title: "레크리에이션 — MIRACLE 2026" };

/**
 * 진행자 화면은 관리자 레이아웃을 쓰지 않는다.
 *
 * 관리자 화면 위쪽에는 탭이 여섯 개 달려 있는데, 사회를 보면서 점수를 넣는
 * 자리에서는 그게 전부 오답 후보다. 여기는 화면 하나로 끝난다.
 *
 * 다만 표·버튼 모양은 관리자 것을 그대로 쓴다 — 같은 사람이 오가는 화면이라
 * 생김새가 다르면 매번 다시 익혀야 한다.
 */
export default function HostLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin host-shell">{children}</div>;
}
