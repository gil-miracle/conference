"use client";

import { useServerAction } from "@/hooks/useServerAction";
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
  const { pending, run } = useServerAction();

  return (
    <select
      defaultValue=""
      disabled={pending}
      onChange={(e) => {
        const value = e.target.value || null;
        run(() =>
          kind === "room"
            ? assignRoom(participantId, value)
            : assignTeam(participantId, value)
        );
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
