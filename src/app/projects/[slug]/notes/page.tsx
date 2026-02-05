import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { createNote, updateNoteById } from '@/app/notes/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { NoteEditor } from '@/components/notes/note-editor';

export default async function ProjectNotesPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ note?: string }>;
}) {
  const { slug } = await params;
  const { note } = await searchParams;
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, title')
    .eq('org_id', profile.org_id)
    .eq('slug', slug)
    .single();

  if (!project) {
    notFound();
  }

  const { data: notes } = await supabase
    .from('notes')
    .select('id, title, updated_at')
    .eq('project_id', project.id)
    .order('updated_at', { ascending: false });

  const selectedId = note;
  const { data: selected } = selectedId
    ? await supabase
        .from('notes')
        .select('id, title, content_md, updated_at')
        .eq('id', selectedId)
        .maybeSingle()
    : { data: null };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Create note</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createNote} className="space-y-3">
              <Input name="title" placeholder="Note title" required />
              <Textarea name="content" placeholder="Write in markdown" required className="min-h-[160px]" />
              <input type="hidden" name="project_id" value={project.id} />
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{project.title} notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notes && notes.length > 0 ? (
              notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/projects/${slug}/notes?note=${note.id}`}
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
          <CardContent>
            <NoteEditor
              noteId={selected.id}
              initialContent={selected.content_md}
              onSave={async (content) => {
                'use server';
                await updateNoteById(selected.id, content);
              }}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
