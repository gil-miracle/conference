import "@/styles/admin.css";

import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import AdminTabs from "./AdminTabs";
import AdminModeProvider from "./AdminMode";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAdmin();

  return (
    <AdminModeProvider demo={ctx.demo}>
      <div className="admin">
        {/* 헤더와 탭을 한 덩어리로 붙인다 — 따로 붙이면 탭의 top 오프셋이
            헤더 높이와 어긋나 스크롤할 때 탭이 잘려 보인다 */}
        <div className="a-top">
          <header className="a-header">
          <div className="hd">
            <div className="logo">
              MIRACLE<span>ADMIN</span>
            </div>
            <div className="who">
              <Link href="/">사이트 보기</Link>
              <span>운영자 · {ctx.me.name}</span>
            </div>
          </div>
          </header>
          <AdminTabs />
        </div>
        {ctx.demo && (
          <div className="banner demo-banner">
            관리자 미리보기 모드 — 데모 데이터입니다. Supabase 연결 후 실데이터로
            동작해요.
          </div>
        )}
        <div className="container">{children}</div>
      </div>
    </AdminModeProvider>
  );
}
