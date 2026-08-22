import "@/styles/admin.css";

import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import AdminTabs from "./AdminTabs";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAdmin();

  return (
    <div className="admin">
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
      {ctx.demo && (
        <div className="banner" style={{ background: "var(--green)" }}>
          관리자 미리보기 모드 — 데모 데이터입니다. Supabase 연결 후 실데이터로
          동작해요.
        </div>
      )}
      <div className="container">{children}</div>
    </div>
  );
}
