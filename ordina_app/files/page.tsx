import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const files = [
  {
    name: 'run-1827-calibration.pdf',
    size: '4.2 MB',
    uploader: 'Dr. Kwon',
    version: 'v2'
  },
  {
    name: 'muon-sim-v3.hdf5',
    size: '1.4 GB',
    uploader: 'Sim Cluster',
    version: 'v3'
  },
  {
    name: 'cooling-report-jan26.md',
    size: '34 KB',
    uploader: 'Lab Ops',
    version: 'v1'
  }
];

export default function FilesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-500">Files</p>
          <h1 className="text-2xl font-semibold text-ink-900">Research Data Library</h1>
        </div>
        <Button variant="outline">Upload file</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest Versions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.name}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-200/70 pb-3 last:border-b-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-ink-900">{file.name}</p>
                  <p className="text-sm text-ink-500">Uploaded by {file.uploader} · {file.size}</p>
                </div>
                <Badge variant="outline">{file.version}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
