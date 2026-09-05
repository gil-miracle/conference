-- 웹 푸시 구독 — 관리자에게 가입 요청 알림을 보내려고 둔다.
--
-- 구독은 브라우저가 만든 주소(endpoint)와 열쇠 두 개다. 그 자체로 사람을
-- 알아볼 수는 없지만, 아무나 읽으면 남의 기기로 알림을 보낼 수 있으니
-- 본인 것만 보고 본인 것만 지운다.
--
-- 기기마다 하나씩 생긴다 — 폰에서 켰다고 노트북에도 오지 않는다.
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  participant_id uuid not null references public.participants(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_participant_idx
  on public.push_subscriptions (participant_id);

alter table public.push_subscriptions enable row level security;

-- 본인 구독만 만들고 지운다. 읽기도 본인 것만 —
-- 보내는 쪽은 service_role이라 이 정책을 지나지 않는다.
drop policy if exists "push_own" on public.push_subscriptions;
create policy "push_own" on public.push_subscriptions
  for all to authenticated
  using (participant_id = my_participant_id())
  with check (participant_id = my_participant_id());
