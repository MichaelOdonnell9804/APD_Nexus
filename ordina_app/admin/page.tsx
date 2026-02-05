import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const roles = [
  { role: 'director', count: 1 },
  { role: 'staff', count: 4 },
  { role: 'researcher', count: 12 },
  { role: 'student', count: 8 },
  { role: 'external', count: 2 }
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-500">Administration</p>
        <h1 className="text-2xl font-semibold text-ink-900">Organization Governance</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {roles.map((role) => (
              <div key={role.role} className="flex items-center justify-between rounded-md border border-ink-200 bg-ink-100/40 px-4 py-3">
                <p className="font-medium text-ink-900">{role.role}</p>
                <Badge variant="outline">{role.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-ink-600">
            <li>RLS policies enforced across all tables</li>
            <li>Immutable file versions preserved</li>
            <li>Note revisions retained indefinitely</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
