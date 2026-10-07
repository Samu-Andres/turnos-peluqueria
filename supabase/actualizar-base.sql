-- =============================================================
-- Pone al día una base creada con una versión vieja de schema.sql.
-- Se puede correr más de una vez sin romper nada (todo es
-- "if not exists" / "or replace" / "drop ... if exists").
-- Correr entero en Supabase → SQL Editor.
-- =============================================================

-- ---------------------------------------------------------------
-- 1) Gestionar turno sin cuenta (link con manage_token).
--    Sin esta columna fallan TODAS las reservas.
-- ---------------------------------------------------------------
alter table public.bookings
  add column if not exists manage_token uuid not null default gen_random_uuid();

create unique index if not exists bookings_manage_token_key
  on public.bookings (manage_token);

create or replace function public.get_booking_by_token(p_token uuid)
returns setof public.bookings
language sql
security definer
set search_path = public
stable
as $$
  select * from public.bookings where manage_token = p_token;
$$;

grant execute on function public.get_booking_by_token(uuid) to anon, authenticated;

create or replace function public.cancel_booking_by_token(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.bookings
    set status = 'cancelled'
    where manage_token = p_token
      and status in ('pending', 'confirmed');
  get diagnostics updated_count = row_count;
  return updated_count > 0;
end;
$$;

grant execute on function public.cancel_booking_by_token(uuid) to anon, authenticated;

create or replace function public.reschedule_booking_by_token(
  p_token uuid,
  p_start timestamptz,
  p_end timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.bookings
    set start_at = p_start, end_at = p_end
    where manage_token = p_token
      and status in ('pending', 'confirmed');
  get diagnostics updated_count = row_count;
  return updated_count > 0;
end;
$$;

grant execute on function public.reschedule_booking_by_token(uuid, timestamptz, timestamptz)
  to anon, authenticated;

-- ---------------------------------------------------------------
-- 2) Cuentas de staff (mail + cuenta vinculada).
-- ---------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('owner', 'client', 'staff'));

alter table public.staff add column if not exists email text;
alter table public.staff
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create unique index if not exists staff_user_id_key
  on public.staff (user_id) where user_id is not null;

drop policy if exists "working_hours: el propio staff administra su horario" on public.working_hours;
create policy "working_hours: el propio staff administra su horario"
  on public.working_hours for all
  using (
    exists (
      select 1 from public.staff
      where staff.id = working_hours.staff_id
        and staff.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.staff
      where staff.id = working_hours.staff_id
        and staff.user_id = auth.uid()
    )
  );

drop policy if exists "bookings: el propio staff ve sus turnos asignados" on public.bookings;
create policy "bookings: el propio staff ve sus turnos asignados"
  on public.bookings for select
  using (
    exists (
      select 1 from public.staff
      where staff.id = bookings.staff_id
        and staff.user_id = auth.uid()
    )
  );

drop policy if exists "bookings: el propio staff actualiza sus turnos asignados" on public.bookings;
create policy "bookings: el propio staff actualiza sus turnos asignados"
  on public.bookings for update
  using (
    exists (
      select 1 from public.staff
      where staff.id = bookings.staff_id
        and staff.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------
-- 3) Fotos del negocio.
-- ---------------------------------------------------------------
create table if not exists public.business_photos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);

alter table public.business_photos enable row level security;

drop policy if exists "business_photos: lectura pública" on public.business_photos;
create policy "business_photos: lectura pública"
  on public.business_photos for select
  using (true);

drop policy if exists "business_photos: el dueño administra sus fotos" on public.business_photos;
create policy "business_photos: el dueño administra sus fotos"
  on public.business_photos for all
  using (
    exists (
      select 1 from public.businesses
      where businesses.id = business_photos.business_id
        and businesses.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses
      where businesses.id = business_photos.business_id
        and businesses.owner_id = auth.uid()
    )
  );

create index if not exists business_photos_business_idx
  on public.business_photos (business_id);

insert into storage.buckets (id, name, public)
values ('business-photos', 'business-photos', true)
on conflict (id) do nothing;

drop policy if exists "business-photos: lectura pública" on storage.objects;
create policy "business-photos: lectura pública"
  on storage.objects for select
  using (bucket_id = 'business-photos');

drop policy if exists "business-photos: el dueño sube sus fotos" on storage.objects;
create policy "business-photos: el dueño sube sus fotos"
  on storage.objects for insert
  with check (
    bucket_id = 'business-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "business-photos: el dueño borra sus fotos" on storage.objects;
create policy "business-photos: el dueño borra sus fotos"
  on storage.objects for delete
  using (
    bucket_id = 'business-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------
-- 4) Que la API de Supabase vea las columnas nuevas ya mismo
--    (si no, puede seguir diciendo "schema cache" un rato).
-- ---------------------------------------------------------------
notify pgrst, 'reload schema';
