export interface MilestoneFormData {
  quest_id: string;
  title: string;
  display_order: string | null;
}

export function parseMilestoneFormData(formData: FormData): MilestoneFormData {
  const quest_id = formData.get('quest_id');
  const title = formData.get('title');
  const display_order = formData.get('display_order');
  if (!quest_id || !title) throw new Error('quest_id dan title wajib diisi');
  return {
    quest_id: quest_id.toString(),
    title: title.toString(),
    display_order: display_order ? display_order.toString() : null,
  };
}

export function calculateMilestoneOrder(
  displayOrderStr: string | null,
  lastOrder: number | undefined
): number {
  if (displayOrderStr !== null && displayOrderStr !== undefined) {
    return parseInt(displayOrderStr, 10);
  }
  if (lastOrder !== undefined) {
    return lastOrder + 1;
  }
  return 1;
}
