"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Toast from "@/components/Toast";
import { useConfirm } from "@/components/Confirm";
import { useToast } from "@/hooks/useToast";
import { ADMIN_POLL_MS, jsonFetcher } from "@/lib/fetcher";
import { byKind, groupKind } from "@/lib/format";
import { SIGNUP_FIELDS } from "@/lib/participant-fields";
import { useAdminDemo } from "../AdminMode";
import { useRosterFilter } from "../RosterFilter";
import type { AdminParticipant, AdminRoom, AdminTeam } from "@/lib/types";
import { setCheckin, unbindParticipant } from "../actions/checkin";
import ParticipantRow from "./ParticipantRow";
import ParticipantDetail from "./ParticipantDetail";
import AddParticipant from "./AddParticipant";

const DEMO_MSG = "미리보기 모드 — 변경사항은 저장되지 않아요.";

/* 고른 값이 곧 화면에 적히는 말이다 — 코드와 글이 갈라지지 않게 한 곳에 둔다 */
export default function CheckinPanel({
  rooms,
  teams,
}: {
  rooms: AdminRoom[];
  teams: AdminTeam[];
}) {
  const [q, setQ] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const { toast, showToast } = useToast();
  const demo = useAdminDemo();
  const confirm = useConfirm();

  const { data, mutate, isLoading } = useSWR<AdminParticipant[]>(
    `/api/admin/participants?q=${encodeURIComponent(q)}`,
    jsonFetcher<AdminParticipant[]>,
    { refreshInterval: ADMIN_POLL_MS, keepPreviousData: true },
  );

  /* 거르개는 숙소 배정과 같은 한 벌(RosterFilter) — 여기서만 「관리자만」이 붙는다 */
  const {
    bar: filterBar,
    match,
    filtered,
    clear: clearFilters,
  } = useRosterFilter(data, { admin: true });

  /* 상세는 id로만 들고 목록에서 다시 찾는다 — 객체를 붙들고 있으면 저장·해제
     뒤에도 옛 값을 보여주고, 지워진 사람이 계속 떠 있는다 */
  const detail = (data ?? []).find((p) => p.id === detailId) ?? null;

  async function onToggleCheckin(p: AdminParticipant) {
    if (demo) return showToast(DEMO_MSG);
    if (
      p.checked_in_at &&
      !(await confirm({
        message: `${p.name} 체크인을 취소할까요?`,
        confirmLabel: "취소하기",
        danger: true,
      }))
    )
      return;
    const res = await setCheckin(p.id, !p.checked_in_at);
    if (!res.ok) showToast("처리에 실패했어요.", true);
    mutate();
  }

  async function onUnbind(p: AdminParticipant) {
    if (demo) return showToast(DEMO_MSG);
    const ok = await confirm({
      message: `${p.name}의 소셜 계정 연결을 해제할까요? 본인이 다시 로그인해 명단과 연결해야 해요.`,
      confirmLabel: "연결 해제",
      danger: true,
    });
    if (!ok) return;
    const res = await unbindParticipant(p.id);
    if (!res.ok) showToast("해제에 실패했어요.", true);
    else showToast("연결을 해제했어요.");
    mutate();
  }

  /* 신청 항목은 자유 문구라 고정 선택지를 둘 수 없다 — 이미 쓰인 값을 폼에
     후보로 넘겨 손으로 넣는 사람도 같은 문구를 쓰게 한다 */
  const options = useMemo(() => {
    const o: Record<string, string[]> = {};
    for (const f of SIGNUP_FIELDS)
      o[f.key] = [
        ...new Set(
          (data ?? []).map((p) => p[f.key]).filter(Boolean) as string[],
        ),
      ].sort();
    return o;
  }, [data]);

  const shown = (data ?? []).filter(match);

  /*
   * 지체 · 교역자 · 멘토 셋으로 나눈다.
   *
   * 다락방 이름으로 나눴더니 한두 줄짜리 칸이 열몇 개 생겨 되레 훑기 어려웠다.
   * 데스크에서 보는 큰 갈래는 「우리 지체인가, 섬기러 오신 분인가」다 —
   * 다락방은 줄마다 붙는 배지에 남는다.
   */
  const sections = (() => {
    const by = new Map<string, AdminParticipant[]>();
    for (const p of shown) {
      const key = groupKind(p);
      const list = by.get(key);
      if (list) list.push(p);
      else by.set(key, [p]);
    }
    return [...by.entries()].sort((a, b) => byKind(a[0], b[0]));
  })();

  return (
    <>
      {/* 추가 단추는 제목 오른쪽 — 숙소의 방 추가, 조의 조 추가와 같은 자리 */}
      <div className="sec-title">
        <b>참가자 명단</b>
        <button
          className="btn sm ghost sec-add"
          onClick={() => setAdding(true)}
        >
          ＋ 참가자 추가
        </button>
      </div>
      <div className="search">
        <input
          placeholder="이름 또는 전화번호 뒷자리 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {/* 걸어 둔 조건이 하나라도 있으면 아래 초기화가 나온다 */}
      {filterBar}

      {/* 거르개가 아닌 것들 — 줄을 나눠야 위 칸들이 나란히 선다 */}
      <div className="filters-foot">
        {/* 걸린 것이 없으면 아예 없다. 흐리게 두면 눌리지도 않는 것이 호버에
            반응해 테두리만 생긴다 — 있는 것도 없는 것도 아닌 꼴이 된다 */}
        {filtered && (
          <button className="fclear" onClick={clearFilters}>
            초기화
          </button>
        )}
        <span className="fcount">
          {data ? (
            <>
              {data.length}명 중 <b>{shown.length}</b>명
            </>
          ) : (
            ""
          )}
        </span>
      </div>
      <div className="plist">
        {isLoading && !data && (
          <div className="p-row">
            <div className="info">
              <small>불러오는 중…</small>
            </div>
          </div>
        )}
        {data && shown.length === 0 && (
          <div className="p-row">
            <div className="info">
              <small>
                {q || filtered
                  ? "조건에 맞는 사람이 없어요."
                  : "참가자 명단이 비어 있어요 — 설정 탭에서 동기화하세요."}
              </small>
            </div>
          </div>
        )}
        {sections.map(([name, list]) => (
          <div key={name} className="pgroup">
            <div className="pgroup-head">
              <b>{name}</b>
              <span>
                {list.filter((p) => p.checked_in_at).length} / {list.length}
              </span>
            </div>
            {list.map((participant) => (
              <ParticipantRow
                key={participant.id}
                participant={participant}
                onToggleCheckin={() => onToggleCheckin(participant)}
                onOpen={() => setDetailId(participant.id)}
              />
            ))}
          </div>
        ))}
      </div>
      <ParticipantDetail
        participant={detail}
        rooms={rooms}
        teams={teams}
        options={options}
        onClose={() => setDetailId(null)}
        onChanged={() => mutate()}
        onUnbind={() => detail && onUnbind(detail)}
        onDeleted={(message) => {
          setDetailId(null);
          showToast(message);
          mutate();
        }}
      />
      <AddParticipant
        open={adding}
        options={options}
        note="신청서 없이 온 분들입니다. 현장접수는 지체로 집계되고, 체크인은 똑같이 됩니다."
        onClose={() => setAdding(false)}
        onAdded={(message) => {
          setAdding(false);
          showToast(message);
          mutate();
        }}
      />

      <Toast toast={toast} />
    </>
  );
}
