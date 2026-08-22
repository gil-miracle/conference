"use server";

import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { parseBirth8 } from "@/lib/format";

export type BindState = {
  status:
    | "idle"
    | "invalid"
    | "not_found"
    | "taken"
    | "need_phone"
    | "phone_mismatch"
    | "ambiguous"
    | "error";
  message?: string;
};

const MESSAGES: Record<string, BindState> = {
  not_found: {
    status: "not_found",
    message:
      "신청 내역을 찾지 못했어요. 이름과 생년월일을 확인해주세요. 아직 접수 전이라면 참가 신청을 먼저 해주세요.",
  },
  taken: {
    status: "taken",
    message:
      "이미 다른 계정과 연결된 참가자예요. 본인이 맞다면 체크인 데스크에 문의해주세요.",
  },
  need_phone: {
    status: "need_phone",
    message: "같은 이름·생년월일이 두 명 이상이에요. 전화번호 뒷 4자리를 입력해주세요.",
  },
  phone_mismatch: {
    status: "phone_mismatch",
    message: "전화번호 뒷자리가 신청 정보와 일치하지 않아요.",
  },
  ambiguous: {
    status: "ambiguous",
    message: "정보만으로 구분이 어려워요. 체크인 데스크에 문의해주세요.",
  },
};

export async function bindAction(
  _prev: BindState,
  formData: FormData
): Promise<BindState> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { status: "error", message: "서버 설정 전이에요." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const name = String(formData.get("name") ?? "").trim();
  const birthRaw = String(formData.get("birth") ?? "");
  const phone4Raw = String(formData.get("phone4") ?? "").replace(/\D/g, "");

  if (!name) return { status: "invalid", message: "이름을 입력해주세요." };
  const birth = parseBirth8(birthRaw);
  if (!birth)
    return {
      status: "invalid",
      message: "생년월일 8자리를 확인해주세요. 예) 19940101",
    };
  if (phone4Raw && phone4Raw.length !== 4)
    return { status: "invalid", message: "전화번호 뒷자리는 숫자 4자리예요." };

  const { data, error } = await supabase.rpc("bind_participant", {
    p_name: name,
    p_birth: birth,
    p_phone_last4: phone4Raw || null,
  });

  if (error)
    return {
      status: "error",
      message: "연결 중 오류가 났어요. 잠시 후 다시 시도해주세요.",
    };

  const status = (data as { status?: string } | null)?.status ?? "error";
  if (status === "ok" || status === "already_bound_self") redirect("/#my");

  return (
    MESSAGES[status] ?? {
      status: "error",
      message: "연결에 실패했어요. 체크인 데스크에 문의해주세요.",
    }
  );
}
