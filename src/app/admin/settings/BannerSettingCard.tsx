"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BannerSetting } from "@/lib/types";
import { saveSetting } from "../actions/settings";

export default function BannerSettingCard({
  banner,
  demo,
}: {
  banner: BannerSetting;
  demo: boolean;
}) {
  const [text, setText] = useState(banner.text);
  const [visible, setVisible] = useState(banner.visible);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  return (
    <div className="set">
      <div className="row">
        <div>
          <b>공지 배너</b>
          <small>사이트 상단에 표시됩니다</small>
        </div>
        <button
          className="btn sm"
          disabled={pending || demo}
          onClick={() =>
            startTransition(async () => {
              await saveSetting("banner", { text: text.trim(), visible });
              router.refresh();
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            })
          }
        >
          {saved ? "저장됨 ✓" : "적용"}
        </button>
      </div>
      <input
        type="text"
        placeholder="예) 우천 시 개회 예배는 대예배실에서 진행합니다"
        value={text}
        disabled={demo}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="row" style={{ marginTop: 14 }}>
        <small>배너 노출</small>
        <button
          className={`toggle${visible ? " on" : ""}`}
          aria-label="배너 노출 토글"
          disabled={demo}
          onClick={() => setVisible(!visible)}
        />
      </div>
    </div>
  );
}
