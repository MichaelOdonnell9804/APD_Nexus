import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ProjectOverviewPage({ params }: { params: { slug: string } }) {
  const { profile } = await requireProfile();
  const supabase = createSupabaseServerClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, title, description, status, created_at, created_by')
    .eq('org_id', profile.org_id)
    .eq('slug', params.slug)
    .single();

  if (!project) {
    notFound();
  }

  const { data: members } = await supabase
    .from('project_members')
    .select('user_id, project_role, profiles(full_name, avatar_url)')
    .eq('project_id', project.id)
    .order('joined_at', { ascending: true });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">Status: {project.status}</p>
          <p>{project.description || 'No description provided yet.'}</p>
          <p className="text-muted-foreground">Created {new Date(project.created_at).toLocaleString()}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {members && members.length > 0 ? (
            members.map((member) => (
              <div key={member.user_id} className="flex items-center justify-between">
                <span>{member.profiles?.full_name || 'Member'}</span>
                <span className="text-muted-foreground">{member.project_role}</span>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No members listed.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
