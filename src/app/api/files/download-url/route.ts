import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { fileId } = body as { fileId?: string };

  if (!fileId) {
    return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
  }

  const { data: latestVersion } = await supabase
    .from('file_versions')
    .select('storage_key')
    .eq('file_id', fileId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestVersion) {
    return NextResponse.json({ error: 'File version not found' }, { status: 404 });
  }

  const admin = supabaseAdmin();
  const { data: signed, error } = await admin
    .storage
    .from('apd-files')
    .createSignedUrl(latestVersion.storage_key, 60 * 5);

  if (error || !signed) {
    return NextResponse.json({ error: error?.message ?? 'Failed to sign download' }, { status: 400 });
  }

  return NextResponse.json({ signed_url: signed.signedUrl });
}

