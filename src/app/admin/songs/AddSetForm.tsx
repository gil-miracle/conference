import { createSongSet } from "../actions/songs";

export default function AddSetForm() {
  return (
    <form className="inline-form" action={createSongSet} style={{ marginTop: 22 }}>
      <input name="name" placeholder="집회명 (개회 예배 — CALL)" required />
      <input name="day_label" placeholder="날짜 (금 11)" style={{ maxWidth: 110 }} />
      <input name="time_label" placeholder="시각 (19:30)" style={{ maxWidth: 100 }} />
      <button className="btn sm ghost">집회 추가</button>
    </form>
  );
}
