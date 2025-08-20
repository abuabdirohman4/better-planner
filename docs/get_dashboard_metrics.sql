
create or replace function get_dashboard_metrics(p_user_id uuid)
returns jsonb as $$
declare
  today_tasks_count int;
  active_quests_count int;
  habits_streak_count int;
  weekly_progress_percentage int;
begin
  -- Get today's tasks count
  select count(*)
  into today_tasks_count
  from daily_plan_items dpi
  join daily_plans dp on dpi.daily_plan_id = dp.id
  where dp.user_id = p_user_id and dp.plan_date = current_date;

  -- Get active quests count
  select count(*)
  into active_quests_count
  from quests
  where user_id = p_user_id and status = 'IN_PROGRESS';

  -- Get habits streak (contoh, perlu disesuaikan dengan skema habit)
  -- Untuk saat ini, kita akan return nilai statis karena tabel habit belum ada
  habits_streak_count := 0; 

  -- Get weekly progress percentage
  select
    case
      when count(*) = 0 then 0
      else round(
        (count(case when status = 'DONE' then 1 end)::decimal / count(*)::decimal) * 100
      )::int
    end
  into weekly_progress_percentage
  from daily_plan_items dpi
  join daily_plans dp on dpi.daily_plan_id = dp.id
  where dp.user_id = p_user_id and dp.plan_date >= date_trunc('week', current_date) and dp.plan_date < date_trunc('week', current_date) + interval '1 week';

  return jsonb_build_object(
    'todayTasks', today_tasks_count,
    'activeQuests', active_quests_count,
    'habitsStreak', habits_streak_count,
    'weeklyProgress', weekly_progress_percentage
  );
end;
$$ language plpgsql;



