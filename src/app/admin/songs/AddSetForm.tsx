import { createSongSet } from "../actions/songs";

export default function AddSetForm() {
  return (
    <form className="inline-form mt-22" action={createSongSet}>
      <input name="name" placeholder="집회명 (개회 예배 — CALL)" required />
      <input name="day_label" placeholder="날짜 (금 11)" className="w-110" />
      <input name="time_label" placeholder="시각 (19:30)" className="w-100" />
      <input name="leader" placeholder="찬양 인도자" className="w-110" />
      <button className="btn sm ghost">집회 추가</button>
    </form>
  );
}
