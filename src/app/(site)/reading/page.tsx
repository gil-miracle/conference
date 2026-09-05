import { redirect } from "next/navigation";
import { READING_CHAPTERS } from "@/lib/bible";

/** /reading 은 첫 장으로 — 일정표에서 오는 링크가 이 주소다 */
export default function ReadingPage() {
  redirect(`/reading/${READING_CHAPTERS[0]}`);
}
