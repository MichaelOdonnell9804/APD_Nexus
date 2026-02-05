'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';

export async function createAnnouncement(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const priority = String(formData.get('priority') || 'normal').trim();
  const expiresAt = String(formData.get('expires_at') || '').trim();
  const projectId = String(formData.get('project_id') || '').trim();

  if (!title || !body) {
    throw new Error('Title and body required.');
  }

  const { error } = await supabase.from('announcements').insert({
    org_id: profile.org_id,
    project_id: projectId || null,
    title,
    body,
    priority,
    expires_at: expiresAt || null,
    created_by: profile.user_id
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/announcements');
}

export async function markAnnouncementRead(announcementId: string) {
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  await supabase.from('announcement_reads').upsert({
    announcement_id: announcementId,
    user_id: profile.user_id,
    read_at: new Date().toISOString()
  });

  revalidatePath('/announcements');
}

