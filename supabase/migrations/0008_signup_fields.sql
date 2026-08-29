-- 신청서에서 함께 들어오는 정보
--
-- 구글 폼 응답 시트에는 이름·생년월일·전화번호 말고도 운영에 쓰는 값들이 있다.
-- 다락방은 조 편성의 출발점이고, 도착 요일·시간은 체크인 데스크가 "오늘 몇 시에
-- 몇 명 오는지"를 알아야 하며, 숙박일은 숙소 배정에 직접 쓰인다.
-- 시트를 매번 열어 대조하지 않도록 명단과 같은 자리에 둔다.
--
-- 전부 nullable text다. 폼의 선택지 문구가 해마다 바뀌므로 값을 제약하지 않는다 —
-- 여기서 check를 걸면 폼 문구 한 글자 바뀔 때 동기화가 통째로 실패한다.
--
-- ⚠️ 주민등록번호는 가져오지 않는다. 필요한 건 생년월일뿐이고, 고유식별정보는
--    받는 순간 지켜야 할 것이 급격히 늘어난다. 시트에서 앞 6자리만 넘겨받는다.

alter table participants
  add column if not exists applicant_type text,   -- 길 공동체 지체 | 초청 받은 지체
  add column if not exists cell_group text,       -- 다락방 (BEGIN/BASIC/BEYOND/CORNERSTONE)
  add column if not exists inviter text,          -- 초청자 이름 (초청 받은 지체만)
  add column if not exists transport text,        -- 오는 방법
  add column if not exists arrive_day text,       -- 도착 요일
  add column if not exists arrive_time text,      -- 도착 시간
  add column if not exists stay text,             -- 숙박일
  add column if not exists tshirt text;           -- 단체 티셔츠 사이즈

-- 체크인 데스크에서 "오늘 도착"으로 추리는 조회 + 조 편성 때 다락방 묶음 조회
create index if not exists participants_arrive_day_idx on participants (arrive_day);
create index if not exists participants_cell_group_idx on participants (cell_group);
