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
  const {
    fileId,
    name,
    mime,
    size,
    tags = [],
    project_id: projectId,
    folder_path: folderPath = '/'
  } = body as {
    fileId?: string;
    name: string;
    mime: string;
    size: number;
    tags?: string[];
    project_id?: string | null;
    folder_path?: string;
  };

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile missing' }, { status: 400 });
  }

  let fileRecordId = fileId;
  let version = 1;
  let fileName = name;
  let fileMime = mime;
  let fileSize = size;
  let fileProjectId = projectId ?? null;

  if (fileId) {
    const { data: existing } = await supabase
      .from('files')
      .select('id, name, mime, size, project_id')
      .eq('id', fileId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const { data: latestVersion } = await supabase
      .from('file_versions')
      .select('version')
      .eq('file_id', fileId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    version = (latestVersion?.version ?? 0) + 1;
    fileName = name || existing.name;
    fileMime = mime || existing.mime;
    fileSize = size || existing.size;
    fileProjectId = existing.project_id;
  } else {
    const { data: inserted, error } = await supabase
      .from('files')
      .insert({
        org_id: profile.org_id,
        project_id: fileProjectId,
        folder_path: folderPath,
        name: fileName,
        mime: fileMime,
        size: fileSize,
        tags,
        created_by: authData.user.id
      })
      .select('id')
      .single();

    if (error || !inserted) {
      return NextResponse.json({ error: error?.message ?? 'Failed to create file' }, { status: 400 });
    }

    fileRecordId = inserted.id;
  }

  const basePath = fileProjectId
    ? `org/${profile.org_id}/project/${fileProjectId}`
    : `org/${profile.org_id}/shared`;
  const storageKey = `${basePath}/${fileRecordId}/v${version}/${fileName}`;

  const { error: versionError } = await supabase.from('file_versions').insert({
    file_id: fileRecordId,
    storage_key: storageKey,
    version,
    created_by: authData.user.id
  });

  if (versionError) {
    return NextResponse.json({ error: versionError.message }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: signed, error: signedError } = await admin
    .storage
    .from('apd-files')
    .createSignedUploadUrl(storageKey);

  if (signedError || !signed) {
    return NextResponse.json({ error: signedError?.message ?? 'Failed to sign upload' }, { status: 400 });
  }

  return NextResponse.json({
    file_id: fileRecordId,
    version,
    storage_key: storageKey,
    signed_url: signed.signedUrl
  });
}

