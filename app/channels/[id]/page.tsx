import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ChannelPageProps {
  params: { id: string };
}

const messages = [
  {
    author: 'Dr. Eliza Kwon',
    body: 'Uploaded the calibration constants for Run 1827. Please review before tomorrow’s shift.',
    time: '08:12'
  },
  {
    author: 'Lab Ops',
    body: 'Cooling loop stable at 2.6K. No anomalies observed in last 12h.',
    time: '08:45'
  }
];

export default function ChannelPage({ params }: ChannelPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-500">Channel</p>
          <h1 className="text-2xl font-semibold text-ink-900">operations-log</h1>
        </div>
        <Badge variant="outline">ID {params.id}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thread</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.time} className="rounded-md border border-ink-200 bg-ink-100/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink-900">{message.author}</p>
                  <span className="text-xs text-ink-500">{message.time}</span>
                </div>
                <p className="mt-2 text-sm text-ink-700">{message.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <Textarea placeholder="Write a log entry or update…" />
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-500">Markdown and LaTeX supported.</p>
              <Button size="sm">Post update</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
