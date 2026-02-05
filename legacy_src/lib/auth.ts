import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getUserAndProfile() {
  const supabase = createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, org_id, full_name, org_role, avatar_url')
    .eq('user_id', user.id)
    .single();

  return {
    user,
    profile: profile
      ? {
          ...profile,
          email: user.email ?? null
        }
      : null
  };
}

export async function requireProfile() {
  const { user, profile } = await getUserAndProfile();
  if (!user) {
    redirect('/login');
  }
  if (!profile) {
    redirect('/login?missing_profile=1');
  }
  return { user, profile };
}
