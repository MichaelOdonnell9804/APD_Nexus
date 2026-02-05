import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const results = [
  {
    type: 'Experiment Log',
    title: 'Run 1827 Calibration',
    source: 'Neutrino Detector A'
  },
  {
    type: 'File',
    title: 'run-1827-calibration.pdf',
    source: 'Neutrino Detector A'
  },
  {
    type: 'Note',
    title: 'Run 1827 calibration summary',
    source: 'Neutrino Detector A'
  }
];

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-500">Search</p>
        <h1 className="text-2xl font-semibold text-ink-900">Global Index</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Query</CardTitle>
        </CardHeader>
        <CardContent>
          <Input placeholder="Search notes, files, logs, and announcements" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.map((result) => (
              <div key={result.title} className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-200/70 pb-3 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-medium text-ink-900">{result.title}</p>
                  <p className="text-sm text-ink-500">{result.source}</p>
                </div>
                <Badge variant="outline">{result.type}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
