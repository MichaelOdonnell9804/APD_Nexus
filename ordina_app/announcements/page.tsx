import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const announcements = [
  {
    title: 'Cooling maintenance window',
    priority: 'urgent',
    date: 'Feb 6, 2026',
    body: 'Cryogenic loop maintenance scheduled 04:00-08:00 UTC. Plan experiments accordingly.'
  },
  {
    title: 'Grant audit preparation',
    priority: 'high',
    date: 'Feb 2, 2026',
    body: 'Archive all datasets referenced in the Q1 publication list by Feb 20.'
  }
];

export default function AnnouncementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-500">Announcements</p>
        <h1 className="text-2xl font-semibold text-ink-900">Governance Notices</h1>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.title}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>{announcement.title}</CardTitle>
                <Badge variant={announcement.priority === 'urgent' ? 'alert' : 'outline'}>
                  {announcement.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-ink-600">{announcement.date}</p>
              <p className="mt-2 text-sm text-ink-700">{announcement.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
