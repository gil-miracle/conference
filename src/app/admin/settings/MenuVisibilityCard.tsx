"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MenuKey, MenuVisibility } from "@/lib/types";
import { saveSetting } from "../actions/settings";

const LABELS: { key: MenuKey; label: string; hint: string }[] = [
  { key: "about", label: "About", hint: "주제·장소·오시는 길" },
  { key: "speakers", label: "Speakers", hint: "강사 소개" },
  { key: "timetable", label: "Timetable", hint: "3일 일정" },
  { key: "songs", label: "Songs", hint: "송리스트" },
  { key: "guestbook", label: "방명록", hint: "인사 남기기" },
  { key: "gallery", label: "갤러리", hint: "행사 사진" },
];

/**
 * 사이트 메뉴 노출 제어.
 * 끄면 상단 메뉴·하단 탭바·메인 요약에서 사라진다.
 * (주소를 직접 입력하면 열리므로 운영진 미리보기는 계속 가능)
 */
export default function MenuVisibilityCard({
  menus,
  demo,
}: {
  menus: MenuVisibility;
  demo: boolean;
}) {
  const [state, setState] = useState(menus);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = (key: MenuKey) => {
    const next = { ...state, [key]: !state[key] };
    setState(next);
    startTransition(async () => {
      await saveSetting("menu_visibility", next);
      router.refresh();
    });
  };

  return (
    <div className="set">
      <div className="row">
        <div>
          <b>사이트 메뉴 노출</b>
          <small>준비 중인 메뉴는 꺼두세요. 참가자 화면에서 사라집니다.</small>
        </div>
      </div>
      <div className="menu-toggles">
        {LABELS.map((m) => (
          <div className="menu-row" key={m.key}>
            <div>
              <b>{m.label}</b>
              <small>{m.hint}</small>
            </div>
            <button
              className={`toggle${state[m.key] ? " on" : ""}`}
              aria-label={`${m.label} 노출 토글`}
              disabled={pending || demo}
              onClick={() => toggle(m.key)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
