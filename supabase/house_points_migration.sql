-- House Points Category Breakdown Migration
-- Adds category-based point tracking (Tech, Non-Tech, Cultural, Sports)
-- Safe to re-run (idempotent).

begin;

-- 1) Add category column to points_history
alter table points_history
  add column if not exists category text not null default 'general';

-- 2) Index for efficient category queries
create index if not exists points_history_house_category_idx
  on points_history(house_id, category);

create index if not exists points_history_created_at_idx
  on points_history(created_at);

-- 3) View: aggregate points per house per category
create or replace view house_category_points as
select
  h.id as house_id,
  h.name as house_name,
  h.accent,
  coalesce(ph.category, 'general') as category,
  coalesce(sum(ph.points), 0) as category_points
from houses h
left join points_history ph on ph.house_id = h.id
group by h.id, h.name, h.accent, ph.category
order by h.name, ph.category;

-- 4) The existing leaderboard view is unchanged — it already sums ALL points_history
--    regardless of category, so total_points remains correct.

commit;
