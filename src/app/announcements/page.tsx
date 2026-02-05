import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { isStaffOrDirector } from '@/lib/roles';
import { createAnnouncement, markAnnouncementRead } from '@/app/announcements/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function AnnouncementsPage() {
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, body, priority, created_at, expires_at, project_id, announcement_reads(user_id, read_at)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false });

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title')
    .eq('org_id', profile.org_id)
    .order('title', { ascending: true });

  const { data: projectRoles } = await supabase
    .from('project_members')
    .select('project_id, project_role')
    .eq('user_id', profile.user_id);

  const canCreate = isStaffOrDirector(profile.org_role) || projectRoles?.some((role) =>
    role.project_role === 'owner' || role.project_role === 'maintainer'
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Announcements</h1>
        <p className="text-sm text-muted-foreground">Org-wide and project-specific updates.</p>
      </div>

      {canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle>Create announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createAnnouncement} className="grid gap-3 md:grid-cols-2">
              <Input name="title" placeholder="Title" required />
              <select name="priority" className="h-9 rounded-md border border-input px-3 text-sm">
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <Textarea name="body" placeholder="Announcement body" className="md:col-span-2" required />
              <select name="project_id" className="h-9 rounded-md border border-input px-3 text-sm">
                <option value="">Org-wide</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
              <Input name="expires_at" type="datetime-local" />
              <Button type="submit" className="md:col-span-2">
                Publish
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {announcements && announcements.length > 0 ? (
          announcements.map((announcement) => {
            const read = announcement.announcement_reads?.some(
              (readItem) => readItem.user_id === profile.user_id
            );
            return (
              <Card key={announcement.id} id={announcement.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>{announcement.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {announcement.project_id ? 'Project' : 'Org'} â€¢{' '}
                      {new Date(announcement.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={announcement.priority === 'urgent' ? 'default' : 'secondary'}>
                    {announcement.priority}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{announcement.body}</p>
                  {announcement.expires_at ? (
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(announcement.expires_at).toLocaleString()}
                    </p>
                  ) : null}
                  {read ? (
                    <span className="text-xs text-muted-foreground">Read</span>
                  ) : (
                    <form
                      action={async () => {
                        'use server';
                        await markAnnouncementRead(announcement.id);
                      }}
                    >
                      <Button size="sm" variant="outline">
                        Mark as read
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        )}
      </div>
    </div>
  );
}

