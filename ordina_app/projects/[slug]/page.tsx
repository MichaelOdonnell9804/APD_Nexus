import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProjectPageProps {
  params: { slug: string };
}

export default function ProjectDetailPage({ params }: ProjectPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-500">Project</p>
          <h1 className="text-2xl font-semibold text-ink-900">{params.slug.replace(/-/g, ' ')}</h1>
        </div>
        <Badge variant="alert">Active</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-ink-600">
              <li>#operations-log</li>
              <li>#analysis-q1</li>
              <li>#instrument-status</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Files</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-ink-600">
              <li>run-1827-calibration.pdf</li>
              <li>muon-sim-v3.hdf5</li>
              <li>cooling-report-jan26.md</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-ink-600">
              <li>Review detector alignment report</li>
              <li>Finalize February shift plan</li>
              <li>Sync run numbering with archive</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Experiment Log Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Latest Run</p>
              <p className="text-lg font-semibold text-ink-900">Run 1827 · Calibration</p>
              <p className="text-sm text-ink-600">Responsible: Dr. Kwon · Feb 3, 2026</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-500">Environment</p>
              <p className="text-sm text-ink-600">Cryogenic temp stable at 2.6K. Magnet current nominal.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
