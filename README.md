# Turnos Peluquería

Sistema de reserva de turnos para peluquerías: el dueño del negocio administra
servicios, peluqueros/as y horarios, y los clientes reservan turnos online.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres,
Auth y Row Level Security).

## Roles

- **Dueño (`owner`)**: crea su negocio, administra staff, servicios y
  horarios de disponibilidad, y ve/gestiona los turnos reservados.
- **Cliente (`client`)**: busca un negocio, elige servicio, peluquero/a y
  horario disponible, y reserva su turno.

## Desarrollo local

1. Instalá las dependencias:
   ```bash
   npm install
   ```
2. Creá un proyecto en [Supabase](https://supabase.com) y corré el SQL de
   `supabase/schema.sql` en el SQL Editor del dashboard (crea las tablas,
   políticas de RLS y el trigger que crea el perfil al registrarse).
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
  app/                 rutas (App Router)
  lib/supabase/         clientes de Supabase (browser, server, middleware)
  types/database.ts      tipos de la base de datos
supabase/
  schema.sql             esquema completo: tablas, RLS, triggers, índices
```

## Modelo de datos

`profiles` (extiende `auth.users` con rol y datos propios) → `businesses`
(un negocio por dueño) → `staff` y `services` (por negocio) →
`working_hours` (disponibilidad semanal por peluquero/a) → `bookings`
(turnos reservados, con una restricción a nivel de base de datos que impide
que un mismo peluquero tenga dos turnos superpuestos).

## Deploy

Pensado para desplegar en Vercel. Hay que configurar las mismas variables
de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) en
el dashboard del proyecto.
