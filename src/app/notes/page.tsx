import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { createNote, updateNoteById } from '@/app/notes/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { NoteEditor } from '@/components/notes/note-editor';

export default async function NotesPage({ searchParams }: { searchParams: Promise<{ note?: string }> }) {
  const { note } = await searchParams;
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { data: notes } = await supabase
    .from('notes')
    .select('id, title, updated_at')
    .eq('org_id', profile.org_id)
    .is('project_id', null)
    .order('updated_at', { ascending: false });

  const selectedId = note;
  const { data: selected } = selectedId
    ? await supabase
        .from('notes')
        .select('id, title, content_md, updated_at')
        .eq('id', selectedId)
        .maybeSingle()
    : { data: null };

  const { data: revisions } = selected
    ? await supabase
        .from('note_revisions')
        .select('id, created_at')
        .eq('note_id', selected.id)
        .order('created_at', { ascending: false })
        .limit(5)
    : { data: null };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Org notes</h1>
          <p className="text-sm text-muted-foreground">Markdown notes scoped to the full lab.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Create note</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createNote} className="space-y-3">
              <Input name="title" placeholder="Note title" required />
              <Textarea name="content" placeholder="Write in markdown" required className="min-h-[160px]" />
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notes && notes.length > 0 ? (
              notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes?note=${note.id}`}
                  className={`block rounded-md border p-3 text-sm ${
                    selected?.id === note.id ? 'border-primary' : ''
                  }`}
                >
                  <p className="font-medium">{note.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(note.updated_at).toLocaleString()}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {selected ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit: {selected.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NoteEditor
              noteId={selected.id}
              initialContent={selected.content_md}
              onSave={async (content) => {
                'use server';
                await updateNoteById(selected.id, content);
              }}
            />
            {revisions && revisions.length > 0 ? (
              <div className="text-xs text-muted-foreground">
                Recent revisions: {revisions.map((rev) => new Date(rev.created_at).toLocaleString()).join(' â€¢ ')}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

