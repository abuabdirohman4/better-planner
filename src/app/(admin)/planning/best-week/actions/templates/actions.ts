"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  queryActiveTemplate,
  queryAllTemplates,
  insertTemplate,
  updateTemplateActiveStatus,
  updateTemplateName,
  deleteTemplateById,
} from './queries';
import { validateTemplateName } from './logic';

export async function getActiveTemplate() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return queryActiveTemplate(supabase, user.id);
}

export async function getAllTemplates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return queryAllTemplates(supabase, user.id);
}

export async function createTemplate(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const validName = validateTemplateName(name);
  const existing = await queryActiveTemplate(supabase, user.id);
  const template = await insertTemplate(supabase, {
    user_id: user.id,
    name: validName,
    is_active: !existing,
  });
  revalidatePath('/planning/best-week');
  return template;
}

export async function setActiveTemplate(templateId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  await updateTemplateActiveStatus(supabase, user.id, templateId);
  revalidatePath('/planning/best-week');
  return { message: 'Template berhasil diaktifkan' };
}

export async function renameTemplate(templateId: string, name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const validName = validateTemplateName(name);
  await updateTemplateName(supabase, templateId, validName);
  revalidatePath('/planning/best-week');
  return { message: 'Nama template berhasil diupdate' };
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  await deleteTemplateById(supabase, templateId);
  revalidatePath('/planning/best-week');
  return { message: 'Template berhasil dihapus' };
}
