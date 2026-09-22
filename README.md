# Turnos Peluquería

Plataforma de reservas online para peluquerías y barberías. Cada dueño
crea su propio negocio (con su logo, su staff y sus servicios) y sus
clientes reservan turnos desde una página pública, sin fricción y sin
necesidad de crear una cuenta.

## Funcionalidades

- **Reserva de turnos sin cuenta.** El cliente elige servicio, peluquero/a
  y horario, y confirma dejando nombre y teléfono. Si además tiene una
  cuenta creada, el turno queda asociado a "Mis turnos" para poder
  reprogramarlo o cancelarlo más adelante.
- **Negocios con o sin local propio.** Al crear la cuenta, el dueño elige
  si atiende en un local o va a domicilio; en ese segundo caso, la reserva
  le pide la dirección al cliente.
- **Panel del dueño.** Alta y edición del negocio (nombre, descripción,
  logo), staff, servicios y horarios de disponibilidad por peluquero/a, y
  gestión de los turnos reservados (confirmar, reprogramar, cancelar,
  marcar como completado).
- **Disponibilidad real.** Los horarios libres se calculan a partir de los
  horarios de trabajo cargados y los turnos ya ocupados, evitando
  superposiciones a nivel de base de datos.
- **Interfaz oscura, responsive.** Pensada para verse bien en celular,
  tablet y escritorio.

## Roles

- **Dueño (`owner`):** crea su negocio, administra staff, servicios y
  horarios, y ve/gestiona los turnos reservados.
- **Cliente (`client`):** busca un negocio por su URL (`/slug-del-negocio`),
  reserva un turno como invitado o con cuenta, y si tiene cuenta puede
  ver, reprogramar o cancelar sus turnos desde "Mis turnos".

## Stack

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 +
Supabase (Postgres, Auth, Storage y Row Level Security).

## Desarrollo local

1. Instalá las dependencias:
   ```bash
   npm install
   ```
2. Creá un proyecto en [Supabase](https://supabase.com) y corré todo el
   SQL de `supabase/schema.sql` en el SQL Editor del dashboard. Ese script
   crea las tablas, las políticas de RLS, el trigger que crea el perfil al
   registrarse y el bucket de Storage donde se guardan los logos.
3. Copiá `.env.local.example` a `.env.local` y completá con la URL y la
   `anon key` de tu proyecto (Project Settings → API):
   ```bash
   cp .env.local.example .env.local
   ```
4. Corré el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Estructura

```
src/
  app/
    [slug]/              página pública del negocio y flujo de reserva
    dashboard/            panel del dueño (negocio, staff, servicios, turnos)
    mis-turnos/            turnos del cliente logueado
    login/, signup/        autenticación
  components/             componentes compartidos (logo, reprogramar turno)
  lib/
    actions/                server actions (auth, reservas, negocio, staff...)
    booking/                 cálculo de disponibilidad, formato de fechas
    supabase/                clientes de Supabase (browser, server, middleware)
  types/database.ts        tipos generados a mano a partir del esquema
supabase/
  schema.sql               esquema completo: tablas, RLS, triggers, Storage
```

## Modelo de datos

`profiles` (extiende `auth.users` con rol y datos propios) → `businesses`
(un negocio por dueño, con `logo_url` y `serves_at_home`) → `staff` y
`services` (por negocio) → `working_hours` (disponibilidad semanal por
peluquero/a) → `bookings` (turnos reservados, con `client_id` opcional
para reservas de invitado, `client_name`/`client_phone` siempre
cargados, y una restricción a nivel de base de datos que impide que un
mismo peluquero tenga dos turnos superpuestos).

## Deploy

Pensado para desplegar en Vercel. Hay que configurar las mismas variables
de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en
el dashboard del proyecto.
