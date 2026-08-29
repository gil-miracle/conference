import { getAdminContext } from "@/lib/admin";

/** 참가자 명단 CSV 다운로드 (엑셀 호환 — UTF-8 BOM) */
export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return new Response("forbidden", { status: 403 });

  const { data, error } = await ctx.supabase
    .from("participants")
    .select(
      "name,birth_date,phone,role,checked_in_at,bound_provider,rooms!participants_room_id_fkey(building,room_no),teams!participants_team_id_fkey(name)"
    )
    .order("name");
  if (error) return new Response("failed", { status: 500 });

  // 셀 앞 =+-@ 는 엑셀이 수식으로 해석 — ' 접두로 무력화 (formula injection 방지)
  const esc = (v: string | null | undefined) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t]/.test(s)) s = `'${s}`;
    return `"${s.replaceAll('"', '""')}"`;
  };
  // 다대일 임베드는 런타임에 객체지만 타입 추론은 배열 — 양쪽 다 수용
  const one = <T,>(v: T | T[] | null | undefined): T | null =>
    Array.isArray(v) ? v[0] ?? null : v ?? null;

  const header = "이름,생년월일,전화번호,역할,체크인,소셜연결,숙소,조";
  const lines = (data ?? []).map((p) => {
    const room = one(p.rooms);
    const team = one(p.teams);
    return [
      esc(p.name),
      esc(p.birth_date),
      esc(p.phone),
      esc(p.role),
      esc(p.checked_in_at ?? ""),
      esc(p.bound_provider ?? ""),
      esc(room ? `${room.building} ${room.room_no}` : ""),
      esc(team?.name ?? ""),
    ].join(",");
  });

  const csv = "﻿" + [header, ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="miracle2026-participants.csv"`,
    },
  });
}
