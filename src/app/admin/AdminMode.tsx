"use client";

import { createContext, useContext } from "react";

/**
 * 미리보기(데모) 모드 여부.
 *
 * 관리자 화면의 거의 모든 컨트롤이 "데모면 비활성"이라 `demo` prop이
 * 컴포넌트 8곳을 타고 흘렀다. 화면 전체에 걸린 하나의 상태이므로 context가 맞다.
 *
 * 이건 어디까지나 UI 편의다 — 실제 변경 차단은 서버 액션의 `getAdminContext()`가 한다.
 * (→ docs/features/14-demo-mode.md)
 */
const AdminDemoContext = createContext(false);

export const useAdminDemo = () => useContext(AdminDemoContext);

export default function AdminModeProvider({
  demo,
  children,
}: {
  demo: boolean;
  children: React.ReactNode;
}) {
  return (
    <AdminDemoContext.Provider value={demo}>{children}</AdminDemoContext.Provider>
  );
}
