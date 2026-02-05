-- Seed data for local development. Requires auth users to exist.
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
