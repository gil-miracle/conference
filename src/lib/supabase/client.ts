"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * 공개 키 — Supabase 신규 이름(PUBLISHABLE_KEY)과 기존 이름(ANON_KEY)을 모두 받는다.
 * NEXT_PUBLIC_* 은 빌드 시 정적 치환되므로 각각 리터럴로 읽어야 한다.
 */
export const SUPABASE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export function isSupabaseConfiguredClient() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && SUPABASE_PUBLIC_KEY);
}

export function getSupabaseBrowser() {
  if (!isSupabaseConfiguredClient()) return null;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    SUPABASE_PUBLIC_KEY
  );
}
