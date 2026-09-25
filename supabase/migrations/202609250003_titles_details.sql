begin;
alter table public.titles
  add column if not exists details jsonb not null default '{}'::jsonb;
commit;
