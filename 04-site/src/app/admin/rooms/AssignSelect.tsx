"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignRoom } from "../actions/rooms";
import { assignTeam } from "../actions/teams";

/** 미배정 인원 전용 배정 셀렉트 */
export default function AssignSelect({
  kind,
  participantId,
  options,
}: {
  kind: "room" | "team";
  participantId: string;
  options: { value: string; label: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      defaultValue=""
      disabled={pending}
      onChange={(e) => {
        const value = e.target.value || null;
        startTransition(async () => {
          if (kind === "room") await assignRoom(participantId, value);
          else await assignTeam(participantId, value);
          router.refresh();
        });
      }}
    >
      <option value="">— 선택 —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
