// NO "use server" — pure functions, no DB calls

export interface WeeklyRuleFormData {
  ruleText: string;
  year: number;
  quarter: number;
  weekNumber: number;
}

export function parseWeeklyRuleFormData(formData: FormData): WeeklyRuleFormData {
  return {
    ruleText: formData.get('rule_text') as string,
    year: Number(formData.get('year')),
    quarter: Number(formData.get('quarter')),
    weekNumber: Number(formData.get('week_number')),
  };
}

export function calculateNextDisplayOrder(lastOrder: number | undefined): number {
  return (lastOrder ?? 0) + 1;
}

export function batchUpdateIsNoop(rules: { id: string; display_order: number }[]): boolean {
  return rules.length === 0;
}
