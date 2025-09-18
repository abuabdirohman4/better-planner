-- 🚀 OPTIMIZED RPC FUNCTION: Remove unused data for faster performance
-- This removes unscheduledTasks, scheduledTasks, and weekDates to reduce payload size

CREATE OR REPLACE FUNCTION get_weekly_sync_ultra_fast(
  p_year INTEGER,
  p_quarter INTEGER,
  p_week_in_quarter INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  -- 🚀 OPTIMIZED: Only return essential data (goals, progress, rules)
  -- Removed: unscheduledTasks, scheduledTasks, weekDates for faster performance
  
  WITH week_calc AS (
    SELECT 
      p_year as year,
      p_quarter as quarter,
      p_week_in_quarter as week_in_quarter,
      -- Calculate actual week number
      CASE 
        WHEN p_quarter = 1 THEN p_week_in_quarter
        WHEN p_quarter = 2 THEN p_week_in_quarter + 13
        WHEN p_quarter = 3 THEN p_week_in_quarter + 26
        WHEN p_quarter = 4 THEN p_week_in_quarter + 39
      END as week_number
  ),
  goals_data AS (
    SELECT 
      wg.id,
      wg.title,
      wg.description,
      wg.week_number,
      wg.year,
      wg.quarter,
      wg.week_in_quarter,
      wg.created_at,
      wg.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', wgi.id,
            'title', wgi.title,
            'description', wgi.description,
            'status', wgi.status::text,
            'priority', wgi.priority,
            'due_date', wgi.due_date,
            'completed_at', wgi.completed_at,
            'created_at', wgi.created_at,
            'updated_at', wgi.updated_at
          )
        ) FILTER (WHERE wgi.id IS NOT NULL),
        '[]'::json
      ) as items
    FROM weekly_goals wg
    LEFT JOIN weekly_goal_items wgi ON wg.id = wgi.weekly_goal_id
    CROSS JOIN week_calc wc
    WHERE wg.year = wc.year 
      AND wg.quarter = wc.quarter 
      AND wg.week_in_quarter = wc.week_in_quarter
    GROUP BY wg.id, wg.title, wg.description, wg.week_number, wg.year, wg.quarter, wg.week_in_quarter, wg.created_at, wg.updated_at
  ),
  progress_data AS (
    SELECT 
      wg.id as goal_id,
      wg.title as goal_title,
      COUNT(wgi.id) as total_items,
      COUNT(CASE WHEN wgi.status = 'completed' THEN 1 END) as completed_items,
      CASE 
        WHEN COUNT(wgi.id) = 0 THEN 0
        ELSE ROUND((COUNT(CASE WHEN wgi.status = 'completed' THEN 1 END)::decimal / COUNT(wgi.id)) * 100, 2)
      END as completion_percentage
    FROM weekly_goals wg
    LEFT JOIN weekly_goal_items wgi ON wg.id = wgi.weekly_goal_id
    CROSS JOIN week_calc wc
    WHERE wg.year = wc.year 
      AND wg.quarter = wc.quarter 
      AND wg.week_in_quarter = wc.week_in_quarter
    GROUP BY wg.id, wg.title
  ),
  rules_data AS (
    SELECT 
      wr.id,
      wr.title,
      wr.description,
      wr.week_number,
      wr.year,
      wr.quarter,
      wr.week_in_quarter,
      wr.created_at,
      wr.updated_at
    FROM weekly_rules wr
    CROSS JOIN week_calc wc
    WHERE wr.year = wc.year 
      AND wr.quarter = wc.quarter 
      AND wr.week_in_quarter = wc.week_in_quarter
  )
  SELECT json_build_object(
    'goals', COALESCE(json_agg(gd), '[]'::json),
    'progress', COALESCE(json_object_agg(pd.goal_id, json_build_object(
      'goal_id', pd.goal_id,
      'goal_title', pd.goal_title,
      'total_items', pd.total_items,
      'completed_items', pd.completed_items,
      'completion_percentage', pd.completion_percentage
    )), '{}'::json),
    'rules', COALESCE(json_agg(rd), '[]'::json)
    -- 🚀 REMOVED: unscheduledTasks, scheduledTasks, weekDates for performance
  ) INTO result
  FROM goals_data gd
  LEFT JOIN progress_data pd ON gd.id = pd.goal_id
  LEFT JOIN rules_data rd ON true;
  
  RETURN COALESCE(result, '{"goals":[],"progress":{},"rules":[]}'::json);
END;
$$;

-- 🚀 GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION get_weekly_sync_ultra_fast(INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_sync_ultra_fast(INTEGER, INTEGER, INTEGER) TO anon;

-- 🚀 COMMENT
COMMENT ON FUNCTION get_weekly_sync_ultra_fast(INTEGER, INTEGER, INTEGER) IS 'Ultra fast weekly sync data - optimized for mobile performance by removing unused data';

