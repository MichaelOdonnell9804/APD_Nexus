'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';

export async function createNote(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = createSupabaseServerClient();

  const title = String(formData.get('title') || '').trim();
  const content = String(formData.get('content') || '').trim();
  const projectId = String(formData.get('project_id') || '').trim();

  if (!title || !content) {
    throw new Error('Title and content are required.');
  }

  const { data: note, error } = await supabase
    .from('notes')
    .insert({
      org_id: profile.org_id,
      project_id: projectId || null,
      title,
      content_md: content,
      created_by: profile.user_id
    })
    .select('id')
    .single();

  if (error || !note) {
    throw new Error(error?.message ?? 'Failed to create note');
  }

  await supabase.from('note_revisions').insert({
    note_id: note.id,
    content_md: content,
    created_by: profile.user_id
  });

  revalidatePath('/notes');
}

export async function updateNoteById(noteId: string, content: string) {
  const { profile } = await requireProfile();
  const supabase = createSupabaseServerClient();

  if (!noteId || !content) {
    throw new Error('Missing note update payload');
  }

  const { error } = await supabase
    .from('notes')
    .update({ content_md: content })
    .eq('id', noteId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from('note_revisions').insert({
    note_id: noteId,
    content_md: content,
    created_by: profile.user_id
  });

  revalidatePath('/notes');
}
