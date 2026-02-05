import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function HomePage() {
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, priority, created_at, expires_at, project_id')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .limit(6);

  const { data: urgent } = await supabase
    .from('announcements')
    .select('id, title, priority, expires_at')
    .eq('org_id', profile.org_id)
    .eq('priority', 'urgent')
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: recentMessages } = await supabase
    .from('messages')
    .select('id, body, created_at, channel_id')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: recentNotes } = await supabase
    .from('notes')
    .select('id, title, updated_at, project_id')
    .eq('org_id', profile.org_id)
    .order('updated_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {profile.full_name}</h1>
        <p className="text-sm text-muted-foreground">Latest lab activity across APD Nexus.</p>
      </div>

      {urgent && urgent.length > 0 ? (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Urgent announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {urgent.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span>{item.title}</span>
                <Link className="text-red-700 underline" href={`/announcements#${item.id}`}>
                  View
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements && announcements.length > 0 ? (
              announcements.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-2 text-sm last:border-b-0">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.project_id ? 'Project' : 'Org'} â€¢ {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={item.priority === 'urgent' ? 'default' : 'secondary'}>
                    {item.priority}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentMessages && recentMessages.length > 0 ? (
              recentMessages.map((message) => (
                <Link
                  key={message.id}
                  href={`/channels/${message.channel_id}`}
                  className="block rounded-md border px-3 py-2 text-sm hover:bg-muted"
                >
                  <p className="line-clamp-2">{message.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent messages.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recently updated notes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {recentNotes && recentNotes.length > 0 ? (
            recentNotes.map((note) => (
              <Link key={note.id} href={`/notes?note=${note.id}`} className="rounded-md border px-4 py-3">
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
  );
}

