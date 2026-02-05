import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createChannel } from '@/app/channels/actions';

export default async function ProjectChannelsPage({ params }: { params: { slug: string } }) {
  const { profile } = await requireProfile();
  const supabase = createSupabaseServerClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, title')
    .eq('org_id', profile.org_id)
    .eq('slug', params.slug)
    .single();

  if (!project) {
    notFound();
  }

  const { data: channels } = await supabase
    .from('channels')
    .select('id, name, created_at')
    .eq('org_id', profile.org_id)
    .eq('project_id', project.id)
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create project channel</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createChannel} className="flex gap-2">
            <Input name="name" placeholder="#experiment-updates" required />
            <input type="hidden" name="project_id" value={project.id} />
            <Button type="submit">Create</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {channels && channels.length > 0 ? (
          channels.map((channel) => (
            <Link key={channel.id} href={`/channels/${channel.id}`} className="rounded-md border p-4">
              <p className="font-medium">#{channel.name}</p>
              <p className="text-xs text-muted-foreground">
                Created {new Date(channel.created_at).toLocaleString()}
              </p>
            </Link>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No channels yet.</p>
        )}
      </div>
    </div>
  );
}
