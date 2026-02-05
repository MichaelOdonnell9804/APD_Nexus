import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

interface ShellProps {
  children: React.ReactNode;
  profile: {
    full_name: string | null;
    email: string | null;
    org_role: string | null;
  } | null;
}

export function Shell({ children, profile }: ShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar fullName={profile?.full_name} email={profile?.email} orgRole={profile?.org_role} />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
