import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function RightPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operational Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-600">Data retention</span>
              <Badge variant="outline">Compliant</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-600">Active projects</span>
              <span className="font-semibold text-ink-900">6</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-600">Pending reviews</span>
              <span className="font-semibold text-ink-900">2</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-ink-600">
            <li>March 2026 publication dataset archive</li>
            <li>Instrument calibration log due in 12 days</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
