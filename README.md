# Ordina

Ordina is a research-grade collaboration and record-keeping platform for labs and R&D groups. It prioritizes correctness, auditability, and long-term preservation of scientific work.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui components
- Supabase (Auth, Postgres, Storage, Realtime)

## Local Development

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (only needed for admin scripts)

### 3) Start Supabase

```bash
supabase start
```

### 4) Apply migrations

```bash
supabase db reset
```

This runs the SQL migrations under `supabase/migrations/`.

### 4b) Enable realtime for chat (local)

```sql
alter publication supabase_realtime add table public.messages;
```

Run this in the Supabase SQL editor (or `supabase db reset` plus a separate SQL run). It allows channel messages to stream in realtime.

### 5) Create seed users (local)

```bash
supabase auth admin create-user --email director@ordina.local --password "OrdinaLocal!" --email-confirm
supabase auth admin create-user --email researcher@ordina.local --password "OrdinaLocal!" --email-confirm
```

### 6) Seed data

```bash
supabase db seed --file supabase/seed.sql
```

### 7) Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase Schema

The full schema, constraints, triggers, and RLS policies live in:

- `supabase/migrations/0001_init.sql`

The migration includes:

- Organizations, members, and profiles
- Projects and project roles
- Channels and threaded messages
- Files with immutable versioning
- Notes with revision history
- Experiment logs as first-class records
- Announcements with read receipts
- Lightweight tasks
- Full-text search across core entities
- Row Level Security on every table

## Storage Model (Files)

Files are stored in the `ordina-files` bucket. Versioning is enforced in Postgres (`file_versions` table) and the latest version is reflected in `files.current_version`.

Recommended upload flow (enforced by storage RLS):

1. Insert a row into `files` (metadata for the logical file).
2. Insert a row into `file_versions` with the new `storage_path`.
3. Upload the binary object to Supabase Storage at the same `storage_path`.
4. Optionally update size/checksum after upload.

This ensures the storage policies can validate access against metadata, avoiding client-side trust.

## RLS Summary

- Every table has RLS enabled.
- `org_members` enforces â€œone user = one orgâ€ via unique constraint.
- Helper SQL functions (`is_org_member`, `has_org_role`, `is_project_member`, `has_project_role`) are used in policies.
- Org staff (director/staff) can manage projects across the org.
- Project maintainers manage project-scoped data; contributors can write; viewers are read-only.

## Notes on Auditing

- All records are timestamped.
- Notes maintain full revision history via `note_versions`.
- Files are immutable per version; versions cannot be overwritten.
- Announcements have read receipts for compliance.

## Scripts

- `npm run dev` â€“ start Next.js
- `npm run build` â€“ build
- `npm run lint` â€“ lint

## Directory Overview

- `app/` â€“ Next.js routes and layouts
- `components/` â€“ UI primitives (shadcn-style) and layout components
- `lib/` â€“ Supabase clients and utilities
- `supabase/` â€“ schema migrations and seed data
