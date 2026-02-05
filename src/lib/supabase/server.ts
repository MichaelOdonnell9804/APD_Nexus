import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  const canSetCookies = typeof (cookieStore as any).set === 'function';

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          if (!canSetCookies) return;
          (cookieStore as any).set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          if (!canSetCookies) return;
          (cookieStore as any).set({ name, value: '', ...options });
        }
      }
    }
  );
};
