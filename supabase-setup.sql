-- KING OF JOBSHEETS · run ONCE in Supabase > SQL Editor
-- Selamat dijalankan berulang kali.

create table if not exists public.jobsheets (
  player text not null,
  round int not null,
  completed boolean default false,
  live_url text,
  pdf_url text,
  file_path text,
  updated_at timestamptz default now(),
  primary key (player, round)
);

alter table public.jobsheets add column if not exists title text;
alter table public.jobsheets add column if not exists description text;
alter table public.jobsheets add column if not exists html_path text;

alter table public.jobsheets enable row level security;
drop policy if exists "kof_read"   on public.jobsheets;
drop policy if exists "kof_insert" on public.jobsheets;
drop policy if exists "kof_update" on public.jobsheets;
drop policy if exists "kof_delete" on public.jobsheets;
create policy "kof_read"   on public.jobsheets for select to anon using (true);
create policy "kof_insert" on public.jobsheets for insert to anon with check (true);
create policy "kof_update" on public.jobsheets for update to anon using (true) with check (true);
create policy "kof_delete" on public.jobsheets for delete to anon using (true);

-- Public bucket, accepts all file types (PDF, HTML, CSS, images), max 50MB
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('jobsheets', 'jobsheets', true, 52428800, null)
on conflict (id) do update set public = true, file_size_limit = 52428800, allowed_mime_types = null;

drop policy if exists "kof_files_read"   on storage.objects;
drop policy if exists "kof_files_insert" on storage.objects;
drop policy if exists "kof_files_update" on storage.objects;
create policy "kof_files_read"   on storage.objects for select to anon using (bucket_id = 'jobsheets');
create policy "kof_files_insert" on storage.objects for insert to anon with check (bucket_id = 'jobsheets');
create policy "kof_files_update" on storage.objects for update to anon using (bucket_id = 'jobsheets') with check (bucket_id = 'jobsheets');
