import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/projects', label: 'Projects' },
  { href: '/channels/1', label: 'Channels' },
  { href: '/files', label: 'Files' },
  { href: '/notes', label: 'Notes' },
  { href: '/announcements', label: 'Announcements' },
  { href: '/search', label: 'Search' },
  { href: '/admin', label: 'Admin' }
];

export function Sidebar() {
  return (
    <aside className="ordina-panel hidden min-h-screen flex-col border-r border-ink-200/70 px-5 py-8 lg:flex">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-500">Ordina</p>
          <h1 className="text-xl font-semibold text-ink-900">Research Infrastructure</h1>
        </div>
        <Badge variant="outline">Org</Badge>
      </div>

      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">Navigation</p>
          <nav className="flex flex-col gap-2 text-sm text-ink-700">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 transition hover:bg-ink-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">Active Project</p>
          <div className="rounded-md border border-ink-200 bg-white p-3 text-sm">
            <p className="font-semibold text-ink-900">Neutrino Detector A</p>
            <p className="text-xs text-ink-500">Run period 2026-A · 7 members</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
