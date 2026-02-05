import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { updateOrgRole } from '@/app/admin/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ROLE_OPTIONS = ['director', 'staff', 'grad', 'undergrad', 'external'];

export default async function AdminPage() {
  const { profile } = await requireProfile();
  const supabase = createSupabaseServerClient();

  if (profile.org_role !== 'director') {
    return (
      <div className="rounded-md border p-6 text-sm text-muted-foreground">
        You do not have access to this page.
      </div>
    );
  }

  const { data: members } = await supabase
    .from('profiles')
    .select('user_id, full_name, org_role')
    .eq('org_id', profile.org_id)
    .order('full_name', { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-muted-foreground">Manage org roles and access.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Org members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members && members.length > 0 ? (
            members.map((member) => (
              <form key={member.user_id} action={updateOrgRole} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="user_id" value={member.user_id} />
                <div className="min-w-[200px]">
                  <p className="text-sm font-medium">{member.full_name || 'Member'}</p>
                  <p className="text-xs text-muted-foreground">{member.user_id}</p>
                </div>
                <select
                  name="org_role"
                  defaultValue={member.org_role}
                  className="h-9 rounded-md border border-input px-3 text-sm"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <Button type="submit" variant="outline" size="sm">
                  Update
                </Button>
              </form>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No members found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
