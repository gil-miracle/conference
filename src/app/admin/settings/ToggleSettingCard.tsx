"use client";

import { useState } from "react";
import { useServerAction } from "@/hooks/useServerAction";
import { useAdminDemo } from "../AdminMode";
import { saveSetting } from "../actions/settings";

/** {"value": boolean} 형태 설정의 공용 토글 카드 */
export default function ToggleSettingCard({
  settingKey,
  title,
  description,
  initialOn,
}: {
  settingKey: string;
  title: string;
  description: string;
  initialOn: boolean;
}) {
  const [on, setOn] = useState(initialOn);
  const { pending, run } = useServerAction();
  const demo = useAdminDemo();

  return (
    <div className="set">
      <div className="row">
        <div>
          <b>{title}</b>
          <small>{description}</small>
        </div>
        <button
          className={`toggle${on ? " on" : ""}`}
          aria-label={`${title} 토글`}
          aria-pressed={on}
          disabled={pending || demo}
          onClick={() => {
            const next = !on;
            setOn(next);
            run(() => saveSetting(settingKey, { value: next }));
          }}
        />
      </div>
    </div>
  );
}
