"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  queryLastRuleDisplayOrder,
  insertWeeklyRule,
  updateWeeklyRuleText,
  deleteWeeklyRuleById,
  updateRuleDisplayOrder,
} from './queries';
import {
  parseWeeklyRuleFormData,
  calculateNextDisplayOrder,
  batchUpdateIsNoop,
} from './logic';

export async function addWeeklyRule(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'User not found' };

  const { ruleText, year, quarter, weekNumber } = parseWeeklyRuleFormData(formData);

  try {
    const lastOrder = await queryLastRuleDisplayOrder(supabase, user.id, year, quarter, weekNumber);
    const nextOrder = calculateNextDisplayOrder(lastOrder);
    const inserted = await insertWeeklyRule(supabase, {
      userId: user.id,
      ruleText,
      year,
      quarter,
      weekNumber,
      displayOrder: nextOrder,
    });
    revalidatePath('/execution/weekly-sync');
    return { success: true, message: 'Aturan berhasil ditambahkan!', id: inserted?.id };
  } catch (error) {
    console.error('Error adding weekly rule:', error);
    return { success: false, message: 'Gagal menambah aturan' };
  }
}

export async function updateWeeklyRule(id: string, newText: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'User not found' };

  try {
    await updateWeeklyRuleText(supabase, id, user.id, newText);
    revalidatePath('/execution/weekly-sync');
    return { success: true, message: 'Aturan berhasil diupdate!' };
  } catch (error) {
    console.error('Error updating weekly rule:', error);
    return { success: false, message: 'Gagal update aturan' };
  }
}

export async function deleteWeeklyRule(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'User not found' };

  try {
    await deleteWeeklyRuleById(supabase, id, user.id);
    revalidatePath('/execution/weekly-sync');
    return { success: true, message: 'Aturan berhasil dihapus!' };
  } catch (error) {
    console.error('Error deleting weekly rule:', error);
    return { success: false, message: 'Gagal menghapus aturan' };
  }
}

export async function updateWeeklyRuleOrder(rules: { id: string; display_order: number }[]) {
  const supabase = await createClient();
  if (batchUpdateIsNoop(rules)) {
    return { success: true };
  }
  try {
    for (const rule of rules) {
      await updateRuleDisplayOrder(supabase, rule.id, rule.display_order);
    }
    revalidatePath('/execution/weekly-sync');
    return { success: true };
  } catch (error) {
    console.error('Error updating weekly rule order:', error);
    return { success: false, message: 'Gagal update urutan aturan' };
  }
}
