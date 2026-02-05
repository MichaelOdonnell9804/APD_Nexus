'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';

export async function createChannel(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const name = String(formData.get('name') || '').trim();
  const projectId = String(formData.get('project_id') || '').trim();
  const isPrivate = Boolean(formData.get('is_private'));

  if (!name) {
    throw new Error('Channel name is required.');
  }

  const { error } = await supabase.from('channels').insert({
    org_id: profile.org_id,
    project_id: projectId || null,
    name,
    is_private: isPrivate,
    created_by: profile.user_id
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/channels');
  if (projectId) {
    revalidatePath(`/projects`);
  }
}

