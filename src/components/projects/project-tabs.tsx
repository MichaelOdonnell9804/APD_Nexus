'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Overview', href: '' },
  { label: 'Channels', href: '/channels' },
  { label: 'Files', href: '/files' },
  { label: 'Notes', href: '/notes' },
  { label: 'Tasks', href: '/tasks' },
  { label: 'Logs', href: '/logs' }
];

export function ProjectTabs({ slug }: { slug: string }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2 border-b pb-3">
      {tabs.map((tab) => {
        const href = `/projects/${slug}${tab.href}`;
        const isActive = pathname === href;
        return (
          <Link
            key={tab.label}
            href={href}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm',
              isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/70'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
