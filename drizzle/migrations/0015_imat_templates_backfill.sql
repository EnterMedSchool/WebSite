-- Backfill template_id for existing tasks and ensure templates exist
BEGIN;

-- 1) Insert distinct templates from current user tasks
INSERT INTO imat_task_templates (day_number, task_index, label)
SELECT DISTINCT day_number, task_index, COALESCE(label, '') AS label
FROM imat_user_plan_tasks
ON CONFLICT (day_number, task_index) DO NOTHING;

-- 2) Link user tasks to template ids
UPDATE imat_user_plan_tasks t
SET template_id = tt.id
FROM imat_task_templates tt
WHERE t.template_id IS NULL
  AND t.day_number = tt.day_number
  AND t.task_index = tt.task_index;

-- 3) Optional space saving: clear duplicated labels once template is set
-- Commented for safety; uncomment after verifying reads coalesce template label.
-- UPDATE imat_user_plan_tasks SET label = NULL WHERE template_id IS NOT NULL;

COMMIT;

