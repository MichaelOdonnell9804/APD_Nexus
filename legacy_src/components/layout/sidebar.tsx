'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FolderKanban, MessageSquare, Files, NotebookPen, Search, Megaphone, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/channels', label: 'Org Channels', icon: MessageSquare },
  { href: '/files', label: 'Files', icon: Files },
  { href: '/notes', label: 'Notes', icon: NotebookPen },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin', label: 'Admin', icon: Shield }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 flex-col border-r bg-card px-4 py-6 md:flex">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">APD Nexus</div>
        <div className="text-lg font-semibold">Texas Tech APD Lab</div>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/70'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-md border bg-muted/60 p-4 text-xs text-muted-foreground">
        Secure, internal collaboration. All activity is restricted to lab members.
      </div>
    </aside>
  );
}
