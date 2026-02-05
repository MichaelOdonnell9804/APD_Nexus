'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';

export async function updateOrgRole(formData: FormData) {
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  if (profile.org_role !== 'director') {
    throw new Error('Only directors can update roles.');
  }

  const userId = String(formData.get('user_id') || '').trim();
  const orgRole = String(formData.get('org_role') || '').trim();

  if (!userId || !orgRole) {
    throw new Error('Invalid role update.');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ org_role: orgRole })
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin');
}

