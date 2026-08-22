export type ParticipantCsvRow = { name: string; birth: string; phone: string };

/**
 * 명단 CSV/TSV 파싱 — 형식: 이름,생년월일,전화번호
 * 생년월일은 19940101 / 1994-01-01 / 1994.01.01 모두 허용, 헤더 행 자동 무시.
 */
export function parseParticipantsCsv(text: string): {
  rows: ParticipantCsvRow[];
  skipped: number;
} {
  const rows: ParticipantCsvRow[] = [];
  let skipped = 0;

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const cols = trimmed
      .split(/[,\t]/)
      .map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 3) {
      skipped++;
      continue;
    }

    const [name, birthRaw, phone] = cols;
    if (name === "이름" || name.toLowerCase() === "name") continue; // 헤더

    const d = birthRaw.replace(/\D/g, "");
    if (d.length !== 8 || !name || !phone.replace(/\D/g, "")) {
      skipped++;
      continue;
    }

    rows.push({
      name,
      birth: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
      phone,
    });
  }
  return { rows, skipped };
}
