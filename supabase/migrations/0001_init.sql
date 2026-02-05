-- Extensions
create extension if not exists pgcrypto;

-- Orgs
create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null
);

-- Profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  full_name text not null,
  org_role text not null check (org_role in ('director', 'staff', 'grad', 'undergrad', 'external')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  status text not null check (status in ('active', 'archived')),
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (org_id, slug)
);

-- Project members
create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  project_role text not null check (project_role in ('owner', 'maintainer', 'member', 'viewer')),
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- Channels
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  is_private boolean not null default false,
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (org_id, project_id, name)
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  body text not null,
  reply_to_id uuid references public.messages(id) on delete set null,
  thread_root_id uuid references public.messages(id) on delete set null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  search_tsv tsvector
);

-- Message reactions
create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

-- Files
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  folder_path text not null default '/',
  name text not null,
  mime text not null,
  size bigint not null,
  tags text[] not null default '{}',
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  search_tsv tsvector
);

create table if not exists public.file_versions (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  storage_key text not null,
  version int not null,
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (file_id, version)
);

-- Notes
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  content_md text not null,
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_tsv tsvector
);

create table if not exists public.note_revisions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  content_md text not null,
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  created_at timestamptz not null default now()
);

-- Announcements
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  body text not null,
  priority text not null check (priority in ('normal', 'high', 'urgent')),
  expires_at timestamptz,
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  search_tsv tsvector
);

create table if not exists public.announcement_reads (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  status text not null check (status in ('todo', 'in_progress', 'done')),
  assigned_to uuid references public.profiles(user_id) on delete set null,
  due_at timestamptz,
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  created_at timestamptz not null default now()
);

-- Experiment logs
create table if not exists public.experiment_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  body_md text not null,
  run_numbers int[] not null default '{}',
  detector_config jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  created_at timestamptz not null default now()
);

-- Functions
create or replace function public.is_org_member(p_user uuid, p_org uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where user_id = p_user and org_id = p_org
  );
$$;

create or replace function public.is_project_member(p_user uuid, p_project uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.project_members
    where user_id = p_user and project_id = p_project
  );
$$;

create or replace function public.has_org_role(p_user uuid, p_org uuid, p_role text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where user_id = p_user and org_id = p_org and org_role = p_role
  );
$$;

create or replace function public.has_project_role(p_user uuid, p_project uuid, p_role text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.project_members
    where user_id = p_user and project_id = p_project and project_role = p_role
  );
$$;

create or replace function public.can_access_channel(p_channel uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.channels c
    where c.id = p_channel
      and public.is_org_member(auth.uid(), c.org_id)
      and (c.project_id is null or public.is_project_member(auth.uid(), c.project_id))
  );
$$;

create or replace function public.can_moderate_channel(p_channel uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.channels c
    where c.id = p_channel
      and (
        (c.project_id is null and (public.has_org_role(auth.uid(), c.org_id, 'staff') or public.has_org_role(auth.uid(), c.org_id, 'director')))
        or
        (c.project_id is not null and (public.has_project_role(auth.uid(), c.project_id, 'owner') or public.has_project_role(auth.uid(), c.project_id, 'maintainer')))
      )
  );
$$;

create or replace function public.can_access_message(p_message uuid)
returns boolean
language sql
stable
as $$
  select public.can_access_channel(m.channel_id)
  from public.messages m
  where m.id = p_message;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_search_tsv()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'messages' then
    new.search_tsv := to_tsvector('english', coalesce(new.body, ''));
  elsif tg_table_name = 'notes' then
    new.search_tsv := to_tsvector('english', coalesce(new.title, '') || ' ' || coalesce(new.content_md, ''));
  elsif tg_table_name = 'files' then
    new.search_tsv := to_tsvector('english', coalesce(new.name, '') || ' ' || array_to_string(new.tags, ' '));
  elsif tg_table_name = 'announcements' then
    new.search_tsv := to_tsvector('english', coalesce(new.title, '') || ' ' || coalesce(new.body, ''));
  end if;
  return new;
end;
$$;

create or replace function public.prevent_org_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.org_role <> old.org_role then
    if not public.has_org_role(auth.uid(), old.org_id, 'director') then
      raise exception 'Only directors can change org roles.';
    end if;
  end if;
  return new;
end;
$$;

-- Triggers
create trigger notes_set_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

create trigger profiles_block_role_change
before update on public.profiles
for each row execute function public.prevent_org_role_change();

create trigger messages_search_tsv
before insert or update on public.messages
for each row execute function public.set_search_tsv();

create trigger notes_search_tsv
before insert or update on public.notes
for each row execute function public.set_search_tsv();

create trigger files_search_tsv
before insert or update on public.files
for each row execute function public.set_search_tsv();

create trigger announcements_search_tsv
before insert or update on public.announcements
for each row execute function public.set_search_tsv();

-- Indexes
create index if not exists projects_org_id_idx on public.projects(org_id);
create index if not exists project_members_project_id_idx on public.project_members(project_id);
create index if not exists channels_org_id_idx on public.channels(org_id);
create index if not exists messages_channel_id_idx on public.messages(channel_id);
create index if not exists files_org_id_idx on public.files(org_id);
create index if not exists file_versions_file_id_idx on public.file_versions(file_id);
create index if not exists notes_org_id_idx on public.notes(org_id);
create index if not exists announcements_org_id_idx on public.announcements(org_id);
create index if not exists tasks_project_id_idx on public.tasks(project_id);
create index if not exists experiment_logs_project_id_idx on public.experiment_logs(project_id);

create index if not exists messages_search_tsv_idx on public.messages using gin(search_tsv);
create index if not exists notes_search_tsv_idx on public.notes using gin(search_tsv);
create index if not exists files_search_tsv_idx on public.files using gin(search_tsv);
create index if not exists announcements_search_tsv_idx on public.announcements using gin(search_tsv);

-- RLS
alter table public.orgs enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.files enable row level security;
alter table public.file_versions enable row level security;
alter table public.notes enable row level security;
alter table public.note_revisions enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.tasks enable row level security;
alter table public.experiment_logs enable row level security;

-- Org policies
create policy "orgs_select" on public.orgs
for select
using (public.is_org_member(auth.uid(), id));

-- Profiles policies
create policy "profiles_select" on public.profiles
for select
using (public.is_org_member(auth.uid(), org_id));

create policy "profiles_insert_self" on public.profiles
for insert
with check (
  user_id = auth.uid()
  and org_id in (select id from public.orgs where slug = 'apd_lab_ttu')
);

create policy "profiles_update_self" on public.profiles
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "profiles_update_director" on public.profiles
for update
using (public.has_org_role(auth.uid(), org_id, 'director'))
with check (public.has_org_role(auth.uid(), org_id, 'director'));

-- Projects policies
create policy "projects_select" on public.projects
for select
using (public.is_org_member(auth.uid(), org_id));

create policy "projects_insert" on public.projects
for insert
with check (
  public.is_org_member(auth.uid(), org_id)
  and (public.has_org_role(auth.uid(), org_id, 'staff') or public.has_org_role(auth.uid(), org_id, 'director'))
);

create policy "projects_update" on public.projects
for update
using (
  public.is_org_member(auth.uid(), org_id)
  and (
    public.has_project_role(auth.uid(), id, 'owner')
    or public.has_project_role(auth.uid(), id, 'maintainer')
    or public.has_org_role(auth.uid(), org_id, 'staff')
    or public.has_org_role(auth.uid(), org_id, 'director')
  )
)
with check (
  public.is_org_member(auth.uid(), org_id)
  and (
    public.has_project_role(auth.uid(), id, 'owner')
    or public.has_project_role(auth.uid(), id, 'maintainer')
    or public.has_org_role(auth.uid(), org_id, 'staff')
    or public.has_org_role(auth.uid(), org_id, 'director')
  )
);

create policy "projects_delete" on public.projects
for delete
using (
  public.is_org_member(auth.uid(), org_id)
  and (
    public.has_project_role(auth.uid(), id, 'owner')
    or public.has_org_role(auth.uid(), org_id, 'director')
  )
);

-- Project members policies
create policy "project_members_select" on public.project_members
for select
using (
  public.is_project_member(auth.uid(), project_id)
  or public.has_org_role(auth.uid(), (select org_id from public.projects where id = project_id), 'staff')
  or public.has_org_role(auth.uid(), (select org_id from public.projects where id = project_id), 'director')
);

create policy "project_members_insert" on public.project_members
for insert
with check (
  public.has_project_role(auth.uid(), project_id, 'owner')
  or public.has_project_role(auth.uid(), project_id, 'maintainer')
  or public.has_org_role(auth.uid(), (select org_id from public.projects where id = project_id), 'staff')
  or public.has_org_role(auth.uid(), (select org_id from public.projects where id = project_id), 'director')
);

create policy "project_members_update" on public.project_members
for update
using (
  public.has_project_role(auth.uid(), project_id, 'owner')
  or public.has_project_role(auth.uid(), project_id, 'maintainer')
  or public.has_org_role(auth.uid(), (select org_id from public.projects where id = project_id), 'staff')
  or public.has_org_role(auth.uid(), (select org_id from public.projects where id = project_id), 'director')
)
with check (
  public.has_project_role(auth.uid(), project_id, 'owner')
  or public.has_project_role(auth.uid(), project_id, 'maintainer')
  or public.has_org_role(auth.uid(), (select org_id from public.projects where id = project_id), 'staff')
  or public.has_org_role(auth.uid(), (select org_id from public.projects where id = project_id), 'director')
);

create policy "project_members_delete" on public.project_members
for delete
using (
  public.has_project_role(auth.uid(), project_id, 'owner')
  or public.has_project_role(auth.uid(), project_id, 'maintainer')
  or public.has_org_role(auth.uid(), (select org_id from public.projects where id = project_id), 'staff')
  or public.has_org_role(auth.uid(), (select org_id from public.projects where id = project_id), 'director')
);

-- Channels policies
create policy "channels_select" on public.channels
for select
using (
  public.is_org_member(auth.uid(), org_id)
  and (project_id is null or public.is_project_member(auth.uid(), project_id))
);

create policy "channels_insert" on public.channels
for insert
with check (
  public.is_org_member(auth.uid(), org_id)
  and (
    (project_id is null and (public.has_org_role(auth.uid(), org_id, 'staff') or public.has_org_role(auth.uid(), org_id, 'director')))
    or
    (project_id is not null and (public.has_project_role(auth.uid(), project_id, 'owner') or public.has_project_role(auth.uid(), project_id, 'maintainer')))
  )
);

create policy "channels_update" on public.channels
for update
using (
  public.is_org_member(auth.uid(), org_id)
  and (
    (project_id is null and (public.has_org_role(auth.uid(), org_id, 'staff') or public.has_org_role(auth.uid(), org_id, 'director')))
    or
    (project_id is not null and (public.has_project_role(auth.uid(), project_id, 'owner') or public.has_project_role(auth.uid(), project_id, 'maintainer')))
  )
)
with check (
  public.is_org_member(auth.uid(), org_id)
  and (
    (project_id is null and (public.has_org_role(auth.uid(), org_id, 'staff') or public.has_org_role(auth.uid(), org_id, 'director')))
    or
    (project_id is not null and (public.has_project_role(auth.uid(), project_id, 'owner') or public.has_project_role(auth.uid(), project_id, 'maintainer')))
  )
);

create policy "channels_delete" on public.channels
for delete
using (
  public.is_org_member(auth.uid(), org_id)
  and (
    (project_id is null and (public.has_org_role(auth.uid(), org_id, 'staff') or public.has_org_role(auth.uid(), org_id, 'director')))
    or
    (project_id is not null and (public.has_project_role(auth.uid(), project_id, 'owner') or public.has_project_role(auth.uid(), project_id, 'maintainer')))
  )
);

-- Messages policies
create policy "messages_select" on public.messages
for select
using (public.can_access_channel(channel_id));

create policy "messages_insert" on public.messages
for insert
with check (
  public.can_access_channel(channel_id)
  and user_id = auth.uid()
);

create policy "messages_update" on public.messages
for update
using (
  user_id = auth.uid() or public.can_moderate_channel(channel_id)
)
with check (
  user_id = auth.uid() or public.can_moderate_channel(channel_id)
);

create policy "messages_delete" on public.messages
for delete
using (
  user_id = auth.uid() or public.can_moderate_channel(channel_id)
);

-- Message reactions policies
create policy "message_reactions_select" on public.message_reactions
for select
using (public.can_access_message(message_id));

create policy "message_reactions_insert" on public.message_reactions
for insert
with check (
  public.can_access_message(message_id)
  and user_id = auth.uid()
);

create policy "message_reactions_delete" on public.message_reactions
for delete
using (
  public.can_access_message(message_id)
  and user_id = auth.uid()
);

-- Files policies
create policy "files_select" on public.files
for select
using (
  public.is_org_member(auth.uid(), org_id)
  and (project_id is null or public.is_project_member(auth.uid(), project_id))
);

create policy "files_insert" on public.files
for insert
with check (
  public.is_org_member(auth.uid(), org_id)
  and (project_id is null or public.is_project_member(auth.uid(), project_id))
  and created_by = auth.uid()
);

create policy "files_update" on public.files
for update
using (
  public.is_org_member(auth.uid(), org_id)
  and (
    created_by = auth.uid()
    or (project_id is not null and (public.has_project_role(auth.uid(), project_id, 'owner') or public.has_project_role(auth.uid(), project_id, 'maintainer')))
    or (project_id is null and (public.has_org_role(auth.uid(), org_id, 'staff') or public.has_org_role(auth.uid(), org_id, 'director')))
  )
)
with check (
  public.is_org_member(auth.uid(), org_id)
  and (
    created_by = auth.uid()
    or (project_id is not null and (public.has_project_role(auth.uid(), project_id, 'owner') or public.has_project_role(auth.uid(), project_id, 'maintainer')))
    or (project_id is null and (public.has_org_role(auth.uid(), org_id, 'staff') or public.has_org_role(auth.uid(), org_id, 'director')))
  )
);

create policy "files_delete" on public.files
for delete
using (
  public.is_org_member(auth.uid(), org_id)
  and (
    created_by = auth.uid()
    or (project_id is not null and (public.has_project_role(auth.uid(), project_id, 'owner') or public.has_project_role(auth.uid(), project_id, 'maintainer')))
    or (project_id is null and (public.has_org_role(auth.uid(), org_id, 'staff') or public.has_org_role(auth.uid(), org_id, 'director')))
  )
);

-- File versions policies
create policy "file_versions_select" on public.file_versions
for select
using (
  exists (
    select 1 from public.files f
    where f.id = file_id
      and public.is_org_member(auth.uid(), f.org_id)
      and (f.project_id is null or public.is_project_member(auth.uid(), f.project_id))
  )
);

create policy "file_versions_insert" on public.file_versions
for insert
with check (
  exists (
    select 1 from public.files f
    where f.id = file_id
      and public.is_org_member(auth.uid(), f.org_id)
      and (f.project_id is null or public.is_project_member(auth.uid(), f.project_id))
      and (
        f.created_by = auth.uid()
        or (f.project_id is not null and (public.has_project_role(auth.uid(), f.project_id, 'owner') or public.has_project_role(auth.uid(), f.project_id, 'maintainer')))
        or (f.project_id is null and (public.has_org_role(auth.uid(), f.org_id, 'staff') or public.has_org_role(auth.uid(), f.org_id, 'director')))
      )
  )
  and created_by = auth.uid()
);

-- Notes policies
create policy "notes_select" on public.notes
for select
using (
  public.is_org_member(auth.uid(), org_id)
  and (project_id is null or public.is_project_member(auth.uid(), project_id))
);

create policy "notes_insert" on public.notes
for insert
with check (
  public.is_org_member(auth.uid(), org_id)
  and (project_id is null or public.is_project_member(auth.uid(), project_id))
  and created_by = auth.uid()
);

create policy "notes_update" on public.notes
for update
using (
  public.is_org_member(auth.uid(), org_id)
  and (project_id is null or public.is_project_member(auth.uid(), project_id))
)
with check (
  public.is_org_member(auth.uid(), org_id)
  and (project_id is null or public.is_project_member(auth.uid(), project_id))
);

create policy "notes_delete" on public.notes
for delete
using (
  public.is_org_member(auth.uid(), org_id)
  and (project_id is null or public.is_project_member(auth.uid(), project_id))
);

create policy "note_revisions_select" on public.note_revisions
for select
using (
  exists (
    select 1 from public.notes n
    where n.id = note_id
      and public.is_org_member(auth.uid(), n.org_id)
      and (n.project_id is null or public.is_project_member(auth.uid(), n.project_id))
  )
);

create policy "note_revisions_insert" on public.note_revisions
for insert
with check (
  exists (
    select 1 from public.notes n
    where n.id = note_id
      and public.is_org_member(auth.uid(), n.org_id)
      and (n.project_id is null or public.is_project_member(auth.uid(), n.project_id))
  )
  and created_by = auth.uid()
);

-- Announcements policies
create policy "announcements_select" on public.announcements
for select
using (
  public.is_org_member(auth.uid(), org_id)
  and (project_id is null or public.is_project_member(auth.uid(), project_id))
);

create policy "announcements_insert" on public.announcements
for insert
with check (
  public.is_org_member(auth.uid(), org_id)
  and (
    (project_id is null and (public.has_org_role(auth.uid(), org_id, 'staff') or public.has_org_role(auth.uid(), org_id, 'director')))
    or
    (project_id is not null and (public.has_project_role(auth.uid(), project_id, 'owner') or public.has_project_role(auth.uid(), project_id, 'maintainer')))
  )
  and created_by = auth.uid()
);

create policy "announcements_update" on public.announcements
for update
using (
  public.is_org_member(auth.uid(), org_id)
  and (
    created_by = auth.uid()
    or (project_id is null and public.has_org_role(auth.uid(), org_id, 'director'))
    or (project_id is not null and public.has_project_role(auth.uid(), project_id, 'owner'))
  )
)
with check (
  public.is_org_member(auth.uid(), org_id)
  and (
    created_by = auth.uid()
    or (project_id is null and public.has_org_role(auth.uid(), org_id, 'director'))
    or (project_id is not null and public.has_project_role(auth.uid(), project_id, 'owner'))
  )
);

create policy "announcements_delete" on public.announcements
for delete
using (
  public.is_org_member(auth.uid(), org_id)
  and (
    created_by = auth.uid()
    or (project_id is null and public.has_org_role(auth.uid(), org_id, 'director'))
    or (project_id is not null and public.has_project_role(auth.uid(), project_id, 'owner'))
  )
);

create policy "announcement_reads_select" on public.announcement_reads
for select
using (user_id = auth.uid());

create policy "announcement_reads_insert" on public.announcement_reads
for insert
with check (user_id = auth.uid());

-- Tasks policies
create policy "tasks_select" on public.tasks
for select
using (public.is_project_member(auth.uid(), project_id));

create policy "tasks_insert" on public.tasks
for insert
with check (
  public.is_project_member(auth.uid(), project_id)
  and created_by = auth.uid()
);

create policy "tasks_update" on public.tasks
for update
using (public.is_project_member(auth.uid(), project_id))
with check (public.is_project_member(auth.uid(), project_id));

create policy "tasks_delete" on public.tasks
for delete
using (public.is_project_member(auth.uid(), project_id));

-- Experiment logs policies
create policy "experiment_logs_select" on public.experiment_logs
for select
using (public.is_project_member(auth.uid(), project_id));

create policy "experiment_logs_insert" on public.experiment_logs
for insert
with check (
  public.is_project_member(auth.uid(), project_id)
  and created_by = auth.uid()
);

create policy "experiment_logs_update" on public.experiment_logs
for update
using (public.is_project_member(auth.uid(), project_id))
with check (public.is_project_member(auth.uid(), project_id));

create policy "experiment_logs_delete" on public.experiment_logs
for delete
using (public.is_project_member(auth.uid(), project_id));
