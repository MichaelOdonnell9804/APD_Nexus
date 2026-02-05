import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { ProjectTabs } from '@/components/projects/project-tabs';

export default async function ProjectLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { profile } = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, slug, title, description, status')
    .eq('org_id', profile.org_id)
    .eq('slug', slug)
    .single();

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{project.title}</h1>
        <p className="text-sm text-muted-foreground">{project.description || 'No description provided.'}</p>
      </div>
      <ProjectTabs slug={project.slug} />
      {children}
    </div>
  );
}
