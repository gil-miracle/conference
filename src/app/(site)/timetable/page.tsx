import { redirect } from "next/navigation";
import { TIMETABLE } from "@/lib/content";

/** /timetable 은 첫 날로 — 메뉴에서 오는 링크가 이 주소다 */
export default function TimetablePage() {
  redirect(`/timetable/${TIMETABLE[0].day}`);
}
