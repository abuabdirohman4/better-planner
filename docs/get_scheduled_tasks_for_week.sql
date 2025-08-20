
create or replace function get_scheduled_tasks_for_week(p_user_id uuid, p_start_date date, p_end_date date)
returns table (
  id uuid,
  title text,
  status text,
  scheduled_date date,
  milestone_id uuid,
  parent_task_id uuid
) as $$
begin
  return query
  select
    t.id,
    t.title,
    t.status,
    t.scheduled_date,
    t.milestone_id,
    t.parent_task_id
  from tasks t
  inner join milestones m on t.milestone_id = m.id
  inner join quests q on m.quest_id = q.id
  where
    q.user_id = p_user_id
    and q.is_committed = true
    and t.scheduled_date >= p_start_date
    and t.scheduled_date <= p_end_date;
end;
$$ language plpgsql;



