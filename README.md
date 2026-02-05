# APD Nexus (MVP)

Internal collaboration platform for Texas Tech University APD Lab.

## Tech
- Next.js 14 App Router + TypeScript
- Tailwind + shadcn/ui components
- Supabase Auth, Postgres, Storage, Realtime

## Setup

### 1) Supabase project
- Create a Supabase project
- In Auth settings, disable email confirmation for local MVP testing (optional but recommended)

### 2) Database migration
- Apply SQL from `supabase/migrations/0001_init.sql` in the Supabase SQL editor
 - In Supabase Realtime settings, enable replication for `messages` (and optionally `message_reactions`)

### 3) Storage bucket
- Create a bucket named `apd-files`
- Storage paths:
  - `org/{org_id}/project/{project_id}/...`
  - `org/{org_id}/shared/...`

### 4) Environment variables
Copy `.env.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `NEXT_PUBLIC_ORG_ID` (the `orgs.id` for `apd_lab_ttu`)

### 5) Seed data (dev)
1. Create two users in Supabase Auth:
   - `staff@ttu.edu` / `password`
   - `grad@ttu.edu` / `password`
2. Run `supabase/seed.sql` in the Supabase SQL editor.

### 6) Run locally
```bash
npm install
npm run dev
```

## Manual acceptance checklist
- [ ] Sign up / log in / log out
- [ ] View org announcements
- [ ] Create project (staff)
- [ ] Join project
- [ ] Create and use project channels
- [ ] Real-time messages update without refresh
- [ ] Upload file, see it listed, download it
- [ ] Create note, edit note, see revisions
- [ ] Search finds messages/notes/files/announcements
- [ ] RLS prevents cross-project access (test with second user)

## Notes on auth + profiles
- Users are assigned to a single org (`apd_lab_ttu`).
- Profile creation happens at signup or first login. If profiles are missing, set `NEXT_PUBLIC_ORG_ID` and log in again.

## Storage workflow
- Upload request creates a file record + version, then returns a signed upload URL.
- Download request creates a signed download URL for the latest file version.
- Ensure the physical object exists in the `apd-files` bucket for downloads to work.

## API routes
- `POST /api/files/upload-url` → returns signed upload URL
- `POST /api/files/download-url` → returns signed download URL
- `POST /api/files/update` → rename/tag/soft delete
# APD_Nexus
