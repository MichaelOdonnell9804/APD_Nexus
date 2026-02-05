import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { createTask } from '@/app/projects/task-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default async function ProjectTasksPage({ params }: { params: { slug: string } }) {
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

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, due_at, created_at')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create task</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTask} className="flex flex-wrap gap-2">
            <Input name="title" placeholder="Task title" required />
            <Input name="due_at" type="date" />
            <input type="hidden" name="project_id" value={project.id} />
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks && tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between border-b pb-2 text-sm">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Status: {task.status} • Created {new Date(task.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {task.due_at ? `Due ${new Date(task.due_at).toLocaleDateString()}` : 'No due date'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
