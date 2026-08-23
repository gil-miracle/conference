"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSetting } from "../actions/settings";

/** {"value": boolean} 형태 설정의 공용 토글 카드 */
export default function ToggleSettingCard({
  settingKey,
  title,
  description,
  initialOn,
  demo,
}: {
  settingKey: string;
  title: string;
  description: string;
  initialOn: boolean;
  demo: boolean;
}) {
  const [on, setOn] = useState(initialOn);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

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
          disabled={pending || demo}
          onClick={() => {
            const next = !on;
            setOn(next);
            startTransition(async () => {
              await saveSetting(settingKey, { value: next });
              router.refresh();
            });
          }}
        />
      </div>
    </div>
  );
}
