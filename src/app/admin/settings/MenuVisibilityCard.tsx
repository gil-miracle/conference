"use client";

import { useState } from "react";
import type { MenuKey, MenuVisibility } from "@/lib/types";
import { useServerAction } from "@/hooks/useServerAction";
import { useAdminDemo } from "../AdminMode";
import { saveSetting } from "../actions/settings";

const LABELS: { key: MenuKey; label: string; hint: string }[] = [
  { key: "timetable", label: "일정표", hint: "3일 일정" },
  { key: "songs", label: "찬양", hint: "집회별 곡 목록" },
  { key: "guestbook", label: "한 줄 노트", hint: "기대와 기도 제목" },
  { key: "gallery", label: "갤러리", hint: "행사 사진" },
  { key: "mentoring", label: "멘토님과의 시간", hint: "프로필 메뉴에 신청 링크" },
  { key: "standings", label: "레크리에이션 점수", hint: "프로필 메뉴에 순위 링크" },
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
