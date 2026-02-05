import { SearchBar } from '@/components/search/search-bar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { signOut } from '@/app/actions/auth';

interface TopbarProps {
  fullName?: string | null;
  email?: string | null;
  orgRole?: string | null;
}

export function Topbar({ fullName, email, orgRole }: TopbarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-card px-6 py-4">
      <SearchBar />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">{fullName || email || 'Account'}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Signed in</DropdownMenuLabel>
          <div className="px-2 pb-2 text-xs text-muted-foreground">
            {email}
            {orgRole ? ` • ${orgRole}` : ''}
          </div>
          <DropdownMenuSeparator />
          <form action={signOut}>
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full text-left">
                Sign out
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
