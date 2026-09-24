-- Weekly Quest items: urut milestone -> langkah -> sub task.
-- Dulu ORDER BY tasks.display_order saja, padahal itu urutan DI DALAM milestone,
-- jadi "3.1" (urutan 1 di milestone 3) muncul sebelum "2.2" (urutan 2 di milestone 2).
-- Sub task umumnya tanpa milestone_id, jadi milestone & urutannya diambil dari parent.
CREATE OR REPLACE FUNCTION public.get_weekly_sync(p_user_id uuid, p_year integer, p_quarter integer, p_week_number integer, p_start_date date, p_end_date date)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  result JSON;
  quest_ids UUID[];
  milestone_ids UUID[];
  weekly_goal_ids UUID[];
  week_date DATE;
BEGIN
  SELECT
    CASE
      WHEN p_quarter = 1 THEN MAKE_DATE(p_year, 1, 1) + INTERVAL '1 week' * (p_week_number - 1)
      WHEN p_quarter = 2 THEN MAKE_DATE(p_year, 4, 1) + INTERVAL '1 week' * (p_week_number - 1)
      WHEN p_quarter = 3 THEN MAKE_DATE(p_year, 7, 1) + INTERVAL '1 week' * (p_week_number - 1)
      WHEN p_quarter = 4 THEN MAKE_DATE(p_year, 10, 1) + INTERVAL '1 week' * (p_week_number - 1)
    END
  INTO week_date;

  SELECT ARRAY_AGG(id) INTO quest_ids
  FROM quests
  WHERE user_id = p_user_id
    AND year = p_year
    AND quarter = p_quarter
    AND is_committed = true;

  IF quest_ids IS NULL OR array_length(quest_ids, 1) = 0 THEN
    RETURN json_build_object('goals', '[]'::json, 'rules', '[]'::json);
  END IF;

  SELECT ARRAY_AGG(id) INTO milestone_ids
  FROM milestones
  WHERE quest_id = ANY(quest_ids);

  SELECT ARRAY_AGG(id) INTO weekly_goal_ids
  FROM weekly_goals
  WHERE user_id = p_user_id
    AND year = p_year
    AND quarter = p_quarter
    AND week_number = p_week_number;

  SELECT json_build_object(
    'goals', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', wg.id,
          'goal_slot', wg.goal_slot,
          'weekDate', week_date::text,
          'items', COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', wgi.id,
                'item_id', wgi.item_id,
                'title', COALESCE(t.title, 'Untitled Task'),
                'status', COALESCE(wgi.status::text, 'TODO'),
                'display_order', COALESCE(t.display_order, 1),
                'priority_score', 0,
                'quest_id', m.quest_id,
                'milestone_id', t.milestone_id,
                'parent_task_id', t.parent_task_id,
                'parent_quest_id', m.quest_id,
                'parent_quest_title', q.title,
                'parent_quest_priority_score', COALESCE(q.priority_score, 0)
              )
              ORDER BY
                COALESCE(m.quest_id, pm.quest_id),
                COALESCE(m.display_order, pm.display_order, 0),
                COALESCE(pt.display_order, t.display_order, 1),
                (t.parent_task_id IS NOT NULL),
                COALESCE(t.display_order, 1)
            )
            FROM weekly_goal_items wgi
            LEFT JOIN tasks t ON wgi.item_id = t.id
            LEFT JOIN milestones m ON t.milestone_id = m.id
            LEFT JOIN quests q ON m.quest_id = q.id
            LEFT JOIN tasks pt ON t.parent_task_id = pt.id
            LEFT JOIN milestones pm ON pt.milestone_id = pm.id
            WHERE wgi.weekly_goal_id = wg.id
            ), '[]'::json
          )
        )
        ORDER BY wg.goal_slot
      )
      FROM weekly_goals wg
      WHERE wg.id = ANY(COALESCE(weekly_goal_ids, ARRAY[]::UUID[]))
    ), '[]'::json
    ),
    'rules', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', wr.id,
          'rule_text', wr.rule_text,
          'display_order', wr.display_order
        )
        ORDER BY wr.display_order
      )
      FROM weekly_rules wr
      WHERE wr.user_id = p_user_id
        AND wr.year = p_year
        AND wr.quarter = p_quarter
        AND wr.week_number = p_week_number
      ), '[]'::json
    )
  ) INTO result;

  RETURN result;
END;
$function$;
