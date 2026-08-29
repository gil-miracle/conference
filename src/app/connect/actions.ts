"use server";

import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { parseBirth8 } from "@/lib/format";

/** 조회 결과 — 요청을 보낼 수 있는 상태인지 판별한다 */
export type LookupResult =
  | { kind: "found"; name: string; birth: string; phone: string }
  | { kind: "error"; message: string; showApply?: boolean };

/** 가입 요청 결과 */
export type RequestResult =
  | { kind: "requested" }
  | { kind: "error"; message: string; showApply?: boolean };

const MESSAGES: Record<string, { message: string; showApply?: boolean }> = {
  not_found: {
    message:
      "신청 이력을 찾지 못했어요. 이름·생년월일·전화번호가 신청서와 같은지 확인해주세요. 아직 접수 전이라면 참가 신청을 먼저 해주세요.",
    showApply: true,
  },
  /*
   * 대부분은 도용이 아니라 "본인이 다른 방법으로 이미 로그인해 둔" 경우다.
   * 카톡으로 링크를 받아 카카오로 가입한 뒤, 나중에 PC에서 구글을 누르면 여기 온다.
   * 그때 "다른 사람이 잘못 연결했을 수 있어요"를 먼저 보여주면 본인이 놀란다.
   */
  taken: {
    message:
      "이미 연결된 명단이에요. 혹시 카카오나 구글 중 다른 방법으로 먼저 로그인하신 적 있나요? 처음 쓰신 방법으로 로그인하시면 바로 들어가실 수 있어요. 그래도 안 되면 운영진에 문의해주세요.",
  },
  invalid: {
    message: "이름·생년월일·전화번호를 모두 정확히 입력해주세요.",
  },
  unauthenticated: { message: "로그인이 필요해요." },
};

function normalizeInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const birth = parseBirth8(String(formData.get("birth") ?? ""));
  const phone = String(formData.get("phone") ?? "").replace(/\D/g, "");
  return { name, birth, phone };
}

/** ① 신청 명단에 있는지 확인만 한다 (아무것도 저장하지 않음) */
export async function lookupAction(
  _prev: LookupResult | null,
  formData: FormData
): Promise<LookupResult> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { kind: "error", message: "서버 설정 전이에요." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { name, birth, phone } = normalizeInput(formData);
  if (!name) return { kind: "error", message: "이름을 입력해주세요." };
  if (!birth)
    return { kind: "error", message: "생년월일 8자리를 확인해주세요. 예) 19940101" };
  if (phone.length < 10)
    return { kind: "error", message: "전화번호를 정확히 입력해주세요." };

  const { data, error } = await supabase.rpc("lookup_participant", {
    p_name: name,
    p_birth: birth,
    p_phone: phone,
  });
  if (error)
    return { kind: "error", message: "확인 중 오류가 났어요. 잠시 후 다시 시도해주세요." };

  const status = (data as { status?: string } | null)?.status ?? "error";
  if (status === "found") return { kind: "found", name, birth, phone };
  if (status === "already_requested") redirect("/profile");

  const m = MESSAGES[status] ?? { message: "확인에 실패했어요. 운영진에 문의해주세요." };
  return { kind: "error", ...m };
}

/** ② 본인이 맞다고 확인한 뒤 가입 요청을 보낸다 */
export async function requestAction(
  _prev: RequestResult | null,
  formData: FormData
): Promise<RequestResult> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { kind: "error", message: "서버 설정 전이에요." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { name, birth, phone } = normalizeInput(formData);
  if (!name || !birth || phone.length < 10)
    return { kind: "error", message: "입력값을 다시 확인해주세요." };

  const { data, error } = await supabase.rpc("bind_participant", {
    p_name: name,
    p_birth: birth,
    p_phone: phone,
  });
  if (error)
    return { kind: "error", message: "요청 중 오류가 났어요. 잠시 후 다시 시도해주세요." };

  const status = (data as { status?: string } | null)?.status ?? "error";
  if (status === "requested" || status === "already_requested") redirect("/profile");

  const m = MESSAGES[status] ?? { message: "요청에 실패했어요. 운영진에 문의해주세요." };
  return { kind: "error", ...m };
}
