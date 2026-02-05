import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const notes = [
  {
    title: 'Run 1827 calibration summary',
    author: 'Dr. Kwon',
    updated: 'Feb 3, 2026',
    status: 'review'
  },
  {
    title: 'Muon simulation assumptions',
    author: 'Prof. Alvarez',
    updated: 'Jan 30, 2026',
    status: 'stable'
  },
  {
    title: 'Cryogenic maintenance log',
    author: 'Ops Team',
    updated: 'Jan 28, 2026',
    status: 'stable'
  }
];

export default function NotesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-500">Notes</p>
          <h1 className="text-2xl font-semibold text-ink-900">Knowledge Base</h1>
        </div>
        <Button variant="outline">New note</Button>
      </div>

      <div className="space-y-4">
        {notes.map((note) => (
          <Card key={note.title}>
            <CardHeader>
              <CardTitle>{note.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm text-ink-600">
                  <p>Author: {note.author}</p>
                  <p>Updated: {note.updated}</p>
                </div>
                <Badge variant={note.status === 'review' ? 'alert' : 'outline'}>{note.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
