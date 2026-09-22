-- =============================================================
-- Turnos Peluquería — esquema inicial de Supabase (Postgres)
-- Correr esto una vez en el SQL Editor del dashboard de Supabase.
-- =============================================================

-- ---------------------------------------------------------------
-- profiles: extiende auth.users con datos propios de la app
-- ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'client' check (role in ('owner', 'client')),
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: el usuario ve y edita su propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: el usuario actualiza su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Crea el perfil automáticamente cuando alguien se registra.
-- full_name y role se pasan como metadata al hacer signUp().
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Sin nombre'),
    coalesce(new.raw_user_meta_data ->> 'role', 'client')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------
-- businesses: el negocio (peluquería) de un dueño
-- ---------------------------------------------------------------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  address text,
  phone text,
  description text,
  logo_url text,
  serves_at_home boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.businesses enable row level security;

create policy "businesses: lectura pública"
  on public.businesses for select
  using (true);

create policy "businesses: el dueño crea su negocio"
  on public.businesses for insert
  with check (auth.uid() = owner_id);

create policy "businesses: el dueño edita su negocio"
  on public.businesses for update
  using (auth.uid() = owner_id);

create policy "businesses: el dueño borra su negocio"
  on public.businesses for delete
  using (auth.uid() = owner_id);

-- ---------------------------------------------------------------
-- staff: peluqueros/as de un negocio
-- ---------------------------------------------------------------
create table public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  full_name text not null,
  photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.staff enable row level security;

create policy "staff: lectura pública"
  on public.staff for select
  using (true);

create policy "staff: el dueño del negocio administra su staff"
  on public.staff for all
  using (
    exists (
      select 1 from public.businesses
      where businesses.id = staff.business_id
        and businesses.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses
      where businesses.id = staff.business_id
        and businesses.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------
-- services: servicios que ofrece el negocio (corte, color, etc.)
-- ---------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10, 2) not null check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.services enable row level security;

create policy "services: lectura pública"
  on public.services for select
  using (true);

create policy "services: el dueño del negocio administra sus servicios"
  on public.services for all
  using (
    exists (
      select 1 from public.businesses
      where businesses.id = services.business_id
        and businesses.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses
      where businesses.id = services.business_id
        and businesses.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------
-- working_hours: disponibilidad semanal recurrente de cada staff
-- day_of_week: 0 = domingo ... 6 = sábado (igual que JS Date#getDay)
-- ---------------------------------------------------------------
create table public.working_hours (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  created_at timestamptz not null default now()
);

alter table public.working_hours enable row level security;

create policy "working_hours: lectura pública"
  on public.working_hours for select
  using (true);

create policy "working_hours: el dueño del negocio administra los horarios"
  on public.working_hours for all
  using (
    exists (
      select 1 from public.staff
      join public.businesses on businesses.id = staff.business_id
      where staff.id = working_hours.staff_id
        and businesses.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.staff
      join public.businesses on businesses.id = staff.business_id
      where staff.id = working_hours.staff_id
        and businesses.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------
-- bookings: turnos reservados por un cliente
-- ---------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  staff_id uuid not null references public.staff (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  -- null = reserva de invitado, sin cuenta (ver client_name/client_phone).
  client_id uuid references public.profiles (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null check (end_at > start_at),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  client_address text,
  client_name text,
  client_phone text,
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

-- Evita que se pisen dos turnos del mismo peluquero al mismo tiempo.
create extension if not exists btree_gist;

alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    staff_id with =,
    tstzrange(start_at, end_at) with &&
  )
  where (status in ('pending', 'confirmed'));

create policy "bookings: el cliente ve sus propios turnos"
  on public.bookings for select
  using (
    client_id = auth.uid()
    or exists (
      select 1 from public.businesses
      where businesses.id = bookings.business_id
        and businesses.owner_id = auth.uid()
    )
  );

-- Se puede reservar con cuenta (client_id = auth.uid()) o como
-- invitado, sin cuenta (client_id null, con client_name/client_phone
-- cargados a mano en el form). No se permite insertar un turno a
-- nombre de otra cuenta.
create policy "bookings: con cuenta o como invitado"
  on public.bookings for insert
  with check (client_id is null or client_id = auth.uid());

create policy "bookings: cliente o dueño actualizan (ej. cancelar/confirmar)"
  on public.bookings for update
  using (
    client_id = auth.uid()
    or exists (
      select 1 from public.businesses
      where businesses.id = bookings.business_id
        and businesses.owner_id = auth.uid()
    )
  );

create index bookings_staff_start_idx on public.bookings (staff_id, start_at);
create index bookings_client_idx on public.bookings (client_id);
create index bookings_business_idx on public.bookings (business_id);

-- ---------------------------------------------------------------
-- get_busy_intervals: usada por el flujo público de reserva (y por
-- reprogramar un turno) para calcular horarios disponibles. Las
-- policies de bookings solo dejan leer turnos propios o del dueño
-- del negocio, así que un visitante anónimo no puede hacer un
-- select directo a bookings para saber qué horarios están ocupados.
-- Esta función corre con los privilegios del dueño del esquema
-- (security definer) pero solo expone id/start_at/end_at de turnos
-- activos de un staff — nada de datos del cliente que reservó. El
-- id se usa para poder excluir el propio turno cuando se lo está
-- reprogramando (si no, chocaría contra sí mismo).
-- ---------------------------------------------------------------
drop function if exists public.get_busy_intervals(uuid, timestamptz, timestamptz);

create function public.get_busy_intervals(
  p_staff_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (id uuid, start_at timestamptz, end_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select id, start_at, end_at
  from public.bookings
  where staff_id = p_staff_id
    and status in ('pending', 'confirmed')
    and start_at < p_to
    and end_at > p_from;
$$;

grant execute on function public.get_busy_intervals(uuid, timestamptz, timestamptz)
  to anon, authenticated;

-- ---------------------------------------------------------------
-- profiles: el dueño de un negocio también necesita poder ver el
-- perfil (nombre) de los clientes que le reservaron un turno, para
-- identificarlos en el panel de turnos. La policy original (cada
-- usuario ve solo su propio perfil) se lo impedía; esta se suma
-- (las policies de select son aditivas, se combinan con OR).
-- ---------------------------------------------------------------
create policy "profiles: el dueño ve clientes con turnos en su negocio"
  on public.profiles for select
  using (
    exists (
      select 1 from public.bookings
      join public.businesses on businesses.id = bookings.business_id
      where bookings.client_id = profiles.id
        and businesses.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------
-- logo_url: para una base ya existente (creada antes de que
-- businesses tuviera esta columna), sumarla sin romper nada.
-- ---------------------------------------------------------------
alter table public.businesses add column if not exists logo_url text;

-- ---------------------------------------------------------------
-- Storage: bucket público "logos" para los logos de cada negocio.
-- Cada archivo se guarda como {owner_id}/logo-<timestamp>.<ext>, así
-- que las policies solo dejan tocar objetos dentro de la carpeta del
-- propio dueño (auth.uid()), pero cualquiera puede leerlos (bucket
-- público, necesario para mostrarlos en la página pública del
-- negocio).
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "logos: lectura pública"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "logos: el dueño sube su logo"
  on storage.objects for insert
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "logos: el dueño actualiza su logo"
  on storage.objects for update
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "logos: el dueño borra su logo"
  on storage.objects for delete
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------
-- Atender a domicilio: un negocio sin local fijo (ej. un barbero
-- que trabaja solo y va a la casa del cliente) se marca con
-- serves_at_home = true. En ese caso la página pública muestra un
-- aviso en vez de (o además de) la dirección del negocio, y el
-- flujo de reserva le pide al cliente SU dirección, que queda
-- guardada en el turno (bookings.client_address) para que el dueño
-- sepa adónde ir.
-- ---------------------------------------------------------------
alter table public.businesses
  add column if not exists serves_at_home boolean not null default false;

alter table public.bookings
  add column if not exists client_address text;

-- ---------------------------------------------------------------
-- Reservar como invitado: ya no hace falta crear cuenta para sacar
-- un turno. client_id pasa a ser opcional (null = invitado) y se
-- suman client_name/client_phone, que el form de reserva completa
-- siempre (con o sin sesión), así el dueño siempre tiene con quién
-- comunicarse aunque el cliente no tenga cuenta.
-- ---------------------------------------------------------------
alter table public.bookings alter column client_id drop not null;
alter table public.bookings add column if not exists client_name text;
alter table public.bookings add column if not exists client_phone text;

drop policy if exists "bookings: el cliente reserva a su propio nombre" on public.bookings;

drop policy if exists "bookings: con cuenta o como invitado" on public.bookings;
create policy "bookings: con cuenta o como invitado"
  on public.bookings for insert
  with check (client_id is null or client_id = auth.uid());
