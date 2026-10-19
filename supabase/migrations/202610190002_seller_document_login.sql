begin;

alter table public.profiles add column if not exists email text;

update public.profiles p
set email = lower(trim(u.email))
from auth.users u
where u.id = p.user_id and p.email is null;

alter table public.profiles alter column email set not null;
create unique index if not exists profiles_email_unique on public.profiles (lower(email));
create index if not exists profiles_document_lookup_idx on public.profiles (document_number) where document_number is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_document_shape' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_document_shape check (
      document_number is null or (
        document_number = regexp_replace(document_number, '\D', '', 'g') and (
          (account_type = 'cpf' and char_length(document_number) = 11) or
          (account_type = 'cnpj' and char_length(document_number) = 14)
        )
      )
    );
  end if;
end
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_type public.account_type;
  chosen_document text;
  is_allowed_admin boolean;
begin
  chosen_type := case when new.raw_user_meta_data ->> 'account_type' = 'cnpj' then 'cnpj'::public.account_type else 'cpf'::public.account_type end;
  chosen_document := nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'document_number', ''), '\D', '', 'g'), '');

  select exists (select 1 from private.admin_email_allowlist allowed where allowed.email = lower(trim(new.email))) into is_allowed_admin;

  if not is_allowed_admin and (
    chosen_document is null or
    (chosen_type = 'cpf' and char_length(chosen_document) <> 11) or
    (chosen_type = 'cnpj' and char_length(chosen_document) <> 14)
  ) then
    raise exception 'INVALID_DOCUMENT';
  end if;

  insert into public.profiles(user_id, full_name, email, phone, account_type, document_number)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    lower(trim(new.email)),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    chosen_type,
    chosen_document
  );

  insert into public.seller_accounts(user_id, trading_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'trading_name'), ''));

  if is_allowed_admin then
    insert into private.admin_users(user_id) values (new.id) on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

commit;
