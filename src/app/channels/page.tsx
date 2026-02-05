import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { isStaffOrDirector } from '@/lib/roles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createChannel } from '@/app/channels/actions';

export default async function OrgChannelsPage() {
  const { profile } = await requireProfile();
  const supabase = createSupabaseServerClient();

  const { data: channels } = await supabase
    .from('channels')
    .select('id, name, created_at')
    .eq('org_id', profile.org_id)
    .is('project_id', null)
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Org channels</h1>
        <p className="text-sm text-muted-foreground">Lab-wide discussion spaces.</p>
      </div>

      {isStaffOrDirector(profile.org_role) ? (
        <Card>
          <CardHeader>
            <CardTitle>Create channel</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createChannel} className="flex gap-2">
              <Input name="name" placeholder="#channel-name" required />
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

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
          <p className="text-sm text-muted-foreground">No org channels yet.</p>
        )}
      </div>
    </div>
  );
}
