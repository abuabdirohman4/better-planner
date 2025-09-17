-- Drop function if exists
DROP FUNCTION IF EXISTS get_weekly_sync_ultra_fast(UUID, INTEGER, INTEGER, INTEGER, DATE, DATE);

-- Create function
CREATE FUNCTION get_weekly_sync_ultra_fast(
  p_user_id UUID,
  p_year INTEGER,
  p_quarter INTEGER,
  p_week_number INTEGER,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  quest_ids UUID[];
  milestone_ids UUID[];
  weekly_goal_ids UUID[];
BEGIN
  -- Get quest IDs
  SELECT ARRAY_AGG(id) INTO quest_ids
  FROM quests 
  WHERE user_id = p_user_id 
    AND year = p_year 
    AND quarter = p_quarter 
    AND is_committed = true;

  -- Early return if no quests
  IF quest_ids IS NULL OR array_length(quest_ids, 1) = 0 THEN
    RETURN json_build_object(
      'goals', '[]'::json,
      'progress', '{}'::json,
      'rules', '[]'::json,
      'unscheduledTasks', '[]'::json,
      'scheduledTasks', '[]'::json,
      'weekDates', '[]'::json
    );
  END IF;

  -- Get milestone IDs
  SELECT ARRAY_AGG(id) INTO milestone_ids
  FROM milestones 
  WHERE quest_id = ANY(quest_ids);

  -- Get weekly goal IDs
  SELECT ARRAY_AGG(id) INTO weekly_goal_ids
  FROM weekly_goals 
  WHERE user_id = p_user_id 
    AND year = p_year 
    AND week_number = p_week_number;

  -- Build result
  SELECT json_build_object(
    'goals', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', wg.id,
          'goal_slot', wg.goal_slot,
          'items', '[]'::json
        )
      )
      FROM weekly_goals wg
      WHERE wg.id = ANY(COALESCE(weekly_goal_ids, ARRAY[]::UUID[]))
    ), '[]'::json
    ),
    'progress', '{}'::json,
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
        AND wr.week_number = p_week_number
      ), '[]'::json
    ),
    'unscheduledTasks', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', t.id,
          'title', t.title,
          'status', t.status,
          'scheduled_date', t.scheduled_date,
          'milestone_id', t.milestone_id,
          'parent_task_id', t.parent_task_id
        )
        ORDER BY t.display_order
      )
      FROM tasks t
      WHERE t.milestone_id = ANY(COALESCE(milestone_ids, ARRAY[]::UUID[]))
        AND t.status = 'TODO'
        AND t.scheduled_date IS NULL
        AND t.parent_task_id IS NULL
      ), '[]'::json
    ),
    'scheduledTasks', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', t.id,
          'title', t.title,
          'status', t.status,
          'scheduled_date', t.scheduled_date,
          'milestone_id', t.milestone_id,
          'parent_task_id', t.parent_task_id
        )
        ORDER BY t.scheduled_date, t.display_order
      )
      FROM tasks t
      WHERE t.milestone_id = ANY(COALESCE(milestone_ids, ARRAY[]::UUID[]))
        AND t.scheduled_date >= p_start_date
        AND t.scheduled_date <= p_end_date
      ), '[]'::json
    ),
    'weekDates', json_build_array(
      p_start_date,
      (p_start_date + INTERVAL '1 day')::date,
      (p_start_date + INTERVAL '2 days')::date,
      (p_start_date + INTERVAL '3 days')::date,
      (p_start_date + INTERVAL '4 days')::date,
      (p_start_date + INTERVAL '5 days')::date,
      p_end_date
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_weekly_sync_ultra_fast TO authenticated;

