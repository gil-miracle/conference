import { getAccessToken } from "./auth";

/** 시트 값 읽기 — 서비스 계정으로 인증해 한 범위를 통째로 가져온다 */
export async function readSheetValues(
  spreadsheetId: string,
  range: string
): Promise<string[][]> {
  const token = await getAccessToken();
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
    `/values/${encodeURIComponent(range)}?majorDimension=ROWS`;

  const res = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
    // 동기화는 사람이 버튼을 눌러 시작한다 — 캐시된 값을 주면 누른 의미가 없다
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 403)
      throw new Error(
        "시트를 읽을 권한이 없어요. 시트를 서비스 계정 이메일에 '뷰어'로 공유했는지 확인해주세요."
      );
    if (res.status === 404)
      throw new Error("시트를 찾을 수 없어요. GOOGLE_SHEETS_ID를 확인해주세요.");
    throw new Error(`시트 읽기 실패 (${res.status}) ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as { values?: string[][] };
  return json.values ?? [];
}

/** 시트 URL에서 ID만 뽑는다 — 관리자가 주소를 통째로 붙여넣어도 되게 */
export function extractSheetId(input: string): string {
  const m = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return (m ? m[1] : input).trim();
}
