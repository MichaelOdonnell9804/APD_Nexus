import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { FileUploadDialog } from '@/components/files/file-upload-dialog';
import { FileRowActions } from '@/components/files/file-row-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function FilesPage() {
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { data: files } = await supabase
    .from('files')
    .select('id, name, mime, size, tags, created_at, project_id')
    .eq('org_id', profile.org_id)
    .is('project_id', null)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Org files</h1>
          <p className="text-sm text-muted-foreground">Shared files available to the lab.</p>
        </div>
        <FileUploadDialog />
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
                      {file.mime} â€¢ {(file.size / 1024).toFixed(1)} KB â€¢{' '}
                      {new Date(file.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Tags: {file.tags?.join(', ') || 'none'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <FileRowActions fileId={file.id} currentName={file.name} currentTags={file.tags ?? []} />
                    <FileUploadDialog fileId={file.id} />
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

