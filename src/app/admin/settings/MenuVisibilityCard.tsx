"use client";

import { useState } from "react";
import type { MenuKey, MenuVisibility } from "@/lib/types";
import { useServerAction } from "@/hooks/useServerAction";
import { useAdminDemo } from "../AdminMode";
import { saveSetting } from "../actions/settings";

const LABELS: { key: MenuKey; label: string; hint: string }[] = [
  { key: "about", label: "주제 · 장소", hint: "메인의 주제 말씀 · 지도 · 안내" },
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
export default function MenuVisibilityCard({ menus }: { menus: MenuVisibility }) {
  const [state, setState] = useState(menus);
  const { pending, run } = useServerAction();
  const demo = useAdminDemo();

  const toggle = (key: MenuKey) => {
    const next = { ...state, [key]: !state[key] };
    setState(next);
    run(() => saveSetting("menu_visibility", next));
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
              aria-pressed={state[m.key]}
              disabled={pending || demo}
              onClick={() => toggle(m.key)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
