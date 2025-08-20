
create or replace function get_daily_plan_with_details(p_user_id uuid, p_plan_date date)
returns jsonb as $$
declare
  result jsonb;
begin
  select
    jsonb_build_object(
      'id', dp.id,
      'plan_date', dp.plan_date,
      'daily_plan_items', (
        select jsonb_agg(
          jsonb_build_object(
            'id', dpi.id,
            'item_id', dpi.item_id,
            'item_type', dpi.item_type,
            'status', dpi.status,
            'daily_session_target', dpi.daily_session_target,
            'title', 
              case
                when dpi.item_type = 'QUEST' then q.title
                when dpi.item_type = 'MILESTONE' then m.title
                when dpi.item_type in ('TASK', 'SUBTASK', 'SIDE_QUEST') then t.title
                else ''
              end,
            'quest_title',
              case
                when dpi.item_type = 'QUEST' then q.title
                when dpi.item_type = 'MILESTONE' then (select title from quests where id = m.quest_id)
                when dpi.item_type in ('TASK', 'SUBTASK') then (select title from quests where id = (select quest_id from milestones where id = t.milestone_id))
                else ''
              end
          )
        )
        from daily_plan_items dpi
        left join quests q on dpi.item_id = q.id and dpi.item_type = 'QUEST'
        left join milestones m on dpi.item_id = m.id and dpi.item_type = 'MILESTONE'
        left join tasks t on dpi.item_id = t.id and dpi.item_type in ('TASK', 'SUBTASK', 'SIDE_QUEST')
        where dpi.daily_plan_id = dp.id
      )
    )
  into result
  from daily_plans dp
  where dp.user_id = p_user_id and dp.plan_date = p_plan_date;

  return result;
end;
$$ language plpgsql;



