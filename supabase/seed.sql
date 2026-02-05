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
