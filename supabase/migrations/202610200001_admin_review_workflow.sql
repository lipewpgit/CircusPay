begin;

create or replace function public.admin_review_seller(
  target_user uuid,
  decision public.seller_status,
  notes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status public.seller_status;
  submitted_documents integer;
  has_finance_account boolean;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  if decision not in ('approved', 'rejected', 'suspended') then
    raise exception 'INVALID_DECISION';
  end if;

  select status into current_status
  from public.seller_accounts
  where user_id = target_user
  for update;

  if current_status is null then
    raise exception 'SELLER_NOT_FOUND';
  end if;

  if decision in ('approved', 'rejected') and current_status <> 'pending' then
    raise exception 'SELLER_NOT_PENDING';
  end if;

  if decision = 'approved' then
    select count(*) into submitted_documents
    from public.kyc_documents
    where user_id = target_user
      and status in ('pending', 'resubmission', 'approved');

    if submitted_documents < 2 then
      raise exception 'DOCUMENTS_MISSING';
    end if;

    select exists(
      select 1 from public.finance_accounts where user_id = target_user
    ) into has_finance_account;

    if not has_finance_account then
      raise exception 'FINANCE_ACCOUNT_MISSING';
    end if;

    update public.kyc_documents
    set status = 'approved',
        rejection_reason = null,
        reviewed_at = now(),
        reviewed_by = auth.uid()
    where user_id = target_user
      and status in ('pending', 'resubmission');

    update public.finance_accounts
    set status = 'approved',
        reviewed_at = now(),
        reviewed_by = auth.uid()
    where user_id = target_user;
  elsif decision = 'rejected' then
    update public.kyc_documents
    set status = 'resubmission',
        rejection_reason = coalesce(nullif(trim(notes), ''), 'Envie novamente os documentos solicitados.'),
        reviewed_at = now(),
        reviewed_by = auth.uid()
    where user_id = target_user
      and status in ('pending', 'approved');

    update public.finance_accounts
    set status = 'resubmission',
        reviewed_at = now(),
        reviewed_by = auth.uid()
    where user_id = target_user;
  end if;

  update public.seller_accounts
  set status = decision,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      review_notes = nullif(trim(notes), '')
  where user_id = target_user;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'seller.review',
    'seller_account',
    target_user::text,
    jsonb_build_object('decision', decision, 'notes', nullif(trim(notes), ''))
  );
end;
$$;

revoke all on function public.admin_review_seller(uuid, public.seller_status, text) from public, anon;
grant execute on function public.admin_review_seller(uuid, public.seller_status, text) to authenticated;

commit;
