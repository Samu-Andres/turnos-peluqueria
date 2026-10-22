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
    set start_at = p_start, end_at = p_end, status = 'pending'
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
-- 5) Proteger los turnos.
-- ---------------------------------------------------------------

-- 5a) Borrar un servicio o una persona del staff ya NO se lleva puestos
--     sus turnos (antes era "on delete cascade" y se perdían en silencio,
--     incluso los futuros confirmados). Ahora la base no deja borrarlos
--     mientras tengan turnos: hay que desactivarlos. Borrar el negocio
--     entero sigue funcionando (los turnos caen por business_id).
alter table public.bookings drop constraint if exists bookings_service_id_fkey;
alter table public.bookings
  add constraint bookings_service_id_fkey
  foreign key (service_id) references public.services (id);

alter table public.bookings drop constraint if exists bookings_staff_id_fkey;
alter table public.bookings
  add constraint bookings_staff_id_fkey
  foreign key (staff_id) references public.staff (id);

-- 5b) Reservar (con cuenta o como invitado): solo turnos pendientes, en
--     el futuro, con un servicio y una persona activos de ESE negocio.
--     Antes cualquiera con la clave pública podía crear turnos ya
--     confirmados, en el pasado o mezclando negocios.
drop policy if exists "bookings: con cuenta o como invitado" on public.bookings;
create policy "bookings: con cuenta o como invitado"
  on public.bookings for insert
  with check (
    (client_id is null or client_id = auth.uid())
    and status = 'pending'
    and start_at > now()
    and exists (
      select 1 from public.staff
      where staff.id = bookings.staff_id
        and staff.business_id = bookings.business_id
        and staff.active
    )
    and exists (
      select 1 from public.services
      where services.id = bookings.service_id
        and services.business_id = bookings.business_id
        and services.active
    )
  );

-- 5c) Un cliente (con cuenta o con el link del turno) solo puede
--     cancelar o reprogramar un turno activo; no confirmárselo, ni cambiar
--     el servicio, la persona o los datos de contacto. El dueño y la
--     persona asignada pueden todo. Las tareas de mantenimiento (SQL
--     Editor, service role) no pasan por este control.
create or replace function public.bookings_guard_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  );
begin
  if jwt_role not in ('anon', 'authenticated') then
    return new;
  end if;

  if exists (
       select 1 from public.businesses
       where businesses.id = old.business_id
         and businesses.owner_id = auth.uid()
     )
     or exists (
       select 1 from public.staff
       where staff.id = old.staff_id
         and staff.user_id = auth.uid()
     ) then
    return new;
  end if;

  if old.status not in ('pending', 'confirmed')
     or new.status not in ('pending', 'cancelled')
     or new.business_id <> old.business_id
     or new.staff_id <> old.staff_id
     or new.service_id <> old.service_id
     or new.client_id is distinct from old.client_id
     or new.manage_token <> old.manage_token
     or new.client_name is distinct from old.client_name
     or new.client_phone is distinct from old.client_phone
     or new.client_address is distinct from old.client_address
     or new.notes is distinct from old.notes then
    raise exception 'Ese cambio en el turno no está permitido'
      using errcode = '42501';
  end if;

  -- Si cambia el horario, vuelve a "pendiente" para que el negocio lo vea.
  if (new.start_at <> old.start_at or new.end_at <> old.end_at)
     and new.status <> 'cancelled' then
    new.status := 'pending';
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_guard_update on public.bookings;
create trigger bookings_guard_update
  before update on public.bookings
  for each row execute function public.bookings_guard_update();

-- ---------------------------------------------------------------
-- 7) Turnos cargados a mano y días libres.
-- ---------------------------------------------------------------

-- 7a) De dónde salió cada turno: "online" (lo reservó el cliente en la
--     web) o "manual" (lo cargó el negocio: WhatsApp, teléfono, alguien
--     que vino al local).
alter table public.bookings
  add column if not exists source text not null default 'online';
alter table public.bookings drop constraint if exists bookings_source_check;
alter table public.bookings
  add constraint bookings_source_check check (source in ('online', 'manual'));

-- 7b) El dueño (o la persona del staff con cuenta, para sus propios
--     turnos) puede cargar turnos a mano, ya confirmados. Se suma a la
--     policy de reservas online (las policies de insert se combinan con OR).
drop policy if exists "bookings: el negocio carga turnos a mano" on public.bookings;
create policy "bookings: el negocio carga turnos a mano"
  on public.bookings for insert
  with check (
    client_id is null
    and exists (
      select 1 from public.staff
      where staff.id = bookings.staff_id
        and staff.business_id = bookings.business_id
    )
    and exists (
      select 1 from public.services
      where services.id = bookings.service_id
        and services.business_id = bookings.business_id
    )
    and (
      exists (
        select 1 from public.businesses
        where businesses.id = bookings.business_id
          and businesses.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.staff
        where staff.id = bookings.staff_id
          and staff.user_id = auth.uid()
      )
    )
  );

-- 7c) Días libres y vacaciones por persona del staff (días completos,
--     de start_date a end_date inclusive). Esos días no se ofrecen
--     turnos online. Lectura pública porque el cálculo de horarios libres
--     corre también para visitantes sin sesión.
create table if not exists public.time_off (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint time_off_dates_check check (end_date >= start_date)
);

alter table public.time_off enable row level security;

drop policy if exists "time_off: lectura pública" on public.time_off;
create policy "time_off: lectura pública"
  on public.time_off for select
  using (true);

drop policy if exists "time_off: el dueño administra los días libres" on public.time_off;
create policy "time_off: el dueño administra los días libres"
  on public.time_off for all
  using (
    exists (
      select 1 from public.staff
      join public.businesses on businesses.id = staff.business_id
      where staff.id = time_off.staff_id
        and businesses.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.staff
      join public.businesses on businesses.id = staff.business_id
      where staff.id = time_off.staff_id
        and businesses.owner_id = auth.uid()
    )
  );

drop policy if exists "time_off: el propio staff administra sus días libres" on public.time_off;
create policy "time_off: el propio staff administra sus días libres"
  on public.time_off for all
  using (
    exists (
      select 1 from public.staff
      where staff.id = time_off.staff_id
        and staff.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.staff
      where staff.id = time_off.staff_id
        and staff.user_id = auth.uid()
    )
  );

create index if not exists time_off_staff_dates_idx
  on public.time_off (staff_id, start_date, end_date);

-- ---------------------------------------------------------------
-- 6) Que la API de Supabase vea las columnas nuevas ya mismo
--    (si no, puede seguir diciendo "schema cache" un rato).
-- ---------------------------------------------------------------
notify pgrst, 'reload schema';
