"use client";

import type { ToastState } from "@/hooks/useToast";

export default function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  return <div className={`toast${toast.err ? " err" : ""}`}>{toast.text}</div>;
}
