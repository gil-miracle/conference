"use client";

import { useState } from "react";
import type { BannerSetting } from "@/lib/types";
import { useServerAction } from "@/hooks/useServerAction";
import { useAdminDemo } from "../AdminMode";
import { saveSetting } from "../actions/settings";

export default function BannerSettingCard({ banner }: { banner: BannerSetting }) {
  const [text, setText] = useState(banner.text);
  const [visible, setVisible] = useState(banner.visible);
  const [saved, setSaved] = useState(false);
  const { pending, run } = useServerAction();
  const demo = useAdminDemo();

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
            run(async () => {
              await saveSetting("banner", { text: text.trim(), visible });
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
      <div className="row mt-14">
        <small>배너 노출</small>
        <button
          className={`toggle${visible ? " on" : ""}`}
          aria-label="배너 노출 토글"
          aria-pressed={visible}
          disabled={demo}
          onClick={() => setVisible(!visible)}
        />
      </div>
    </div>
  );
}
