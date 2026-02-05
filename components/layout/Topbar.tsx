import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function Topbar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-200/60 bg-white/70 px-6 py-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-500">Ordina</p>
        <h2 className="text-lg font-semibold text-ink-900">Operations Console</h2>
      </div>
      <div className="flex items-center gap-3">
        <Input className="w-64" placeholder="Search records, notes, logs" />
        <Badge variant="alert">R&D</Badge>
      </div>
    </header>
  );
}
