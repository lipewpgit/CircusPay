begin;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  label text not null default 'Dispositivo' check (char_length(label) between 1 and 40),
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_created_idx
  on public.push_subscriptions(user_id, created_at desc);

alter table public.push_subscriptions enable row level security;

grant select, insert, update, delete on public.push_subscriptions to authenticated;

drop policy if exists push_subscriptions_select_own on public.push_subscriptions;
create policy push_subscriptions_select_own
  on public.push_subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists push_subscriptions_insert_own on public.push_subscriptions;
create policy push_subscriptions_insert_own
  on public.push_subscriptions for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists push_subscriptions_update_own on public.push_subscriptions;
create policy push_subscriptions_update_own
  on public.push_subscriptions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists push_subscriptions_delete_own on public.push_subscriptions;
create policy push_subscriptions_delete_own
  on public.push_subscriptions for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists orders_insert_test_own on public.orders;
create policy orders_insert_test_own
  on public.orders for insert to authenticated
  with check (
    seller_id = (select auth.uid())
    and external_reference like 'test\_%' escape '\'
  );

drop policy if exists payments_insert_test_own on public.payments;
create policy payments_insert_test_own
  on public.payments for insert to authenticated
  with check (
    seller_id = (select auth.uid())
    and provider = 'syncpay_test'
    and provider_payload ->> 'test' = 'true'
  );

commit;
