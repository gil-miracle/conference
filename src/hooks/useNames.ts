"use client";

import { useCallback, useEffect, useState } from "react";

// 주소가 /draw로 바뀐 뒤에도 키는 그대로 둔다 — 바꾸면 이미 이름을
// 넣어둔 사람의 목록이 조용히 사라진다
const KEY = "miracle.nanum.names";
/** 이름 최대 길이 — 긴 이름 하나가 칩·카드·룰렛 조각을 다 밀어낸다 */
export const MAX_NAME = 10;

/**
 * 나눔 순서를 정할 사람 목록.
 *
 * 같은 조가 사흘 내내 쓰므로 기기에 남겨둔다 — 모임 때마다 이름을 다시
 * 넣게 하면 아무도 안 쓴다. 서버에는 보내지 않는다(조원 이름은 개인정보다).
 */
export function useNames() {
  const [names, setNames] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 첫 렌더는 서버와 같아야 하므로, 저장값은 마운트 뒤에 읽는다
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setNames(JSON.parse(raw) as string[]);
    } catch {
      // 사파리 프라이빗 모드 등 — 저장이 막혀도 그냥 빈 목록으로 시작한다
    }
    setLoaded(true);
  }, []);

  const save = useCallback((next: string[]) => {
    setNames(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // 저장 실패해도 이번 세션에서는 쓸 수 있다
    }
  }, []);

  const add = useCallback(
    (raw: string) => {
      // 쉼표·줄바꿈으로 여러 명을 한 번에 붙여넣을 수 있게
      const parts = raw
        .split(/[,\n]/)
        .map((s) => s.trim().slice(0, MAX_NAME))
        .filter(Boolean);
      if (parts.length === 0) return;
      setNames((prev) => {
        const next = [...prev];
        for (const p of parts) if (!next.includes(p)) next.push(p);
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const remove = useCallback(
    (name: string) => save(names.filter((n) => n !== name)),
    [names, save]
  );

  const clear = useCallback(() => save([]), [save]);

  return { names, loaded, add, remove, clear };
}

/**
 * 좁은 칸(칩·카드·룰렛 조각)에 넣는 이름.
 * 다섯 글자부터 줄인다 — 긴 이름 하나가 칸을 밀어내면 표가 통째로 어긋난다.
 * 전체 이름은 title로 남겨 눌러 보면 알 수 있게 한다.
 */
export function shortName(name: string, max = 4) {
  return name.length > max ? `${name.slice(0, max)}…` : name;
}

/** 피셔–예이츠 — 앞에서부터 뽑아 넣어 치우침이 없다 */
export function shuffle<T>(list: readonly T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
