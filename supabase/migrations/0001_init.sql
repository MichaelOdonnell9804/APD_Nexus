begin;

create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "pg_trgm";

create type org_role as enum ('director', 'staff', 'researcher', 'student', 'external');
create type project_role as enum ('owner', 'maintainer', 'contributor', 'viewer');
create type project_status as enum ('active', 'archived');
create type task_status as enum ('planned', 'active', 'blocked', 'done');
create type announcement_priority as enum ('normal', 'high', 'urgent');
create type channel_scope as enum ('org', 'project');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.org_role_rank(role org_role)
returns int
language sql
immutable
as $$
  select case role
    when 'director' then 5
    when 'staff' then 4
    when 'researcher' then 3
    when 'student' then 2
    when 'external' then 1
    else 0
  end;
$$;

create or replace function public.project_role_rank(role project_role)
returns int
language sql
immutable
as $$
  select case role
    when 'owner' then 4
    when 'maintainer' then 3
    when 'contributor' then 2
    when 'viewer' then 1
    else 0
  end;
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users,
  constraint organizations_slug_key unique (slug)
);

create table public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  display_name text,
  email citext,
  title text,
  orcid text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.org_members (
  org_id uuid not null references public.organizations on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role org_role not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users,
  primary key (org_id, user_id),
  constraint org_members_user_unique unique (user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations on delete cascade,
  slug text not null,
  name text not null,
  description text,
  status project_status not null default 'active',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users,
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint projects_org_slug_unique unique (org_id, slug)
);

create table public.project_members (
  project_id uuid not null references public.projects on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role project_role not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users,
  primary key (project_id, user_id)
);

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations on delete cascade,
  project_id uuid references public.projects on delete cascade,
  scope channel_scope not null,
  name text not null,
  topic text,
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users,
  updated_at timestamptz not null default now(),
  constraint channels_scope_check check (
    (scope = 'org' and project_id is null) or
    (scope = 'project' and project_id is not null)
  )
);

create unique index channels_org_unique on public.channels (org_id, name) where scope = 'org';
create unique index channels_project_unique on public.channels (project_id, name) where scope = 'project';

create table public.channel_members (
  channel_id uuid not null references public.channels on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels on delete cascade,
  author_id uuid not null references auth.users on delete cascade,
  parent_id uuid references public.messages on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(body, ''))
  ) stored
);

create index messages_channel_idx on public.messages (channel_id, created_at desc);
create index messages_search_idx on public.messages using gin (search_vector);

create table public.message_reactions (
  message_id uuid not null references public.messages on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  reaction text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, reaction),
  constraint message_reactions_check check (reaction in ('+1', '-1', 'eyes', 'heart', 'rocket', 'tada', 'question', 'exclamation'))
);

create table public.message_links (
  message_id uuid not null references public.messages on delete cascade,
  target_type text not null,
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (message_id, target_type, target_id),
  constraint message_links_type_check check (target_type in ('file', 'note', 'experiment_log', 'task', 'announcement'))
);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations on delete cascade,
  project_id uuid references public.projects on delete set null,
  storage_bucket text not null default 'ordina-files',
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  uploader_id uuid not null references auth.users on delete restrict,
  uploaded_at timestamptz not null default now(),
  tags text[] not null default '{}',
  run_number text,
  dataset_id text,
  current_version int not null default 1,
  deleted_at timestamptz,
  deleted_by uuid references auth.users,
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(filename, '') || ' ' || coalesce(array_to_string(tags, ' '), '') || ' ' || coalesce(run_number, '') || ' ' || coalesce(dataset_id, ''))
  ) stored
);

create index files_org_idx on public.files (org_id);
create index files_project_idx on public.files (project_id);
create index files_search_idx on public.files using gin (search_vector);

create table public.file_versions (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files on delete cascade,
  version_no int not null,
  storage_path text not null,
  size_bytes bigint not null,
  checksum text,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users on delete restrict,
  constraint file_versions_unique unique (file_id, version_no)
);

create index file_versions_file_idx on public.file_versions (file_id, version_no desc);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations on delete cascade,
  project_id uuid references public.projects on delete set null,
  title text not null,
  content text not null,
  created_by uuid not null references auth.users on delete restrict,
  created_at timestamptz not null default now(),
  updated_by uuid not null references auth.users on delete restrict,
  updated_at timestamptz not null default now(),
  current_version int not null default 1,
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) stored
);

create index notes_org_idx on public.notes (org_id);
create index notes_project_idx on public.notes (project_id);
create index notes_search_idx on public.notes using gin (search_vector);

create table public.note_versions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes on delete cascade,
  version_no int not null,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users on delete restrict,
  constraint note_versions_unique unique (note_id, version_no)
);
create table public.experiment_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  title text not null,
  log_date date not null,
  run_numbers text[] not null default '{}',
  configuration jsonb not null default '{}'::jsonb,
  environmental_notes text,
  created_by uuid not null references auth.users on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(environmental_notes, ''))
  ) stored
);

create index experiment_logs_project_idx on public.experiment_logs (project_id, log_date desc);
create index experiment_logs_search_idx on public.experiment_logs using gin (search_vector);

create table public.experiment_log_personnel (
  log_id uuid not null references public.experiment_logs on delete cascade,
  user_id uuid not null references auth.users on delete restrict,
  role text,
  primary key (log_id, user_id)
);

create table public.experiment_log_files (
  log_id uuid not null references public.experiment_logs on delete cascade,
  file_id uuid not null references public.files on delete restrict,
  primary key (log_id, file_id)
);

create table public.experiment_log_notes (
  log_id uuid not null references public.experiment_logs on delete cascade,
  note_id uuid not null references public.notes on delete restrict,
  primary key (log_id, note_id)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations on delete cascade,
  project_id uuid references public.projects on delete cascade,
  title text not null,
  body text not null,
  priority announcement_priority not null default 'normal',
  expires_at timestamptz,
  created_by uuid not null references auth.users on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) stored
);

create index announcements_org_idx on public.announcements (org_id);
create index announcements_project_idx on public.announcements (project_id);
create index announcements_search_idx on public.announcements using gin (search_vector);

create table public.announcement_reads (
  announcement_id uuid not null references public.announcements on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  title text not null,
  description text,
  status task_status not null default 'planned',
  assignee_id uuid references auth.users on delete set null,
  due_date date,
  created_by uuid not null references auth.users on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored
);

create index tasks_project_idx on public.tasks (project_id, status);
create index tasks_search_idx on public.tasks using gin (search_vector);
create or replace function public.current_org_id()
returns uuid
language sql
stable
as $$
  select org_id from public.org_members where user_id = auth.uid();
$$;

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.org_members
    where org_id = target_org_id and user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(required_role org_role)
returns boolean
language sql
stable
as $$
  select coalesce(
    (
      select public.org_role_rank(role) >= public.org_role_rank(required_role)
      from public.org_members
      where user_id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.has_org_role_in(target_org_id uuid, required_role org_role)
returns boolean
language sql
stable
as $$
  select coalesce(
    (
      select public.org_role_rank(role) >= public.org_role_rank(required_role)
      from public.org_members
      where org_id = target_org_id and user_id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.is_project_member(target_project_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.project_members
    where project_id = target_project_id and user_id = auth.uid()
  );
$$;

create or replace function public.has_project_role(target_project_id uuid, required_role project_role)
returns boolean
language sql
stable
as $$
  select coalesce(
    (
      select public.project_role_rank(role) >= public.project_role_rank(required_role)
      from public.project_members
      where project_id = target_project_id and user_id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.project_org_id(target_project_id uuid)
returns uuid
language sql
stable
as $$
  select org_id from public.projects where id = target_project_id;
$$;

create or replace function public.can_access_project(target_project_id uuid)
returns boolean
language sql
stable
as $$
  select public.is_project_member(target_project_id)
    or public.has_org_role_in(public.project_org_id(target_project_id), 'staff');
$$;

create or replace function public.can_write_project(target_project_id uuid)
returns boolean
language sql
stable
as $$
  select public.has_project_role(target_project_id, 'contributor')
    or public.has_org_role_in(public.project_org_id(target_project_id), 'staff');
$$;

create or replace function public.can_manage_project(target_project_id uuid)
returns boolean
language sql
stable
as $$
  select public.has_project_role(target_project_id, 'maintainer')
    or public.has_org_role_in(public.project_org_id(target_project_id), 'staff');
$$;

create or replace function public.is_channel_member(target_channel_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.channel_members
    where channel_id = target_channel_id and user_id = auth.uid()
  );
$$;

create or replace function public.can_access_channel(target_channel_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.channels c
    where c.id = target_channel_id
      and (
        (c.scope = 'org' and public.is_org_member(c.org_id))
        or (c.scope = 'project' and public.can_access_project(c.project_id))
      )
      and (c.is_private = false or public.is_channel_member(c.id))
  );
$$;

create or replace function public.can_access_message(target_message_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.messages m
    where m.id = target_message_id
      and public.can_access_channel(m.channel_id)
  );
$$;

create or replace function public.can_access_record(org_id uuid, project_id uuid)
returns boolean
language sql
stable
as $$
  select case
    when project_id is null then public.is_org_member(org_id)
    else public.can_access_project(project_id)
  end;
$$;

create or replace function public.can_write_record(org_id uuid, project_id uuid)
returns boolean
language sql
stable
as $$
  select case
    when project_id is null then public.has_org_role_in(org_id, 'staff')
    else public.can_write_project(project_id)
  end;
$$;

create or replace function public.can_manage_record(org_id uuid, project_id uuid)
returns boolean
language sql
stable
as $$
  select case
    when project_id is null then public.has_org_role_in(org_id, 'staff')
    else public.can_manage_project(project_id)
  end;
$$;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();

create trigger channels_updated_at
  before update on public.channels
  for each row execute procedure public.set_updated_at();

create trigger messages_updated_at
  before update on public.messages
  for each row execute procedure public.set_updated_at();

create trigger notes_updated_at
  before update on public.notes
  for each row execute procedure public.set_updated_at();

create trigger experiment_logs_updated_at
  before update on public.experiment_logs
  for each row execute procedure public.set_updated_at();

create trigger announcements_updated_at
  before update on public.announcements
  for each row execute procedure public.set_updated_at();

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.set_updated_at();

create or replace function public.handle_note_version()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.note_versions (note_id, version_no, title, content, created_at, created_by)
    values (new.id, new.current_version, new.title, new.content, now(), new.created_by);
    return new;
  end if;

  if (tg_op = 'UPDATE') then
    new.current_version = old.current_version + 1;
    insert into public.note_versions (note_id, version_no, title, content, created_at, created_by)
    values (new.id, new.current_version, new.title, new.content, now(), new.updated_by);
    return new;
  end if;

  return new;
end;
$$;

create trigger note_versions_insert
  before insert or update on public.notes
  for each row execute procedure public.handle_note_version();

create or replace function public.sync_file_current()
returns trigger
language plpgsql
as $$
begin
  update public.files
    set current_version = greatest(files.current_version, new.version_no),
        storage_path = new.storage_path,
        size_bytes = new.size_bytes
  where id = new.file_id;
  return new;
end;
$$;

create trigger file_versions_sync
  after insert on public.file_versions
  for each row execute procedure public.sync_file_current();
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.org_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.channels enable row level security;
alter table public.channel_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.message_links enable row level security;
alter table public.files enable row level security;
alter table public.file_versions enable row level security;
alter table public.notes enable row level security;
alter table public.note_versions enable row level security;
alter table public.experiment_logs enable row level security;
alter table public.experiment_log_personnel enable row level security;
alter table public.experiment_log_files enable row level security;
alter table public.experiment_log_notes enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.tasks enable row level security;

create policy "org_select" on public.organizations
  for select using (public.is_org_member(id));

create policy "org_insert" on public.organizations
  for insert with check (auth.uid() is not null);

create policy "org_update" on public.organizations
  for update using (public.has_org_role_in(id, 'staff'));

create policy "org_delete" on public.organizations
  for delete using (public.has_org_role_in(id, 'director'));

create policy "profiles_select" on public.profiles
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.org_members om
      where om.user_id = public.profiles.user_id
        and om.org_id = public.current_org_id()
    )
  );

create policy "profiles_insert" on public.profiles
  for insert with check (user_id = auth.uid());

create policy "profiles_update" on public.profiles
  for update using (user_id = auth.uid());

create policy "org_members_select" on public.org_members
  for select using (public.is_org_member(org_id));

create policy "org_members_insert" on public.org_members
  for insert with check (
    public.has_org_role_in(org_id, 'staff')
    or (
      auth.uid() = (select created_by from public.organizations where id = org_id)
      and not exists (
        select 1 from public.org_members om
        where om.org_id = public.org_members.org_id
      )
    )
  );

create policy "org_members_update" on public.org_members
  for update using (
    public.has_org_role_in(org_id, 'staff')
  );

create policy "org_members_delete" on public.org_members
  for delete using (
    public.has_org_role_in(org_id, 'director')
  );

create policy "projects_select" on public.projects
  for select using (public.can_access_project(id));

create policy "projects_insert" on public.projects
  for insert with check (public.has_org_role_in(org_id, 'researcher'));

create policy "projects_update" on public.projects
  for update using (
    public.can_manage_project(id)
  );

create policy "projects_delete" on public.projects
  for delete using (public.has_org_role_in(org_id, 'director'));

create policy "project_members_select" on public.project_members
  for select using (public.can_access_project(project_id));

create policy "project_members_insert" on public.project_members
  for insert with check (public.can_manage_project(project_id));

create policy "project_members_update" on public.project_members
  for update using (public.can_manage_project(project_id));

create policy "project_members_delete" on public.project_members
  for delete using (public.can_manage_project(project_id));

create policy "channels_select" on public.channels
  for select using (public.can_access_record(org_id, project_id));

create policy "channels_insert" on public.channels
  for insert with check (public.can_manage_record(org_id, project_id));

create policy "channels_update" on public.channels
  for update using (public.can_manage_record(org_id, project_id));

create policy "channels_delete" on public.channels
  for delete using (public.can_manage_record(org_id, project_id));

create policy "channel_members_select" on public.channel_members
  for select using (public.can_access_channel(channel_id));

create policy "channel_members_insert" on public.channel_members
  for insert with check (public.can_manage_record(
    (select org_id from public.channels where id = channel_id),
    (select project_id from public.channels where id = channel_id)
  ));

create policy "channel_members_delete" on public.channel_members
  for delete using (public.can_manage_record(
    (select org_id from public.channels where id = channel_id),
    (select project_id from public.channels where id = channel_id)
  ));
create policy "messages_select" on public.messages
  for select using (public.can_access_channel(channel_id));

create policy "messages_insert" on public.messages
  for insert with check (
    public.can_access_channel(channel_id) and author_id = auth.uid()
  );

create policy "messages_update" on public.messages
  for update using (
    author_id = auth.uid()
    or public.can_manage_record(
      (select org_id from public.channels where id = channel_id),
      (select project_id from public.channels where id = channel_id)
    )
  );

create policy "messages_delete" on public.messages
  for delete using (
    author_id = auth.uid()
    or public.can_manage_record(
      (select org_id from public.channels where id = channel_id),
      (select project_id from public.channels where id = channel_id)
    )
  );

create policy "message_reactions_select" on public.message_reactions
  for select using (public.can_access_message(message_id));

create policy "message_reactions_insert" on public.message_reactions
  for insert with check (
    public.can_access_message(message_id) and user_id = auth.uid()
  );

create policy "message_reactions_delete" on public.message_reactions
  for delete using (user_id = auth.uid());

create policy "message_links_select" on public.message_links
  for select using (public.can_access_message(message_id));

create policy "message_links_insert" on public.message_links
  for insert with check (
    public.can_access_message(message_id)
  );

create policy "message_links_delete" on public.message_links
  for delete using (public.can_access_message(message_id));

create policy "files_select" on public.files
  for select using (public.can_access_record(org_id, project_id));

create policy "files_insert" on public.files
  for insert with check (
    public.can_write_record(org_id, project_id) and uploader_id = auth.uid()
  );

create policy "files_update" on public.files
  for update using (
    public.can_manage_record(org_id, project_id) or uploader_id = auth.uid()
  );

create policy "files_delete" on public.files
  for delete using (public.can_manage_record(org_id, project_id));

create policy "file_versions_select" on public.file_versions
  for select using (
    exists (
      select 1 from public.files f
      where f.id = file_id and public.can_access_record(f.org_id, f.project_id)
    )
  );

create policy "file_versions_insert" on public.file_versions
  for insert with check (
    created_by = auth.uid() and exists (
      select 1 from public.files f
      where f.id = file_id and public.can_write_record(f.org_id, f.project_id)
    )
  );

create policy "file_versions_delete" on public.file_versions
  for delete using (
    exists (
      select 1 from public.files f
      where f.id = file_id and public.can_manage_record(f.org_id, f.project_id)
    )
  );

create policy "notes_select" on public.notes
  for select using (public.can_access_record(org_id, project_id));

create policy "notes_insert" on public.notes
  for insert with check (
    public.can_write_record(org_id, project_id) and created_by = auth.uid()
  );

create policy "notes_update" on public.notes
  for update using (
    public.can_manage_record(org_id, project_id) or created_by = auth.uid()
  );

create policy "notes_delete" on public.notes
  for delete using (public.can_manage_record(org_id, project_id));

create policy "note_versions_select" on public.note_versions
  for select using (
    exists (
      select 1 from public.notes n
      where n.id = note_id and public.can_access_record(n.org_id, n.project_id)
    )
  );

create policy "note_versions_insert" on public.note_versions
  for insert with check (
    created_by = auth.uid() and exists (
      select 1 from public.notes n
      where n.id = note_id and public.can_write_record(n.org_id, n.project_id)
    )
  );
create policy "experiment_logs_select" on public.experiment_logs
  for select using (public.can_access_project(project_id));

create policy "experiment_logs_insert" on public.experiment_logs
  for insert with check (
    public.can_write_project(project_id) and created_by = auth.uid()
  );

create policy "experiment_logs_update" on public.experiment_logs
  for update using (
    public.can_manage_project(project_id) or created_by = auth.uid()
  );

create policy "experiment_logs_delete" on public.experiment_logs
  for delete using (public.can_manage_project(project_id));

create policy "experiment_log_personnel_select" on public.experiment_log_personnel
  for select using (
    exists (
      select 1 from public.experiment_logs l
      where l.id = log_id and public.can_access_project(l.project_id)
    )
  );

create policy "experiment_log_personnel_insert" on public.experiment_log_personnel
  for insert with check (
    exists (
      select 1 from public.experiment_logs l
      where l.id = log_id and public.can_write_project(l.project_id)
    )
  );

create policy "experiment_log_personnel_delete" on public.experiment_log_personnel
  for delete using (
    exists (
      select 1 from public.experiment_logs l
      where l.id = log_id and public.can_manage_project(l.project_id)
    )
  );

create policy "experiment_log_files_select" on public.experiment_log_files
  for select using (
    exists (
      select 1 from public.experiment_logs l
      where l.id = log_id and public.can_access_project(l.project_id)
    )
  );

create policy "experiment_log_files_insert" on public.experiment_log_files
  for insert with check (
    exists (
      select 1 from public.experiment_logs l
      where l.id = log_id and public.can_write_project(l.project_id)
    )
  );

create policy "experiment_log_files_delete" on public.experiment_log_files
  for delete using (
    exists (
      select 1 from public.experiment_logs l
      where l.id = log_id and public.can_manage_project(l.project_id)
    )
  );

create policy "experiment_log_notes_select" on public.experiment_log_notes
  for select using (
    exists (
      select 1 from public.experiment_logs l
      where l.id = log_id and public.can_access_project(l.project_id)
    )
  );

create policy "experiment_log_notes_insert" on public.experiment_log_notes
  for insert with check (
    exists (
      select 1 from public.experiment_logs l
      where l.id = log_id and public.can_write_project(l.project_id)
    )
  );

create policy "experiment_log_notes_delete" on public.experiment_log_notes
  for delete using (
    exists (
      select 1 from public.experiment_logs l
      where l.id = log_id and public.can_manage_project(l.project_id)
    )
  );

create policy "announcements_select" on public.announcements
  for select using (public.can_access_record(org_id, project_id));

create policy "announcements_insert" on public.announcements
  for insert with check (
    public.can_manage_record(org_id, project_id) and created_by = auth.uid()
  );

create policy "announcements_update" on public.announcements
  for update using (
    public.can_manage_record(org_id, project_id) or created_by = auth.uid()
  );

create policy "announcements_delete" on public.announcements
  for delete using (public.can_manage_record(org_id, project_id));

create policy "announcement_reads_select" on public.announcement_reads
  for select using (
    user_id = auth.uid()
    or public.has_org_role_in(
      (select org_id from public.announcements where id = announcement_id),
      'staff'
    )
  );

create policy "announcement_reads_insert" on public.announcement_reads
  for insert with check (
    user_id = auth.uid()
    and public.can_access_record(
      (select org_id from public.announcements where id = announcement_id),
      (select project_id from public.announcements where id = announcement_id)
    )
  );

create policy "tasks_select" on public.tasks
  for select using (public.can_access_project(project_id));

create policy "tasks_insert" on public.tasks
  for insert with check (
    public.can_write_project(project_id) and created_by = auth.uid()
  );

create policy "tasks_update" on public.tasks
  for update using (
    public.can_manage_project(project_id) or assignee_id = auth.uid() or created_by = auth.uid()
  );

create policy "tasks_delete" on public.tasks
  for delete using (public.can_manage_project(project_id));
insert into storage.buckets (id, name, public)
values ('ordina-files', 'ordina-files', false)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

create policy "storage_files_select" on storage.objects
  for select using (
    bucket_id = 'ordina-files'
    and exists (
      select 1
      from public.file_versions fv
      join public.files f on f.id = fv.file_id
      where fv.storage_path = storage.objects.name
        and public.can_access_record(f.org_id, f.project_id)
    )
  );

create policy "storage_files_insert" on storage.objects
  for insert with check (
    bucket_id = 'ordina-files'
    and exists (
      select 1
      from public.file_versions fv
      join public.files f on f.id = fv.file_id
      where fv.storage_path = storage.objects.name
        and fv.created_by = auth.uid()
        and public.can_write_record(f.org_id, f.project_id)
    )
  );

create policy "storage_files_update" on storage.objects
  for update using (
    bucket_id = 'ordina-files'
    and exists (
      select 1
      from public.file_versions fv
      join public.files f on f.id = fv.file_id
      where fv.storage_path = storage.objects.name
        and public.can_manage_record(f.org_id, f.project_id)
    )
  );

create policy "storage_files_delete" on storage.objects
  for delete using (
    bucket_id = 'ordina-files'
    and exists (
      select 1
      from public.file_versions fv
      join public.files f on f.id = fv.file_id
      where fv.storage_path = storage.objects.name
        and public.can_manage_record(f.org_id, f.project_id)
    )
  );

create or replace function public.search_all(search_query text)
returns table (
  entity_type text,
  entity_id uuid,
  title text,
  snippet text,
  project_id uuid,
  org_id uuid,
  rank real
)
language sql
stable
as $$
  with query as (select websearch_to_tsquery('english', search_query) as q)
  select
    'message' as entity_type,
    m.id as entity_id,
    left(m.body, 80) as title,
    ts_headline('english', m.body, query.q) as snippet,
    c.project_id,
    c.org_id,
    ts_rank_cd(m.search_vector, query.q) as rank
  from public.messages m
  join public.channels c on c.id = m.channel_id
  cross join query
  where m.search_vector @@ query.q

  union all

  select
    'note' as entity_type,
    n.id as entity_id,
    n.title,
    ts_headline('english', n.content, query.q),
    n.project_id,
    n.org_id,
    ts_rank_cd(n.search_vector, query.q)
  from public.notes n
  cross join query
  where n.search_vector @@ query.q

  union all

  select
    'file' as entity_type,
    f.id as entity_id,
    f.filename,
    f.filename,
    f.project_id,
    f.org_id,
    ts_rank_cd(f.search_vector, query.q)
  from public.files f
  cross join query
  where f.search_vector @@ query.q

  union all

  select
    'experiment_log' as entity_type,
    l.id as entity_id,
    l.title,
    ts_headline('english', coalesce(l.environmental_notes, ''), query.q),
    l.project_id,
    p.org_id,
    ts_rank_cd(l.search_vector, query.q)
  from public.experiment_logs l
  join public.projects p on p.id = l.project_id
  cross join query
  where l.search_vector @@ query.q

  union all

  select
    'announcement' as entity_type,
    a.id as entity_id,
    a.title,
    ts_headline('english', a.body, query.q),
    a.project_id,
    a.org_id,
    ts_rank_cd(a.search_vector, query.q)
  from public.announcements a
  cross join query
  where a.search_vector @@ query.q

  union all

  select
    'task' as entity_type,
    t.id as entity_id,
    t.title,
    ts_headline('english', coalesce(t.description, ''), query.q),
    t.project_id,
    p.org_id,
    ts_rank_cd(t.search_vector, query.q)
  from public.tasks t
  join public.projects p on p.id = t.project_id
  cross join query
  where t.search_vector @@ query.q
  order by rank desc;
$$;

commit;
