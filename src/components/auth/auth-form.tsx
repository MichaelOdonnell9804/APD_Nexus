'use client';

import { useState, useTransition } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ORG_ROLES = [
  { value: 'director', label: 'Director' },
  { value: 'staff', label: 'Staff' },
  { value: 'grad', label: 'Grad' },
  { value: 'undergrad', label: 'Undergrad' },
  { value: 'external', label: 'External' }
];

export function AuthForm({ missingProfile }: { missingProfile?: boolean }) {
  const supabase = createSupabaseBrowserClient();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{mode === 'signin' ? 'Sign in' : 'Create your account'}</CardTitle>
        {missingProfile ? (
          <p className="text-sm text-muted-foreground">
            We need a profile to continue. Please sign in again to finish setup.
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            setMessage(null);
            const form = event.currentTarget;
            const formData = new FormData(form);
            const email = String(formData.get('email') || '').trim();
            const password = String(formData.get('password') || '').trim();
            const fullName = String(formData.get('full_name') || '').trim();
            const orgRole = String(formData.get('org_role') || 'grad');
            const orgId = process.env.NEXT_PUBLIC_ORG_ID;

            if (!email || !password) {
              setError('Email and password are required.');
              return;
            }

            startTransition(async () => {
              try {
                if (mode === 'signup') {
                  if (!fullName) {
                    setError('Full name is required.');
                    return;
                  }
                  if (!orgId) {
                    setError('Missing org configuration. Set NEXT_PUBLIC_ORG_ID.');
                    return;
                  }
                  const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password
                  });
                  if (signUpError) throw signUpError;
                  if (data.user) {
                    const { error: profileError } = await supabase.from('profiles').insert({
                      user_id: data.user.id,
                      org_id: orgId,
                      full_name: fullName,
                      org_role: orgRole
                    });
                    if (profileError) throw profileError;
                  }
                  setMessage('Account created. You can now sign in.');
                  setMode('signin');
                  form.reset();
                  return;
                }

                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                  email,
                  password
                });
                if (signInError) throw signInError;

                if (signInData.user) {
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('user_id')
                    .eq('user_id', signInData.user.id)
                    .maybeSingle();

                  if (!profile && orgId) {
                    await supabase.from('profiles').insert({
                      user_id: signInData.user.id,
                      org_id: orgId,
                      full_name: signInData.user.email ?? 'New User',
                      org_role: 'grad'
                    });
                  }
                }

                window.location.href = '/';
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Something went wrong.');
              }
            });
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Input name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Input name="password" type="password" required />
          </div>
          {mode === 'signup' ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="full_name">
                  Full name
                </label>
                <Input name="full_name" type="text" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="org_role">
                  Role
                </label>
                <select
                  name="org_role"
                  className={cn(
                    'flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                  defaultValue="grad"
                >
                  {ORG_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}

          {error ? <div className="text-sm text-red-500">{error}</div> : null}
          {message ? <div className="text-sm text-emerald-600">{message}</div> : null}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          {mode === 'signin' ? 'Need an account?' : 'Already have an account?'}{' '}
          <button
            type="button"
            className="text-primary underline"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
