'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export async function createProject(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  if (!title) {
    throw new Error('Project title is required.');
  }

  const slug = slugify(title);
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      org_id: profile.org_id,
      title,
      description,
      slug,
      status: 'active',
      created_by: profile.user_id
    })
    .select('id, slug')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from('project_members').insert({
    project_id: project.id,
    user_id: profile.user_id,
    project_role: 'owner'
  });

  revalidatePath('/projects');
  redirect(`/projects/${project.slug}`);
}

export async function joinProject(projectId: string) {
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from('project_members').insert({
    project_id: projectId,
    user_id: profile.user_id,
    project_role: 'member'
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/projects');
}

