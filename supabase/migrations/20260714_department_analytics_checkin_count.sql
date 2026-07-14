begin;

-- Migration: Add checked_in_count to get_department_analytics
-- This extends the existing RPC to also return how many registrations per
-- department+house combination have been checked in (i.e., have a row in checkins).

create or replace function public.get_department_analytics()
returns table (
  department       text,
  house_name       text,
  total_registrations bigint,
  checked_in_count    bigint,
  percentage       numeric
)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  with department_counts as (
    select
      coalesce(nullif(trim(u.department), ''), 'Unassigned') as department,
      coalesce(nullif(trim(u.house), ''),       'Unassigned') as house_name,
      count(*)::bigint                                         as total_registrations,
      count(c.id)::bigint                                      as checked_in_count
    from public.registrations r
    join public.users u on u.id = r.user_id
    left join public.checkins c on c.registration_id = r.id
    group by 1, 2
  ),
  totals as (
    select coalesce(sum(total_registrations), 0)::numeric as grand_total
    from department_counts
  )
  select
    dc.department,
    dc.house_name,
    dc.total_registrations,
    dc.checked_in_count,
    case
      when totals.grand_total > 0
        then round((dc.total_registrations::numeric * 100) / totals.grand_total, 2)
      else 0
    end as percentage
  from department_counts dc
  cross join totals
  order by dc.total_registrations desc, dc.department asc, dc.house_name asc;
$$;

commit;
