import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const projects = [
  {
    slug: 'neutrino-detector-a',
    name: 'Neutrino Detector A',
    status: 'active',
    lead: 'Dr. Eliza Kwon'
  },
  {
    slug: 'muon-simulation',
    name: 'Muon Background Simulation',
    status: 'active',
    lead: 'Prof. Leo Alvarez'
  },
  {
    slug: 'archived-cryogenic',
    name: 'Cryogenic Stability Archive',
    status: 'archived',
    lead: 'Ops Team'
  }
];

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-500">Projects</p>
        <h1 className="text-2xl font-semibold text-ink-900">Research Programs</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.slug}>
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-ink-600">
                  <p>Lead: {project.lead}</p>
                  <p>Status: {project.status}</p>
                </div>
                <Badge variant={project.status === 'archived' ? 'outline' : 'alert'}>
                  {project.status}
                </Badge>
              </div>
              <Link
                href={`/projects/${project.slug}`}
                className="mt-4 inline-flex text-sm font-semibold text-brass-600"
              >
                View project →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
