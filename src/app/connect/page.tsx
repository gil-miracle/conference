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
  const my = summary as { status?: string; reject_reason?: string | null } | null;
  // 반려된 사람은 여기로 돌아올 수 있어야 한다 — 반려의 대부분은 잘못 적은
  // 이름·전화라, 고칠 자리가 이 화면이다
  const rejected = my?.status === "rejected";
  if (my && !rejected) redirect("/profile");

  // 소셜 프로필 이름을 미리 채워 입력 부담을 줄인다 (수정 가능)
  const meta = user.user_metadata ?? {};
  const defaultName =
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    "";

  return (
    <div className="bind-wrap">
      <Link href="/" className="nav-logo disp">
        MIRACLE
      </Link>
      <div className="eyebrow bind-eyebrow">PARTICIPANT LINK</div>
      <h2>{rejected ? "다시 요청하기" : "신청 명단과 연결하기"}</h2>
      <p className="sub">
        {rejected ? (
          <>
            먼저 보낸 요청이 반려됐어요.
            {my?.reject_reason && <> 사유: {my.reject_reason}</>}
            <br />
            참가 신청 때 적은 이름·생년월일·전화번호를 다시 확인해서 보내주세요.
          </>
        ) : (
          <>
            처음 한 번만 하면 돼요. 참가 신청 때 적은 이름과 생년월일을 입력하면
            이 소셜 계정과 명단이 연결되고, 다음부터는 원탭 로그인이에요.
          </>
        )}
      </p>
      <BindForm defaultName={defaultName} />
    </div>
  );
}
