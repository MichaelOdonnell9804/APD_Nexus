import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { isStaffOrDirector } from '@/lib/roles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createProject } from '@/app/projects/actions';

export default async function ProjectsPage() {
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, slug, title, description, status, project_members(user_id, project_role)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">Organize lab work into scoped collaboration spaces.</p>
        </div>
      </div>

      {isStaffOrDirector(profile.org_role) ? (
        <Card>
          <CardHeader>
            <CardTitle>Create a project</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createProject} className="grid gap-4 md:grid-cols-2">
              <Input name="title" placeholder="Project title" required />
              <Textarea name="description" placeholder="Short description" className="md:col-span-2" />
              <Button type="submit" className="md:col-span-2">Create project</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {projects && projects.length > 0 ? (
          projects.map((project) => {
            const membership = project.project_members?.find(
              (member) => member.user_id === profile.user_id
            );
            return (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{project.description || 'No description yet.'}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status: {project.status}</span>
                    <span>{membership ? `Role: ${membership.project_role}` : 'Not a member'}</span>
                  </div>
                  <Link className="text-sm text-primary underline" href={`/projects/${project.slug}`}>
                    Open project
                  </Link>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">No projects yet.</p>
        )}
      </div>
    </div>
  );
}

