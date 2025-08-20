
create or replace function get_main_quests_with_details(p_user_id uuid, p_year int, p_quarter int)
returns jsonb as $$
declare
  result jsonb;
begin
  select jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'title', q.title,
      'motivation', q.motivation,
      'milestones', (
        select jsonb_agg(
          jsonb_build_object(
            'id', m.id,
            'title', m.title,
            'display_order', m.display_order,
            'tasks', (
              select jsonb_agg(
                jsonb_build_object(
                  'id', t.id,
                  'title', t.title,
                  'status', t.status,
                  'display_order', t.display_order,
                  'subtasks', (
                    select jsonb_agg(
                      jsonb_build_object(
                        'id', st.id,
                        'title', st.title,
                        'status', st.status,
                        'display_order', st.display_order
                      ) order by st.display_order
                    ) from tasks st where st.parent_task_id = t.id
                  )
                ) order by t.display_order
              ) from tasks t where t.milestone_id = m.id and t.parent_task_id is null
            )
          ) order by m.display_order
        ) from milestones m where m.quest_id = q.id
      )
    ) order by q.priority_score desc
  ) into result
  from quests q
  where q.user_id = p_user_id
    and q.year = p_year
    and q.quarter = p_quarter
    and q.is_committed = true
  limit 3;

  return result;
end;
$$ language plpgsql;



