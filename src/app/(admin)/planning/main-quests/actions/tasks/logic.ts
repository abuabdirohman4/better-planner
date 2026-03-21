export interface ParsedTaskFormData {
  milestone_id: string | null;
  title: string | null;
  parent_task_id: string | null;
  display_order: string | null;
}

export function parseTaskFormData(formData: FormData): ParsedTaskFormData {
  const milestone_id_val = formData.get('milestone_id');
  const title_val = formData.get('title');
  const parent_task_id_val = formData.get('parent_task_id');
  const display_order = formData.get('display_order');
  return {
    milestone_id: milestone_id_val ? milestone_id_val.toString() : null,
    title: title_val ? title_val.toString() : null,
    parent_task_id: parent_task_id_val ? parent_task_id_val.toString() : null,
    display_order: display_order ? display_order.toString() : null,
  };
}

export interface BuildTaskInsertParams {
  milestone_id: string | null;
  title: string | null;
  parent_task_id: string | null;
  display_order: string | null;
  lastOrder?: number;
}

export function buildTaskInsertData(
  params: BuildTaskInsertParams,
  userId: string
) {
  const { milestone_id, title, parent_task_id, display_order, lastOrder } = params;

  if (!parent_task_id && !milestone_id) {
    throw new Error('milestone_id wajib diisi untuk task utama');
  }

  const insertData: {
    milestone_id: string | null;
    title: string | null;
    status: 'TODO' | 'DONE';
    user_id: string;
    parent_task_id?: string | null;
    type?: string;
    display_order?: number;
  } = {
    milestone_id: parent_task_id ? null : milestone_id,
    title,
    status: 'TODO',
    user_id: userId,
  };

  if (parent_task_id) {
    insertData.parent_task_id = parent_task_id;
    insertData.type = 'MAIN_QUEST';
    if (display_order !== null && display_order !== undefined) {
      insertData.display_order = Number(display_order);
    }
  } else {
    insertData.type = 'MAIN_QUEST';
    if (display_order !== null && display_order !== undefined) {
      insertData.display_order = Number(display_order);
    } else {
      insertData.display_order = lastOrder ? lastOrder + 1 : 1;
    }
  }

  return insertData;
}

export function filterTasksNeedingOrderFix(
  tasks: { id: string; display_order: number | null }[]
): { id: string; display_order: number | null }[] {
  return tasks.filter(task => !task.display_order || task.display_order === 0);
}
