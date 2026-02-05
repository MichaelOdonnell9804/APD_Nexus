<<<<<<< HEAD
-- Seed data for development

-- Create org
insert into public.orgs (slug, name)
values ('apd_lab_ttu', 'Texas Tech University APD Lab')
on conflict (slug) do update set name = excluded.name;

-- Replace with real users created in Supabase Auth
-- Example accounts (create via Auth UI first):
-- staff@ttu.edu / password
-- grad@ttu.edu / password

with
  org as (select id from public.orgs where slug = 'apd_lab_ttu'),
  staff_user as (select id from auth.users where email = 'staff@ttu.edu'),
  grad_user as (select id from auth.users where email = 'grad@ttu.edu')
insert into public.profiles (user_id, org_id, full_name, org_role)
select staff_user.id, org.id, 'Staff User', 'staff' from staff_user, org
on conflict (user_id) do update
set full_name = excluded.full_name,
    org_role = excluded.org_role,
    org_id = excluded.org_id;

with
  org as (select id from public.orgs where slug = 'apd_lab_ttu'),
  grad_user as (select id from auth.users where email = 'grad@ttu.edu')
insert into public.profiles (user_id, org_id, full_name, org_role)
select grad_user.id, org.id, 'Grad User', 'grad' from grad_user, org
on conflict (user_id) do update
set full_name = excluded.full_name,
    org_role = excluded.org_role,
    org_id = excluded.org_id;

-- Projects
with
  org as (select id from public.orgs where slug = 'apd_lab_ttu'),
  staff_user as (select id from auth.users where email = 'staff@ttu.edu')
insert into public.projects (org_id, slug, title, description, status, created_by)
select org.id,
       'neutrino-tracker',
       'Neutrino Tracker',
       'Detector monitoring and analysis pipeline.',
       'active',
       staff_user.id
from org, staff_user
on conflict (org_id, slug) do update
set title = excluded.title,
    description = excluded.description,
    status = excluded.status;

with
  org as (select id from public.orgs where slug = 'apd_lab_ttu'),
  staff_user as (select id from auth.users where email = 'staff@ttu.edu')
insert into public.projects (org_id, slug, title, description, status, created_by)
select org.id,
       'detector-calibration',
       'Detector Calibration',
       'Calibration workflows and run logs.',
       'active',
       staff_user.id
from org, staff_user
on conflict (org_id, slug) do update
set title = excluded.title,
    description = excluded.description,
    status = excluded.status;

-- Project members
with
  proj as (select id from public.projects where slug = 'neutrino-tracker'),
  staff_user as (select id from auth.users where email = 'staff@ttu.edu'),
  grad_user as (select id from auth.users where email = 'grad@ttu.edu')
insert into public.project_members (project_id, user_id, project_role)
select proj.id, staff_user.id, 'owner' from proj, staff_user
on conflict (project_id, user_id) do update set project_role = excluded.project_role;

with
  proj as (select id from public.projects where slug = 'neutrino-tracker'),
  grad_user as (select id from auth.users where email = 'grad@ttu.edu')
insert into public.project_members (project_id, user_id, project_role)
select proj.id, grad_user.id, 'member' from proj, grad_user
on conflict (project_id, user_id) do update set project_role = excluded.project_role;

with
  proj as (select id from public.projects where slug = 'detector-calibration'),
  staff_user as (select id from auth.users where email = 'staff@ttu.edu')
insert into public.project_members (project_id, user_id, project_role)
select proj.id, staff_user.id, 'owner' from proj, staff_user
on conflict (project_id, user_id) do update set project_role = excluded.project_role;

-- Channels
with org as (select id from public.orgs where slug = 'apd_lab_ttu'),
     staff_user as (select id from auth.users where email = 'staff@ttu.edu')
insert into public.channels (org_id, project_id, name, created_by)
select org.id, null, 'general', staff_user.id from org, staff_user
on conflict (org_id, project_id, name) do nothing;

with org as (select id from public.orgs where slug = 'apd_lab_ttu'),
     staff_user as (select id from auth.users where email = 'staff@ttu.edu')
insert into public.channels (org_id, project_id, name, created_by)
select org.id, null, 'announcements', staff_user.id from org, staff_user
on conflict (org_id, project_id, name) do nothing;

with
  org as (select id from public.orgs where slug = 'apd_lab_ttu'),
  proj as (select id from public.projects where slug = 'neutrino-tracker'),
  staff_user as (select id from auth.users where email = 'staff@ttu.edu')
insert into public.channels (org_id, project_id, name, created_by)
select org.id, proj.id, 'updates', staff_user.id from org, proj, staff_user
on conflict (org_id, project_id, name) do nothing;

-- Messages
with
  channel as (select id from public.channels where name = 'general' and project_id is null),
  staff_user as (select id from auth.users where email = 'staff@ttu.edu')
insert into public.messages (channel_id, user_id, body)
select channel.id, staff_user.id, 'Welcome to APD Nexus. Share lab updates here.'
from channel, staff_user;

-- Notes
with
  org as (select id from public.orgs where slug = 'apd_lab_ttu'),
  staff_user as (select id from auth.users where email = 'staff@ttu.edu')
insert into public.notes (org_id, title, content_md, created_by)
select org.id, 'Lab onboarding', 'Use this space for onboarding checklists and SOPs.', staff_user.id
from org, staff_user;

-- Announcements
with
  org as (select id from public.orgs where slug = 'apd_lab_ttu'),
  staff_user as (select id from auth.users where email = 'staff@ttu.edu')
insert into public.announcements (org_id, title, body, priority, created_by)
select org.id, 'Weekly sync', 'Weekly lab sync is on Thursdays at 10am.', 'normal', staff_user.id
from org, staff_user;

-- Tasks
with
  proj as (select id from public.projects where slug = 'neutrino-tracker'),
  staff_user as (select id from auth.users where email = 'staff@ttu.edu')
insert into public.tasks (project_id, title, status, created_by)
select proj.id, 'Review detector telemetry', 'todo', staff_user.id
from proj, staff_user;

-- Experiment logs
with
  proj as (select id from public.projects where slug = 'neutrino-tracker'),
  staff_user as (select id from auth.users where email = 'staff@ttu.edu')
insert into public.experiment_logs (project_id, title, body_md, run_numbers, created_by)
select proj.id, 'Run 145 summary', 'Initial run shows stable output. $E=mc^2$.', array[145], staff_user.id
from proj, staff_user;

-- Files (metadata only; upload actual file to Storage to download successfully)
with
  org as (select id from public.orgs where slug = 'apd_lab_ttu'),
  staff_user as (select id from auth.users where email = 'staff@ttu.edu')
insert into public.files (org_id, name, mime, size, tags, created_by)
select org.id, 'lab-handbook.pdf', 'application/pdf', 245760, array['handbook','policy'], staff_user.id
from org, staff_user
returning id;

with
  file_row as (
    select id from public.files where name = 'lab-handbook.pdf' order by created_at desc limit 1
  ),
  org as (select id from public.orgs where slug = 'apd_lab_ttu'),
  staff_user as (select id from auth.users where email = 'staff@ttu.edu')
insert into public.file_versions (file_id, storage_key, version, created_by)
select
  file_row.id,
  format('org/%s/shared/%s/v1/lab-handbook.pdf', org.id, file_row.id),
  1,
  staff_user.id
from file_row, org, staff_user;

-- Note revisions
with
  note_row as (select id from public.notes where title = 'Lab onboarding' order by created_at desc limit 1),
  staff_user as (select id from auth.users where email = 'staff@ttu.edu')
insert into public.note_revisions (note_id, content_md, created_by)
select note_row.id, 'Use this space for onboarding checklists and SOPs.', staff_user.id
from note_row, staff_user;
=======
﻿-- Seed data for local development. Requires auth users to exist.
-- Create users:
-- supabase auth admin create-user --email director@ordina.local --password "OrdinaLocal!" --email-confirm
-- supabase auth admin create-user --email researcher@ordina.local --password "OrdinaLocal!" --email-confirm

do $$
declare
  director_id uuid;
  researcher_id uuid;
  org_id uuid := gen_random_uuid();
  project_id uuid := gen_random_uuid();
  channel_id uuid := gen_random_uuid();
  note_id uuid := gen_random_uuid();
  log_id uuid := gen_random_uuid();
begin
  select id into director_id from auth.users where email = 'director@ordina.local';
  select id into researcher_id from auth.users where email = 'researcher@ordina.local';

  if director_id is null or researcher_id is null then
    raise exception 'Seed requires users director@ordina.local and researcher@ordina.local.';
  end if;

  insert into public.organizations (id, name, slug, created_by)
  values (org_id, 'Ordina Research Lab', 'ordina-lab', director_id);

  insert into public.org_members (org_id, user_id, role, created_by)
  values
    (org_id, director_id, 'director', director_id),
    (org_id, researcher_id, 'researcher', director_id);

  insert into public.profiles (user_id, display_name, email, title)
  values
    (director_id, 'Dr. Mira Dean', 'director@ordina.local', 'Lab Director'),
    (researcher_id, 'Alex Rivera', 'researcher@ordina.local', 'Research Scientist');

  insert into public.projects (id, org_id, slug, name, description, created_by)
  values (project_id, org_id, 'neutrino-detector-a', 'Neutrino Detector A', 'Primary detector operations and calibration.', director_id);

  insert into public.project_members (project_id, user_id, role, created_by)
  values
    (project_id, director_id, 'owner', director_id),
    (project_id, researcher_id, 'contributor', director_id);

  insert into public.channels (id, org_id, project_id, scope, name, topic, created_by)
  values (channel_id, org_id, project_id, 'project', 'operations-log', 'Detector operations log', director_id);

  insert into public.messages (channel_id, author_id, body)
  values
    (channel_id, director_id, 'Calibration constants for Run 1827 are now available.'),
    (channel_id, researcher_id, 'Reviewed. No anomalies found. Proceeding to analysis.');

  insert into public.notes (id, org_id, project_id, title, content, created_by, updated_by)
  values (note_id, org_id, project_id, 'Run 1827 calibration summary', 'Initial calibration summary with detector stability notes.', director_id, director_id);

  insert into public.experiment_logs (id, project_id, title, log_date, run_numbers, configuration, environmental_notes, created_by)
  values (log_id, project_id, 'Run 1827 Calibration', current_date, array['1827'], '{"detector":"A","mode":"calibration"}'::jsonb, 'Cryogenic temperature stable at 2.6K.', director_id);

  insert into public.experiment_log_personnel (log_id, user_id, role)
  values (log_id, director_id, 'Lead');

  insert into public.announcements (org_id, project_id, title, body, priority, created_by)
  values (org_id, project_id, 'Cooling maintenance window', 'Scheduled maintenance on Feb 6, 04:00-08:00 UTC.', 'urgent', director_id);

  insert into public.tasks (project_id, title, description, status, assignee_id, due_date, created_by)
  values (project_id, 'Review calibration report', 'Review Run 1827 calibration summary note.', 'active', researcher_id, current_date + 7, director_id);
end $$;
>>>>>>> 773c224 (Initial commit)
