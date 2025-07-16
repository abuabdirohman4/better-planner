-- ========= PERFORMANCE OPTIMIZATION: WEEKLY SYNC RPC FUNCTION =========
-- This function replaces multiple server-side queries with a single database call
-- Reduces network roundtrips from 5+ to 1, improving performance from 30-50s to <5s

CREATE OR REPLACE FUNCTION get_weekly_sync_data(
    p_user_id UUID,
    p_year INTEGER,
    p_week_number INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB := '[]'::JSONB;
    weekly_goal_record RECORD;
    goal_item_record RECORD;
    current_goal JSONB;
    goal_items JSONB := '[]'::JSONB;
    goal_item JSONB;
    quest_info RECORD;
    milestone_info RECORD;
    task_info RECORD;
    parent_quest_info RECORD;
BEGIN
    -- Main loop: Process each goal slot (1, 2, 3)
    FOR weekly_goal_record IN
        SELECT 
            wg.id,
            wg.goal_slot
        FROM weekly_goals wg
        WHERE wg.user_id = p_user_id
        AND wg.year = p_year
        AND wg.week_number = p_week_number
        ORDER BY wg.goal_slot
    LOOP
        -- Reset goal items for each goal slot
        goal_items := '[]'::JSONB;
        
        -- Get all items for this weekly goal
        FOR goal_item_record IN
            SELECT 
                wgi.id,
                wgi.item_id,
                wgi.item_type
            FROM weekly_goal_items wgi
            WHERE wgi.weekly_goal_id = weekly_goal_record.id
        LOOP
            -- Initialize goal item with basic info
            goal_item := jsonb_build_object(
                'id', goal_item_record.id,
                'item_id', goal_item_record.item_id,
                'item_type', goal_item_record.item_type,
                'title', '',
                'status', 'TODO',
                'display_order', 0,
                'priority_score', 0,
                'quest_id', null,
                'milestone_id', null,
                'parent_task_id', null,
                'parent_quest_id', null,
                'parent_quest_title', null,
                'parent_quest_priority_score', 0
            );
            
            -- Handle different item types
            IF goal_item_record.item_type = 'QUEST' THEN
                -- Get quest information
                SELECT 
                    q.title,
                    q.status,
                    q.priority_score
                INTO quest_info
                FROM quests q
                WHERE q.id = goal_item_record.item_id
                AND q.user_id = p_user_id;
                
                IF FOUND THEN
                    goal_item := goal_item || jsonb_build_object(
                        'title', COALESCE(quest_info.title, ''),
                        'status', COALESCE(quest_info.status, 'TODO'),
                        'priority_score', COALESCE(quest_info.priority_score, 0),
                        'quest_id', goal_item_record.item_id,
                        'parent_quest_id', goal_item_record.item_id,
                        'parent_quest_title', COALESCE(quest_info.title, ''),
                        'parent_quest_priority_score', COALESCE(quest_info.priority_score, 0)
                    );
                END IF;
                
            ELSIF goal_item_record.item_type = 'MILESTONE' THEN
                -- Get milestone information with parent quest
                -- Note: milestones table doesn't have status column
                SELECT 
                    m.title,
                    m.display_order,
                    m.quest_id,
                    q.title as parent_quest_title,
                    q.priority_score as parent_quest_priority_score
                INTO milestone_info
                FROM milestones m
                LEFT JOIN quests q ON m.quest_id = q.id
                WHERE m.id = goal_item_record.item_id;
                
                IF FOUND THEN
                    goal_item := goal_item || jsonb_build_object(
                        'title', COALESCE(milestone_info.title, ''),
                        'status', 'TODO', -- Default status since milestones don't have status column
                        'display_order', COALESCE(milestone_info.display_order, 0),
                        'quest_id', milestone_info.quest_id,
                        'milestone_id', goal_item_record.item_id,
                        'parent_quest_id', milestone_info.quest_id,
                        'parent_quest_title', COALESCE(milestone_info.parent_quest_title, ''),
                        'parent_quest_priority_score', COALESCE(milestone_info.parent_quest_priority_score, 0)
                    );
                END IF;
                
            ELSIF goal_item_record.item_type IN ('TASK', 'SUBTASK') THEN
                -- Get task information with parent quest and milestone
                -- Fixed: Follow correct hierarchy tasks → milestones → quests
                SELECT 
                    t.title,
                    t.status,
                    t.display_order,
                    m.quest_id,
                    t.milestone_id,
                    t.parent_task_id,
                    q.title as parent_quest_title,
                    q.priority_score as parent_quest_priority_score
                INTO task_info
                FROM tasks t
                LEFT JOIN milestones m ON t.milestone_id = m.id
                LEFT JOIN quests q ON m.quest_id = q.id
                WHERE t.id = goal_item_record.item_id;
                
                IF FOUND THEN
                    goal_item := goal_item || jsonb_build_object(
                        'title', COALESCE(task_info.title, ''),
                        'status', COALESCE(task_info.status, 'TODO'),
                        'display_order', COALESCE(task_info.display_order, 0),
                        'quest_id', task_info.quest_id,
                        'milestone_id', task_info.milestone_id,
                        'parent_task_id', task_info.parent_task_id,
                        'parent_quest_id', task_info.quest_id,
                        'parent_quest_title', COALESCE(task_info.parent_quest_title, ''),
                        'parent_quest_priority_score', COALESCE(task_info.parent_quest_priority_score, 0)
                    );
                END IF;
            END IF;
            
            -- Add goal item to the items array
            goal_items := goal_items || goal_item;
        END LOOP;
        
        -- Build the complete goal object
        current_goal := jsonb_build_object(
            'id', weekly_goal_record.id,
            'goal_slot', weekly_goal_record.goal_slot,
            'items', goal_items
        );
        
        -- Add to result array
        result := result || current_goal;
    END LOOP;
    
    RETURN result;
END;
$$;

-- ========= PROGRESS CALCULATION OPTIMIZATION =========
-- This function replaces calculateBatchGoalProgress with a single database call
-- Reduces multiple queries to 1, improving performance significantly

CREATE OR REPLACE FUNCTION calculate_weekly_goals_progress(
    p_user_id UUID,
    p_year INTEGER,
    p_week_number INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB := '{}'::JSONB;
    goal_record RECORD;
    progress_data JSONB;
    total_items INTEGER;
    completed_items INTEGER;
    percentage INTEGER;
BEGIN
    -- Loop through each goal slot
    FOR goal_record IN
        SELECT 
            wg.goal_slot,
            wg.id as weekly_goal_id
        FROM weekly_goals wg
        WHERE wg.user_id = p_user_id
        AND wg.year = p_year
        AND wg.week_number = p_week_number
        ORDER BY wg.goal_slot
    LOOP
        -- Calculate progress for this goal slot
        -- Note: milestones don't have status, so we calculate milestone completion differently
        SELECT 
            COUNT(*) as total,
            COUNT(CASE 
                WHEN wgi.item_type = 'QUEST' AND q.status = 'DONE' THEN 1
                WHEN wgi.item_type = 'MILESTONE' THEN 
                    -- Milestone is "complete" if all its tasks are done
                    CASE WHEN NOT EXISTS (
                        SELECT 1 FROM tasks mt 
                        WHERE mt.milestone_id = wgi.item_id 
                        AND mt.status != 'DONE'
                    ) AND EXISTS (
                        SELECT 1 FROM tasks mt 
                        WHERE mt.milestone_id = wgi.item_id
                    ) THEN 1 ELSE NULL END
                WHEN wgi.item_type IN ('TASK', 'SUBTASK') AND t.status = 'DONE' THEN 1
                ELSE NULL
            END) as completed
        INTO total_items, completed_items
        FROM weekly_goal_items wgi
        LEFT JOIN quests q ON wgi.item_type = 'QUEST' AND wgi.item_id = q.id
        LEFT JOIN milestones m ON wgi.item_type = 'MILESTONE' AND wgi.item_id = m.id
        LEFT JOIN tasks t ON wgi.item_type IN ('TASK', 'SUBTASK') AND wgi.item_id = t.id
        WHERE wgi.weekly_goal_id = goal_record.weekly_goal_id;
        
        -- Calculate percentage
        IF total_items > 0 THEN
            percentage := ROUND((completed_items::FLOAT / total_items::FLOAT) * 100);
        ELSE
            percentage := 0;
        END IF;
        
        -- Build progress object for this goal slot
        progress_data := jsonb_build_object(
            'completed', completed_items,
            'total', total_items,
            'percentage', percentage
        );
        
        -- Add to result
        result := result || jsonb_build_object(goal_record.goal_slot::TEXT, progress_data);
    END LOOP;
    
    RETURN result;
END;
$$;

-- ========= SECURITY & PERFORMANCE OPTIMIZATIONS =========

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_weekly_sync_data(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_weekly_goals_progress(UUID, INTEGER, INTEGER) TO authenticated;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_year_week 
ON weekly_goals(user_id, year, week_number, goal_slot);

CREATE INDEX IF NOT EXISTS idx_weekly_goal_items_weekly_goal_id 
ON weekly_goal_items(weekly_goal_id);

CREATE INDEX IF NOT EXISTS idx_weekly_goal_items_item_id_type 
ON weekly_goal_items(item_id, item_type);

CREATE INDEX IF NOT EXISTS idx_quests_user_id_id 
ON quests(user_id, id);

CREATE INDEX IF NOT EXISTS idx_milestones_id_quest_id 
ON milestones(id, quest_id);

CREATE INDEX IF NOT EXISTS idx_tasks_id_milestone_id 
ON tasks(id, milestone_id);

-- Additional indexes for progress calculation optimization
CREATE INDEX IF NOT EXISTS idx_quests_id_status 
ON quests(id, status);

-- Note: milestones table doesn't have status column, so no status index needed

CREATE INDEX IF NOT EXISTS idx_tasks_id_status 
ON tasks(id, status);

-- ========= USAGE EXAMPLES =========
-- SELECT get_weekly_sync_data('user_id_here', 2025, 15);
-- Returns: Complete weekly goals data with all necessary joins in one call

-- SELECT calculate_weekly_goals_progress('user_id_here', 2025, 15);
-- Returns: Progress data for all goal slots in one call 