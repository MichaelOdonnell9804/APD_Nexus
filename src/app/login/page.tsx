import { AuthForm } from '@/components/auth/auth-form';

export default function LoginPage({
  searchParams
}: {
  searchParams: { missing_profile?: string };
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">APD Nexus</p>
          <h1 className="mt-4 text-4xl font-semibold">Internal APD Lab Collaboration Hub</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            A secure workspace for project coordination, shared files, structured notes, and real-time lab chat.
          </p>
        </div>
        <div className="flex flex-wrap gap-10">
          <div className="max-w-lg space-y-4 text-sm text-slate-300">
            <ul className="space-y-2">
              <li>• Org + project scoped conversations</li>
              <li>• Versioned notes and experiment logs</li>
              <li>• Secure file storage with signed URLs</li>
              <li>• Full-text search across core assets</li>
            </ul>
            <p className="text-xs text-slate-400">
              Access is restricted to approved APD Lab members. Contact the lab director for onboarding.
            </p>
          </div>
          <AuthForm missingProfile={Boolean(searchParams.missing_profile)} />
        </div>
      </div>
    </div>
  );
}
