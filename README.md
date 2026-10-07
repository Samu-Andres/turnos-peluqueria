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
  logo, fotos), staff, servicios (con opciones precargadas) y horarios por
  peluquero/a, métricas del mes y una **agenda general** con los turnos
  de todo el local: pendientes de confirmar arriba, confirmados por día y
  filtro por barbero.
- **Cuentas de staff.** En negocios con local, cada persona del staff
  puede tener su propia cuenta (por invitación por mail) para ver y
  manejar solo sus turnos y sus horarios.
- **Gestión del turno sin cuenta.** Al reservar como invitado, el cliente
  recibe un link para reprogramar o cancelar su turno.
- **Disponibilidad real.** Los horarios libres se calculan a partir de los
  horarios de trabajo cargados y los turnos ya ocupados, evitando
  superposiciones a nivel de base de datos.
- **Interfaz clara y responsive.** Sistema de diseño propio (tokens en
  `src/app/globals.css`), contraste AA, pensada primero para celular.

## Roles

- **Dueño (`owner`):** crea su negocio, administra staff, servicios y
  horarios, y ve/gestiona los turnos reservados.
- **Staff (`staff`):** ve y maneja sus propios turnos y horarios desde
  `/staff`. Entra por invitación del dueño.
- **Cliente (`client`):** busca un negocio por su URL (`/slug-del-negocio`),
  reserva un turno como invitado o con cuenta, y si tiene cuenta puede
  ver, reprogramar o cancelar sus turnos desde "Mis turnos".

## Stack

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 +
Supabase (Postgres, Auth, Storage y Row Level Security).

## Puesta en marcha

1. Instalá las dependencias:
   ```bash
   npm install
   ```
2. Creá un proyecto en [Supabase](https://supabase.com) y corré todo
   `supabase/schema.sql` en el SQL Editor. Crea tablas, políticas de RLS,
   triggers, funciones y los buckets de Storage.
   - Si tu base ya existía de una versión anterior, corré además
     `supabase/actualizar-base.sql` (se puede correr más de una vez).
3. Copiá `.env.local.example` a `.env.local` y completalo
   (Project Settings → API):
   ```bash
   cp .env.local.example .env.local
   ```
4. Corré el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Configuración de Supabase (necesaria en producción)

- **Authentication → URL Configuration**
  - *Site URL*: el dominio real (ej. `https://turnos.tudominio.com`),
    nunca `localhost`.
  - *Redirect URLs*: agregá `https://turnos.tudominio.com/**` (y
    `http://localhost:3000/**` para desarrollo).
- **Authentication → SMTP Settings**: configurá un proveedor propio
  (Resend, Brevo, etc.). El servidor de mail que trae Supabase manda muy
  pocos mails por hora y solo a miembros del equipo: con él aparece
  "email rate limit exceeded" y las invitaciones de staff no llegan.
- **Authentication → Email Templates**: pegá las plantillas en español de
  `supabase/email-templates/`:

  | Plantilla de Supabase | Archivo | Asunto sugerido |
  |---|---|---|
  | Confirm signup | `confirmar-cuenta.html` | Confirmá tu email |
  | Invite user | `invitacion-staff.html` | Te sumaron a Turnos Peluquería |
  | Reset password | `recuperar-password.html` | Elegí una nueva contraseña |

  Usan el formato `token_hash`, que funciona aunque el mail se abra en
  otro dispositivo o navegador.

## Estructura

```
src/
  app/
    [slug]/              página pública del negocio y flujo de reserva
    dashboard/            panel del dueño (negocio, agenda, staff, servicios, fotos)
    staff/                 panel de cada persona del staff
    mi-turno/[token]/      gestionar un turno sin cuenta
    mis-turnos/            turnos del cliente logueado
    login/, signup/        autenticación
  components/             componentes compartidos (encabezado, selectores de
                          día/horario, tarjeta de turno, reprogramar...)
  lib/
    actions/                server actions (auth, reservas, negocio, staff...)
    booking/                 cálculo de disponibilidad, formato de fechas
    supabase/                clientes de Supabase (browser, server, middleware)
  types/database.ts        tipos generados a mano a partir del esquema
supabase/
  schema.sql               esquema completo: tablas, RLS, triggers, Storage
  actualizar-base.sql      pone al día bases creadas con una versión vieja
  email-templates/         mails de Supabase en español
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

Pensado para desplegar en Vercel. Configurá en el proyecto las mismas
variables de `.env.local.example`:

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo servidor: invitar staff por mail)
- `NEXT_PUBLIC_SITE_URL` con el dominio real, para que los links de los
  mails y las vistas previas al compartir apunten ahí.
