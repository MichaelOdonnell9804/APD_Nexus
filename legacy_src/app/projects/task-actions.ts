'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';

export async function createTask(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = createSupabaseServerClient();

  const projectId = String(formData.get('project_id') || '').trim();
  const title = String(formData.get('title') || '').trim();
  const dueAt = String(formData.get('due_at') || '').trim();

  if (!projectId || !title) {
    throw new Error('Project and title required.');
  }

  const { error } = await supabase.from('tasks').insert({
    project_id: projectId,
    title,
    status: 'todo',
    due_at: dueAt || null,
    created_by: profile.user_id
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/projects');
}

export async function createExperimentLog(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = createSupabaseServerClient();

  const projectId = String(formData.get('project_id') || '').trim();
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const runNumbers = String(formData.get('run_numbers') || '').trim();

  if (!projectId || !title || !body) {
    throw new Error('Project, title, and body required.');
  }

  const runList = runNumbers
    ? runNumbers
        .split(',')
        .map((num) => Number(num.trim()))
        .filter((num) => !Number.isNaN(num))
    : [];

  const { error } = await supabase.from('experiment_logs').insert({
    project_id: projectId,
    title,
    body_md: body,
    run_numbers: runList,
    detector_config: {},
    created_by: profile.user_id
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/projects');
}
