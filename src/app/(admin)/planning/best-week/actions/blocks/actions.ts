"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  queryBlocksByTemplateId,
  insertBlock,
  updateBlockById,
  deleteBlockById,
} from './queries';
import { validateBlockForm, toDbTime } from './logic';
import type { BlockFormData } from '@/lib/best-week/types';

export async function getBlocksForTemplate(templateId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return queryBlocksByTemplateId(supabase, templateId);
}

export async function addBlock(templateId: string, formData: BlockFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  validateBlockForm(formData);
  const block = await insertBlock(supabase, {
    template_id: templateId,
    days: formData.days,
    start_time: toDbTime(formData.start_time),
    end_time: toDbTime(formData.end_time),
    category: formData.category,
    title: formData.title.trim(),
    description: formData.description?.trim() || null,
    color: null,
  });
  revalidatePath('/planning/best-week');
  return block;
}

export async function updateBlock(blockId: string, formData: BlockFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  validateBlockForm(formData);
  await updateBlockById(supabase, blockId, {
    days: formData.days,
    start_time: toDbTime(formData.start_time),
    end_time: toDbTime(formData.end_time),
    category: formData.category,
    title: formData.title.trim(),
    description: formData.description?.trim() || null,
  });
  revalidatePath('/planning/best-week');
  return { message: 'Block berhasil diupdate' };
}

export async function deleteBlock(blockId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  await deleteBlockById(supabase, blockId);
  revalidatePath('/planning/best-week');
  return { message: 'Block berhasil dihapus' };
}
