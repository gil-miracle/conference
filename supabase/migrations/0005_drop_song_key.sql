-- 송리스트에서 원키(song_key)를 쓰지 않기로 해 컬럼을 제거한다.
-- 다시 필요해지면 nullable 컬럼으로 되돌리면 된다.

alter table songs drop column if exists song_key;
