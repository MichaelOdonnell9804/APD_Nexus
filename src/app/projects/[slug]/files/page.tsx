import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { FileUploadDialog } from '@/components/files/file-upload-dialog';
import { FileRowActions } from '@/components/files/file-row-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ProjectFilesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, title')
    .eq('org_id', profile.org_id)
    .eq('slug', slug)
    .single();

  if (!project) {
    notFound();
  }

  const { data: files } = await supabase
    .from('files')
    .select('id, name, mime, size, tags, created_at')
    .eq('project_id', project.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Project files</h2>
          <p className="text-sm text-muted-foreground">Storage scoped to {project.title}.</p>
        </div>
        <FileUploadDialog projectId={project.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest files</CardTitle>
        </CardHeader>
        <CardContent>
          {files && files.length > 0 ? (
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.mime} • {(file.size / 1024).toFixed(1)} KB •{' '}
                      {new Date(file.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Tags: {file.tags?.join(', ') || 'none'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <FileRowActions fileId={file.id} currentName={file.name} currentTags={file.tags ?? []} />
                    <FileUploadDialog fileId={file.id} projectId={project.id} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
