<<<<<<< HEAD
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
=======
﻿# Ordina

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
- `org_members` enforces “one user = one org” via unique constraint.
- Helper SQL functions (`is_org_member`, `has_org_role`, `is_project_member`, `has_project_role`) are used in policies.
- Org staff (director/staff) can manage projects across the org.
- Project maintainers manage project-scoped data; contributors can write; viewers are read-only.

## Notes on Auditing

- All records are timestamped.
- Notes maintain full revision history via `note_versions`.
- Files are immutable per version; versions cannot be overwritten.
- Announcements have read receipts for compliance.

## Scripts

- `npm run dev` – start Next.js
- `npm run build` – build
- `npm run lint` – lint

## Directory Overview

- `app/` – Next.js routes and layouts
- `components/` – UI primitives (shadcn-style) and layout components
- `lib/` – Supabase clients and utilities
- `supabase/` – schema migrations and seed data
>>>>>>> 773c224 (Initial commit)
