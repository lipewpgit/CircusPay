begin;

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.account_type as enum ('cpf', 'cnpj');
create type public.seller_status as enum ('onboarding', 'pending', 'approved', 'rejected', 'suspended');
create type public.review_status as enum ('pending', 'approved', 'rejected', 'resubmission');
create type public.payment_status as enum ('pending', 'approved', 'rejected', 'refunded', 'cancelled', 'charged_back');
create type public.withdrawal_status as enum ('pending', 'processing', 'paid', 'rejected', 'cancelled');
create type public.ledger_status as enum ('pending', 'posted', 'voided');

create table private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table private.admin_email_allowlist (
  email text primary key check (email = lower(trim(email))),
  created_at timestamptz not null default now()
);
revoke all on table private.admin_email_allowlist from public, anon, authenticated;
insert into private.admin_email_allowlist(email)
values ('felpsted64@gmail.com');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 3 and 120),
  phone text,
  account_type public.account_type not null default 'cpf',
  document_number text,
  document_last4 text generated always as (right(regexp_replace(coalesce(document_number, ''), '\\D', '', 'g'), 4)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_document_unique
  on public.profiles ((digest(regexp_replace(document_number, '\\D', '', 'g'), 'sha256')))
  where document_number is not null;

create table public.seller_accounts (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  trading_name text,
  status public.seller_status not null default 'onboarding',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.kyc_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  document_type text not null check (document_type in ('identity_front', 'identity_back', 'selfie', 'company_document', 'address_proof', 'other')),
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  status public.review_status not null default 'pending',
  rejection_reason text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index kyc_documents_user_created_idx on public.kyc_documents(user_id, created_at desc);
create index kyc_documents_pending_idx on public.kyc_documents(status, created_at) where status in ('pending', 'resubmission');

create table public.finance_accounts (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  holder_name text not null,
  pix_key_type text not null check (pix_key_type in ('cpf', 'cnpj', 'email', 'phone', 'random')),
  pix_key text not null,
  status public.review_status not null default 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_accounts(user_id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  description text,
  price_cents bigint not null check (price_cents between 100 and 100000000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_seller_created_idx on public.products(seller_id, created_at desc);

create table public.checkout_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  seller_id uuid not null references public.seller_accounts(user_id) on delete cascade,
  slug text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index checkout_links_seller_idx on public.checkout_links(seller_id);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_accounts(user_id) on delete cascade,
  name text,
  email text,
  document_number text,
  created_at timestamptz not null default now()
);
create index customers_seller_created_idx on public.customers(seller_id, created_at desc);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_accounts(user_id),
  product_id uuid references public.products(id),
  customer_id uuid references public.customers(id),
  gross_cents bigint not null check (gross_cents > 0),
  status public.payment_status not null default 'pending',
  external_reference text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_seller_created_idx on public.orders(seller_id, created_at desc);
create index orders_seller_status_idx on public.orders(seller_id, status, created_at desc);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  seller_id uuid not null references public.seller_accounts(user_id),
  provider text not null default 'mercado_pago',
  provider_payment_id text unique,
  method text check (method in ('pix', 'card', 'boleto')),
  gross_cents bigint not null check (gross_cents > 0),
  provider_fee_cents bigint not null default 0 check (provider_fee_cents >= 0),
  platform_fee_cents bigint not null default 0 check (platform_fee_cents >= 0),
  net_cents bigint generated always as (gross_cents - provider_fee_cents - platform_fee_cents) stored,
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_seller_created_idx on public.payments(seller_id, created_at desc);
create index payments_status_created_idx on public.payments(status, created_at desc);

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_accounts(user_id),
  entry_type text not null check (entry_type in ('sale', 'refund', 'chargeback', 'withdrawal_reserve', 'withdrawal_reversal', 'adjustment')),
  amount_cents bigint not null check (amount_cents <> 0),
  status public.ledger_status not null default 'posted',
  payment_id uuid references public.payments(id),
  withdrawal_id uuid,
  description text not null,
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
create index ledger_seller_available_idx on public.ledger_entries(seller_id, status, available_at);
create unique index ledger_sale_payment_unique on public.ledger_entries(payment_id, entry_type) where payment_id is not null;

create table public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_accounts(user_id),
  requested_cents bigint not null check (requested_cents > 350),
  fee_cents bigint not null default 350 check (fee_cents = 350),
  net_cents bigint generated always as (requested_cents - fee_cents) stored,
  pix_key_type text not null,
  pix_key_snapshot text not null,
  status public.withdrawal_status not null default 'pending',
  admin_notes text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references auth.users(id)
);
alter table public.ledger_entries
  add constraint ledger_withdrawal_fk foreign key (withdrawal_id) references public.withdrawal_requests(id);
create index withdrawals_seller_created_idx on public.withdrawal_requests(seller_id, requested_at desc);
create index withdrawals_pending_idx on public.withdrawal_requests(status, requested_at) where status in ('pending', 'processing');

create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
insert into public.platform_settings(key, value) values ('withdrawal_fee_cents', '350'::jsonb);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs(created_at desc);
create index audit_logs_actor_idx on public.audit_logs(actor_id, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from private.admin_users a
    join auth.users u on u.id = a.user_id
    where a.user_id = auth.uid()
      and u.email_confirmed_at is not null
      and lower(trim(u.email)) in (
        select allowed.email from private.admin_email_allowlist allowed
      )
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.seller_is_approved(target uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1 from public.seller_accounts s
    where s.user_id = target and s.status = 'approved'
  );
$$;
revoke all on function public.seller_is_approved(uuid) from public, anon;
grant execute on function public.seller_is_approved(uuid) to authenticated;

create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute function private.touch_updated_at();
create trigger seller_accounts_touch before update on public.seller_accounts for each row execute function private.touch_updated_at();
create trigger products_touch before update on public.products for each row execute function private.touch_updated_at();
create trigger orders_touch before update on public.orders for each row execute function private.touch_updated_at();
create trigger payments_touch before update on public.payments for each row execute function private.touch_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare chosen_type public.account_type;
begin
  chosen_type := case when new.raw_user_meta_data ->> 'account_type' = 'cnpj' then 'cnpj'::public.account_type else 'cpf'::public.account_type end;
  insert into public.profiles(user_id, full_name, account_type)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)), chosen_type);
  insert into public.seller_accounts(user_id) values (new.id);
  if exists (
    select 1
    from private.admin_email_allowlist allowed
    where allowed.email = lower(trim(new.email))
  ) then
    insert into private.admin_users(user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();

create or replace view public.seller_balances
with (security_invoker = true)
as
select
  s.user_id as seller_id,
  coalesce(sum(l.amount_cents) filter (where l.status = 'posted' and l.available_at <= now()), 0)::bigint as available_cents,
  coalesce(sum(l.amount_cents) filter (where l.status = 'pending' or l.available_at > now()), 0)::bigint as held_cents
from public.seller_accounts s
left join public.ledger_entries l on l.seller_id = s.user_id
group by s.user_id;

create or replace function public.request_withdrawal(amount_cents bigint)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  account public.finance_accounts;
  available bigint;
  withdrawal_uuid uuid;
begin
  if not public.seller_is_approved(auth.uid()) then raise exception 'SELLER_NOT_APPROVED'; end if;
  if amount_cents <= 350 then raise exception 'MINIMUM_WITHDRAWAL'; end if;
  select * into account from public.finance_accounts where user_id = auth.uid() and status = 'approved';
  if account.user_id is null then raise exception 'FINANCE_ACCOUNT_NOT_APPROVED'; end if;
  select coalesce(sum(amount_cents), 0)::bigint into available
  from public.ledger_entries
  where seller_id = auth.uid() and status = 'posted' and available_at <= now();
  if available < amount_cents then raise exception 'INSUFFICIENT_BALANCE'; end if;

  insert into public.withdrawal_requests(seller_id, requested_cents, pix_key_type, pix_key_snapshot)
  values (auth.uid(), amount_cents, account.pix_key_type, account.pix_key)
  returning id into withdrawal_uuid;

  insert into public.ledger_entries(seller_id, entry_type, amount_cents, withdrawal_id, description, created_by)
  values (auth.uid(), 'withdrawal_reserve', -amount_cents, withdrawal_uuid, 'Reserva para saque', auth.uid());
  return withdrawal_uuid;
end;
$$;
revoke all on function public.request_withdrawal(bigint) from public, anon;
grant execute on function public.request_withdrawal(bigint) to authenticated;

create or replace function public.admin_review_seller(target_user uuid, decision public.seller_status, notes text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if decision not in ('approved', 'rejected', 'suspended') then raise exception 'INVALID_DECISION'; end if;
  update public.seller_accounts
  set status = decision, reviewed_at = now(), reviewed_by = auth.uid(), review_notes = notes
  where user_id = target_user;
  if not found then raise exception 'SELLER_NOT_FOUND'; end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'seller.review', 'seller_account', target_user::text, jsonb_build_object('decision', decision, 'notes', notes));
end;
$$;
revoke all on function public.admin_review_seller(uuid, public.seller_status, text) from public, anon;
grant execute on function public.admin_review_seller(uuid, public.seller_status, text) to authenticated;

create or replace function public.admin_set_withdrawal_status(target_id uuid, new_status public.withdrawal_status, notes text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare current_row public.withdrawal_requests;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into current_row from public.withdrawal_requests where id = target_id for update;
  if current_row.id is null then raise exception 'WITHDRAWAL_NOT_FOUND'; end if;
  if current_row.status in ('paid', 'rejected', 'cancelled') then raise exception 'WITHDRAWAL_FINAL'; end if;
  if new_status not in ('processing', 'paid', 'rejected', 'cancelled') then raise exception 'INVALID_STATUS'; end if;
  update public.withdrawal_requests
  set status = new_status, admin_notes = notes, processed_by = auth.uid(),
      processed_at = case when new_status in ('paid','rejected','cancelled') then now() else processed_at end
  where id = target_id;
  if new_status in ('rejected', 'cancelled') then
    insert into public.ledger_entries(seller_id, entry_type, amount_cents, withdrawal_id, description, created_by)
    values (current_row.seller_id, 'withdrawal_reversal', current_row.requested_cents, current_row.id, 'Estorno de saque', auth.uid());
  end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'withdrawal.status', 'withdrawal', target_id::text, jsonb_build_object('status', new_status, 'notes', notes));
end;
$$;
revoke all on function public.admin_set_withdrawal_status(uuid, public.withdrawal_status, text) from public, anon;
grant execute on function public.admin_set_withdrawal_status(uuid, public.withdrawal_status, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.seller_accounts enable row level security;
alter table public.kyc_documents enable row level security;
alter table public.finance_accounts enable row level security;
alter table public.products enable row level security;
alter table public.checkout_links enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.platform_settings enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select on public.profiles for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy sellers_select on public.seller_accounts for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy sellers_update_self on public.seller_accounts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and status in ('onboarding','pending','rejected'));
create policy kyc_select on public.kyc_documents for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy kyc_insert on public.kyc_documents for insert to authenticated
with check (user_id = auth.uid() and status = 'pending' and reviewed_at is null and reviewed_by is null);
create policy kyc_admin_update on public.kyc_documents for update to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy finance_select on public.finance_accounts for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy finance_insert on public.finance_accounts for insert to authenticated
with check (user_id = auth.uid() and status = 'pending' and reviewed_at is null and reviewed_by is null);
create policy finance_update_self on public.finance_accounts for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid() and status in ('pending', 'resubmission') and reviewed_at is null and reviewed_by is null);
create policy finance_update_admin on public.finance_accounts for update to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy products_select on public.products for select to authenticated using (seller_id = auth.uid() or public.is_admin());
create policy products_insert on public.products for insert to authenticated with check (seller_id = auth.uid() and public.seller_is_approved(auth.uid()));
create policy products_update on public.products for update to authenticated using (seller_id = auth.uid() or public.is_admin()) with check ((seller_id = auth.uid() and public.seller_is_approved(auth.uid())) or public.is_admin());
create policy checkout_public_read on public.checkout_links for select to anon, authenticated using (active = true or seller_id = auth.uid() or public.is_admin());
create policy checkout_owner_write on public.checkout_links for all to authenticated using (seller_id = auth.uid() or public.is_admin()) with check ((seller_id = auth.uid() and public.seller_is_approved(auth.uid())) or public.is_admin());
create policy customers_owner on public.customers for all to authenticated using (seller_id = auth.uid() or public.is_admin()) with check (seller_id = auth.uid() or public.is_admin());
create policy orders_select on public.orders for select to authenticated using (seller_id = auth.uid() or public.is_admin());
create policy payments_select on public.payments for select to authenticated using (seller_id = auth.uid() or public.is_admin());
create policy ledger_select on public.ledger_entries for select to authenticated using (seller_id = auth.uid() or public.is_admin());
create policy withdrawals_select on public.withdrawal_requests for select to authenticated using (seller_id = auth.uid() or public.is_admin());
create policy settings_admin on public.platform_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy audit_admin on public.audit_logs for select to authenticated using (public.is_admin());

create or replace function public.get_checkout(checkout_slug text)
returns table(product_id uuid, product_name text, description text, price_cents bigint, seller_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.name, p.description, p.price_cents, p.seller_id
  from public.checkout_links c
  join public.products p on p.id = c.product_id
  join public.seller_accounts s on s.user_id = p.seller_id
  where c.slug = checkout_slug and c.active and p.active and s.status = 'approved'
  limit 1;
$$;
revoke all on function public.get_checkout(text) from public;
grant execute on function public.get_checkout(text) to anon, authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('kyc-documents', 'kyc-documents', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy kyc_storage_insert on storage.objects for insert to authenticated
with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy kyc_storage_select on storage.objects for select to authenticated
using (bucket_id = 'kyc-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy kyc_storage_delete on storage.objects for delete to authenticated
using (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);

commit;
