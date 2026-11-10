-- Lesson progress for signed-in readers: one row per lesson they've finished.
-- Reading never needs an account; this only stores what an account tracks.
-- Run once in the Supabase dashboard (SQL Editor), or with `supabase db push`.

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  section text not null check (char_length(section) between 1 and 100),
  topic text not null check (char_length(topic) between 1 and 200),
  completed_at timestamptz not null default now(),
  primary key (user_id, section, topic)
);

-- Each user can see, add and remove only their own rows.
alter table public.lesson_progress enable row level security;

drop policy if exists "Readers see their own progress" on public.lesson_progress;
create policy "Readers see their own progress"
  on public.lesson_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Readers record their own progress" on public.lesson_progress;
create policy "Readers record their own progress"
  on public.lesson_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Readers clear their own progress" on public.lesson_progress;
create policy "Readers clear their own progress"
  on public.lesson_progress for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, delete on public.lesson_progress to authenticated;
