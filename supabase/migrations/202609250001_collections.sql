begin;

-- Catálogo editorial: somente administradores alteram pelo SQL Editor.
create table public.titles (
  id text primary key,
  type text not null check (type in ('movie', 'series')),
  title text not null check (length(title) > 0)
);
create table public.user_collections (
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id text not null references public.titles(id) on delete cascade,
  kind text not null check (kind in ('favorites', 'watchlist', 'watched')),
  created_at timestamptz not null default now(),
  primary key (user_id, title_id, kind)
);
create index user_collections_title_idx on public.user_collections(title_id);

alter table public.titles enable row level security;
alter table public.user_collections enable row level security;
revoke all on public.titles, public.user_collections from anon, authenticated;
grant select on public.titles to anon, authenticated;
grant select, insert, update, delete on public.user_collections to authenticated;
grant all on public.titles, public.user_collections to service_role;

create policy titles_read on public.titles for select to anon, authenticated using (true);
create policy collections_read on public.user_collections for select to authenticated
  using ((select auth.uid()) = user_id);
create policy collections_insert on public.user_collections for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy collections_update on public.user_collections for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy collections_delete on public.user_collections for delete to authenticated
  using ((select auth.uid()) = user_id);

commit;
