
create or replace function get_unscheduled_tasks_for_quarter(p_user_id uuid, p_year int, p_quarter int)
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
    and q.year = p_year
    and q.quarter = p_quarter
    and q.is_committed = true
    and t.status = 'TODO'
    and t.scheduled_date is null
    and t.parent_task_id is null;
end;
$$ language plpgsql;



