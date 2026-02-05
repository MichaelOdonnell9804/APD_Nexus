import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { createExperimentLog } from '@/app/projects/task-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/markdown/markdown';

export default async function ProjectLogsPage({ params }: { params: { slug: string } }) {
  const { profile } = await requireProfile();
  const supabase = createSupabaseServerClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, title')
    .eq('org_id', profile.org_id)
    .eq('slug', params.slug)
    .single();

  if (!project) {
    notFound();
  }

  const { data: logs } = await supabase
    .from('experiment_logs')
    .select('id, title, body_md, run_numbers, created_at')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create experiment log</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createExperimentLog} className="space-y-3">
            <Input name="title" placeholder="Log title" required />
            <Textarea name="body" placeholder="Markdown + LaTeX supported" required />
            <Input name="run_numbers" placeholder="Run numbers (comma separated)" />
            <input type="hidden" name="project_id" value={project.id} />
            <Button type="submit">Create log</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Experiment logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {logs && logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.id} className="rounded-md border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{log.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Runs: {log.run_numbers?.length ? log.run_numbers.join(', ') : 'none'}
                  </span>
                </div>
                <Markdown content={log.body_md} />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No experiment logs yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
