import "@/styles/site.css";

import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase/server";
import BindForm from "./BindForm";

export const dynamic = "force-dynamic";

export default async function BindPage() {
  const supabase = await getSupabaseServer();
  if (!supabase) redirect("/");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: summary } = await supabase.rpc("get_my_summary");
  if (summary) redirect("/#my");

  return (
    <div className="bind-wrap">
      <Link href="/" className="nav-logo" style={{ fontFamily: "Anton" }}>
        MIRACLE
      </Link>
      <div className="eyebrow" style={{ marginTop: 46 }}>
        PARTICIPANT LINK
      </div>
      <h2>신청 명단과 연결하기</h2>
      <p className="sub">
        처음 한 번만 하면 돼요. 참가 신청 때 적은 이름과 생년월일을 입력하면 이
        소셜 계정과 명단이 연결되고, 다음부터는 원탭 로그인이에요.
      </p>
      <BindForm />
    </div>
  );
}
