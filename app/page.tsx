import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RightPanel } from '@/components/layout/RightPanel';

const activity = [
  {
    label: 'Experiment log updated',
    detail: 'Run 1827 calibration report attached',
    time: '2 hours ago'
  },
  {
    label: 'Dataset versioned',
    detail: 'Muon background dataset v3',
    time: 'Yesterday'
  },
  {
    label: 'Announcement posted',
    detail: 'Detector cooling maintenance window',
    time: '2 days ago'
  }
];

export default function HomePage() {
  return (
    <div className="ordina-grid">
      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Operations Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: 'Active projects', value: '6' },
                { label: 'Open tasks', value: '14' },
                { label: 'Unreviewed logs', value: '3' }
              ].map((item) => (
                <div key={item.label} className="rounded-md border border-ink-200 bg-ink-100/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-ink-900">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {activity.map((item) => (
                <li key={item.label} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-ink-900">{item.label}</p>
                    <p className="text-sm text-ink-600">{item.detail}</p>
                  </div>
                  <Badge variant="outline">{item.time}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <RightPanel />
    </div>
  );
}
