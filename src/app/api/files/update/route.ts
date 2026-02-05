import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { fileId, name, tags, deleted } = body as {
    fileId?: string;
    name?: string;
    tags?: string[];
    deleted?: boolean;
  };

  if (!fileId) {
    return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (name) update.name = name;
  if (tags) update.tags = tags;
  if (deleted) update.deleted_at = new Date().toISOString();

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
  }

  const { error } = await supabase.from('files').update(update).eq('id', fileId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

