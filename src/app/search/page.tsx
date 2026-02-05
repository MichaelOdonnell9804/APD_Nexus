import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim();
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const messageResults = query
    ? await supabase
        .from('messages')
        .select('id, body, channel_id')
        .textSearch('search_tsv', query, { type: 'plain' })
        .limit(5)
    : { data: [] };

  const noteResults = query
    ? await supabase
        .from('notes')
        .select('id, title')
        .eq('org_id', profile.org_id)
        .textSearch('search_tsv', query, { type: 'plain' })
        .limit(5)
    : { data: [] };

  const fileResults = query
    ? await supabase
        .from('files')
        .select('id, name')
        .eq('org_id', profile.org_id)
        .textSearch('search_tsv', query, { type: 'plain' })
        .limit(5)
    : { data: [] };

  const announcementResults = query
    ? await supabase
        .from('announcements')
        .select('id, title')
        .eq('org_id', profile.org_id)
        .textSearch('search_tsv', query, { type: 'plain' })
        .limit(5)
    : { data: [] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Search</h1>
        <p className="text-sm text-muted-foreground">Use the search bar above to query core content.</p>
      </div>

      {query ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {messageResults.data && messageResults.data.length > 0 ? (
                messageResults.data.map((message) => (
                  <Link key={message.id} href={`/channels/${message.channel_id}`} className="block border-b pb-2">
                    {message.body.slice(0, 140)}
                  </Link>
                ))
              ) : (
                <p className="text-muted-foreground">No message matches.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {noteResults.data && noteResults.data.length > 0 ? (
                noteResults.data.map((note) => (
                  <Link key={note.id} href={`/notes?note=${note.id}`} className="block border-b pb-2">
                    {note.title}
                  </Link>
                ))
              ) : (
                <p className="text-muted-foreground">No note matches.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {fileResults.data && fileResults.data.length > 0 ? (
                fileResults.data.map((file) => (
                  <div key={file.id} className="border-b pb-2">
                    {file.name}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No file matches.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {announcementResults.data && announcementResults.data.length > 0 ? (
                announcementResults.data.map((announcement) => (
                  <Link key={announcement.id} href={`/announcements#${announcement.id}`} className="block border-b pb-2">
                    {announcement.title}
                  </Link>
                ))
              ) : (
                <p className="text-muted-foreground">No announcements match.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Enter a query to start searching.</p>
      )}
    </div>
  );
}

