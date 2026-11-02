-- SKEDLY | Esquema inicial Supabase | MVP multi-tenant
-- Ejecutar en Supabase > SQL Editor. Ejecutar una sola vez.
-- Las reservas públicas deben crearse desde el backend, nunca dando INSERT anon.
begin;
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$ begin create type public.business_status as enum ('active','suspended','archived'); exception when duplicate_object then null; end; $$;
do $$ begin create type public.membership_role as enum ('owner','admin','manager','employee'); exception when duplicate_object then null; end; $$;
do $$ begin create type public.appointment_status as enum ('pending','confirmed','completed','cancelled','no_show'); exception when duplicate_object then null; end; $$;
do $$ begin create type public.appointment_source as enum ('public_page','dashboard','phone','whatsapp','other'); exception when duplicate_object then null; end; $$;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;

-- Perfiles vinculados a Supabase Auth
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text, avatar_url text, phone text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name')) on conflict(id) do nothing;
 return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- Negocios (tenants)
create table if not exists public.businesses (
 id uuid primary key default gen_random_uuid(), created_by uuid not null references auth.users(id) on delete restrict,
 name text not null, slug text not null unique, description text, email text, phone text, website_url text,
 timezone text not null default 'America/Mexico_City', currency char(3) not null default 'MXN',
 status public.business_status not null default 'active', is_published boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint businesses_slug_format check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 constraint businesses_currency_format check(currency ~ '^[A-Z]{3}$')
);
create index if not exists businesses_created_by_idx on public.businesses(created_by);
drop trigger if exists businesses_updated_at on public.businesses;
create trigger businesses_updated_at before update on public.businesses for each row execute function public.set_updated_at();

-- Un usuario puede pertenecer a varios negocios
create table if not exists public.business_memberships (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role public.membership_role not null default 'employee', created_at timestamptz not null default now(),
 unique(business_id,user_id), unique(id,business_id)
);
create index if not exists memberships_user_idx on public.business_memberships(user_id);
create index if not exists memberships_business_idx on public.business_memberships(business_id);

-- Sucursales
create table if not exists public.locations (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 name text not null, address_line text, city text, state text, postal_code text, country text not null default 'MX',
 phone text, timezone text, is_active boolean not null default true, is_default boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,business_id)
);
create unique index if not exists locations_one_default_idx on public.locations(business_id) where is_default;
create index if not exists locations_business_idx on public.locations(business_id);
drop trigger if exists locations_updated_at on public.locations;
create trigger locations_updated_at before update on public.locations for each row execute function public.set_updated_at();

-- Categorías y servicios
create table if not exists public.service_categories (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 name text not null, description text, display_order integer not null default 0, is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(id,business_id), unique(business_id,name)
);
create index if not exists categories_business_idx on public.service_categories(business_id,display_order);
drop trigger if exists categories_updated_at on public.service_categories;
create trigger categories_updated_at before update on public.service_categories for each row execute function public.set_updated_at();

create table if not exists public.services (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 category_id uuid, name text not null, description text, duration_minutes integer not null,
 buffer_minutes integer not null default 0, price numeric(12,2) not null default 0,
 is_active boolean not null default true, display_order integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,business_id),
 constraint services_duration_positive check(duration_minutes>0), constraint services_buffer_nonnegative check(buffer_minutes>=0),
 constraint services_price_nonnegative check(price>=0),
 constraint services_category_same_business foreign key(category_id,business_id)
 references public.service_categories(id,business_id) on delete set null (category_id)
);
create index if not exists services_business_idx on public.services(business_id,is_active,display_order);
drop trigger if exists services_updated_at on public.services;
create trigger services_updated_at before update on public.services for each row execute function public.set_updated_at();

-- Profesionales/empleados. profile_id es opcional si también tendrán acceso al dashboard.
create table if not exists public.employees (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 profile_id uuid references public.profiles(id) on delete set null, display_name text not null,
 email text, phone text, bio text, avatar_url text, is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,business_id)
);
create unique index if not exists employees_profile_unique_idx on public.employees(business_id,profile_id) where profile_id is not null;
create index if not exists employees_business_idx on public.employees(business_id,is_active);
drop trigger if exists employees_updated_at on public.employees;
create trigger employees_updated_at before update on public.employees for each row execute function public.set_updated_at();

create table if not exists public.employee_services (
 business_id uuid not null references public.businesses(id) on delete cascade, employee_id uuid not null, service_id uuid not null,
 created_at timestamptz not null default now(), primary key(employee_id,service_id),
 foreign key(employee_id,business_id) references public.employees(id,business_id) on delete cascade,
 foreign key(service_id,business_id) references public.services(id,business_id) on delete cascade
);
create index if not exists employee_services_service_idx on public.employee_services(service_id);

create table if not exists public.employee_locations (
 business_id uuid not null references public.businesses(id) on delete cascade, employee_id uuid not null, location_id uuid not null,
 created_at timestamptz not null default now(), primary key(employee_id,location_id),
 foreign key(employee_id,business_id) references public.employees(id,business_id) on delete cascade,
 foreign key(location_id,business_id) references public.locations(id,business_id) on delete cascade
);

-- Clientes sin necesidad de que tengan cuenta
create table if not exists public.customers (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 full_name text not null, email text, phone text, notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,business_id)
);
create index if not exists customers_business_idx on public.customers(business_id);
create index if not exists customers_email_idx on public.customers(business_id,lower(email)) where email is not null;
create index if not exists customers_phone_idx on public.customers(business_id,phone) where phone is not null;
drop trigger if exists customers_updated_at on public.customers;
create trigger customers_updated_at before update on public.customers for each row execute function public.set_updated_at();

-- Horarios semanales: weekday 0=domingo ... 6=sábado. Varios intervalos por día permitidos.
create table if not exists public.working_hours (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 employee_id uuid, location_id uuid, weekday smallint not null, start_time time not null, end_time time not null,
 is_available boolean not null default true, created_at timestamptz not null default now(),
 constraint working_hours_weekday check(weekday between 0 and 6), constraint working_hours_range check(end_time>start_time),
 foreign key(employee_id,business_id) references public.employees(id,business_id) on delete cascade,
 foreign key(location_id,business_id) references public.locations(id,business_id) on delete cascade
);
create index if not exists working_hours_lookup_idx on public.working_hours(business_id,employee_id,location_id,weekday);

-- Excepciones: vacaciones, festivos, bloqueos o turnos especiales.
create table if not exists public.availability_exceptions (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 employee_id uuid, location_id uuid, exception_date date not null, is_available boolean not null default false,
 start_time time, end_time time, reason text, created_at timestamptz not null default now(),
 constraint exceptions_time_range check((start_time is null and end_time is null) or (start_time is not null and end_time is not null and end_time>start_time)),
 foreign key(employee_id,business_id) references public.employees(id,business_id) on delete cascade,
 foreign key(location_id,business_id) references public.locations(id,business_id) on delete cascade
);
create index if not exists exceptions_lookup_idx on public.availability_exceptions(business_id,exception_date,employee_id);

-- Citas. Timestamps con zona horaria. Los snapshots conservan datos del cliente al reservar.
create table if not exists public.appointments (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 location_id uuid, customer_id uuid not null, employee_id uuid,
 status public.appointment_status not null default 'confirmed', source public.appointment_source not null default 'dashboard',
 start_at timestamptz not null, end_at timestamptz not null,
 customer_name_snapshot text, customer_email_snapshot text, customer_phone_snapshot text,
 internal_notes text, cancellation_reason text, created_by uuid references auth.users(id) on delete set null,
 cancelled_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(id,business_id), constraint appointments_valid_range check(end_at>start_at),
 foreign key(customer_id,business_id) references public.customers(id,business_id) on delete restrict,
 foreign key(employee_id,business_id) references public.employees(id,business_id) on delete restrict,
 foreign key(location_id,business_id) references public.locations(id,business_id) on delete restrict
);
create index if not exists appointments_business_start_idx on public.appointments(business_id,start_at);
create index if not exists appointments_employee_start_idx on public.appointments(employee_id,start_at) where employee_id is not null;
create index if not exists appointments_customer_idx on public.appointments(customer_id,start_at desc);
create index if not exists appointments_status_idx on public.appointments(business_id,status,start_at);
-- Impide cruces horarios de citas activas del mismo empleado.
alter table public.appointments drop constraint if exists appointments_no_employee_overlap;
alter table public.appointments add constraint appointments_no_employee_overlap exclude using gist
(employee_id with =, tstzrange(start_at,end_at,'[)') with &&)
where(employee_id is not null and status in ('pending','confirmed'));
-- Para citas sin profesional asignado, impide dos reservas simultáneas en el mismo negocio.
alter table public.appointments drop constraint if exists appointments_no_unassigned_overlap;
alter table public.appointments add constraint appointments_no_unassigned_overlap exclude using gist
(business_id with =, tstzrange(start_at,end_at,'[)') with &&)
where(employee_id is null and status in ('pending','confirmed'));
drop trigger if exists appointments_updated_at on public.appointments;
create trigger appointments_updated_at before update on public.appointments for each row execute function public.set_updated_at();

-- Detalle de servicios de cada cita; snapshots para preservar precio/duración históricos.
create table if not exists public.appointment_services (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 appointment_id uuid not null, service_id uuid, service_name text not null, unit_price numeric(12,2) not null,
 duration_minutes integer not null, quantity integer not null default 1, created_at timestamptz not null default now(),
 constraint appointment_services_price check(unit_price>=0), constraint appointment_services_duration check(duration_minutes>0),
 constraint appointment_services_quantity check(quantity>0),
 foreign key(appointment_id,business_id) references public.appointments(id,business_id) on delete cascade,
 foreign key(service_id,business_id) references public.services(id,business_id) on delete set null (service_id)
);
create index if not exists appointment_services_appointment_idx on public.appointment_services(appointment_id);

-- Configuración visual básica de la página pública
create table if not exists public.website_settings (
 business_id uuid primary key references public.businesses(id) on delete cascade,
 headline text, about_text text, logo_url text, cover_url text,
 primary_color text not null default '#4F6DF5', show_prices boolean not null default true,
 show_employee_profiles boolean not null default true, booking_enabled boolean not null default true,
 updated_at timestamptz not null default now()
);
drop trigger if exists website_settings_updated_at on public.website_settings;
create trigger website_settings_updated_at before update on public.website_settings for each row execute function public.set_updated_at();

-- Funciones auxiliares para RLS
create or replace function public.is_business_member(p_business_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.business_memberships bm where bm.business_id=p_business_id and bm.user_id=(select auth.uid()));
$$;
create or replace function public.has_business_role(p_business_id uuid,p_roles public.membership_role[]) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.business_memberships bm where bm.business_id=p_business_id and bm.user_id=(select auth.uid()) and bm.role=any(p_roles));
$$;
create or replace function public.is_business_creator(p_business_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.businesses b where b.id=p_business_id and b.created_by=(select auth.uid()));
$$;

-- Activar RLS en todas las tablas de la aplicación
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_memberships enable row level security;
alter table public.locations enable row level security;
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.employees enable row level security;
alter table public.employee_services enable row level security;
alter table public.employee_locations enable row level security;
alter table public.customers enable row level security;
alter table public.working_hours enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;
alter table public.website_settings enable row level security;

-- Policies de perfiles
 drop policy if exists profile_read_self on public.profiles;
create policy profile_read_self on public.profiles for select to authenticated using(id=(select auth.uid()));
drop policy if exists profile_update_self on public.profiles;
create policy profile_update_self on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));

-- Policies de negocios
 drop policy if exists business_read_public_or_member on public.businesses;
create policy business_read_public_or_member on public.businesses for select to anon,authenticated
using((status='active' and is_published=true) or public.is_business_member(id));
drop policy if exists business_insert_creator on public.businesses;
create policy business_insert_creator on public.businesses for insert to authenticated with check(created_by=(select auth.uid()));
drop policy if exists business_update_admin on public.businesses;
create policy business_update_admin on public.businesses for update to authenticated
using(public.has_business_role(id,array['owner','admin']::public.membership_role[]))
with check(public.has_business_role(id,array['owner','admin']::public.membership_role[]));
drop policy if exists business_delete_owner on public.businesses;
create policy business_delete_owner on public.businesses for delete to authenticated using(public.has_business_role(id,array['owner']::public.membership_role[]));

-- El usuario que crea el negocio puede insertarse como owner inicial.
drop policy if exists membership_read_member on public.business_memberships;
create policy membership_read_member on public.business_memberships for select to authenticated using(public.is_business_member(business_id));
drop policy if exists membership_insert_initial_owner on public.business_memberships;
create policy membership_insert_initial_owner on public.business_memberships for insert to authenticated
with check(user_id=(select auth.uid()) and role='owner' and public.is_business_creator(business_id));
drop policy if exists membership_manage_admin on public.business_memberships;
create policy membership_manage_admin on public.business_memberships for all to authenticated
using(public.has_business_role(business_id,array['owner','admin']::public.membership_role[]))
with check(public.has_business_role(business_id,array['owner','admin']::public.membership_role[]));

-- Policies privadas para el resto de tablas tenant-scoped.
do $$ declare t text; begin
 foreach t in array array['locations','service_categories','services','employees','employee_services','employee_locations','customers','working_hours','availability_exceptions','appointments','appointment_services','website_settings'] loop
  execute format('drop policy if exists %I on public.%I',t||'_member_read',t);
  execute format('create policy %I on public.%I for select to authenticated using(public.is_business_member(business_id))',t||'_member_read',t);
  execute format('drop policy if exists %I on public.%I',t||'_manager_insert',t);
  execute format('create policy %I on public.%I for insert to authenticated with check(public.has_business_role(business_id,array[''owner'',''admin'',''manager'']::public.membership_role[]))',t||'_manager_insert',t);
  execute format('drop policy if exists %I on public.%I',t||'_manager_update',t);
  execute format('create policy %I on public.%I for update to authenticated using(public.has_business_role(business_id,array[''owner'',''admin'',''manager'']::public.membership_role[])) with check(public.has_business_role(business_id,array[''owner'',''admin'',''manager'']::public.membership_role[]))',t||'_manager_update',t);
  execute format('drop policy if exists %I on public.%I',t||'_manager_delete',t);
  execute format('create policy %I on public.%I for delete to authenticated using(public.has_business_role(business_id,array[''owner'',''admin'',''manager'']::public.membership_role[]))',t||'_manager_delete',t);
 end loop;
end; $$;

-- Lectura pública SOLO de información necesaria para la página publicada.
-- No se concede acceso público a clientes ni citas.
drop policy if exists public_locations_read on public.locations;
create policy public_locations_read on public.locations for select to anon,authenticated using(is_active and exists(select 1 from public.businesses b where b.id=business_id and b.status='active' and b.is_published));
drop policy if exists public_categories_read on public.service_categories;
create policy public_categories_read on public.service_categories for select to anon,authenticated using(is_active and exists(select 1 from public.businesses b where b.id=business_id and b.status='active' and b.is_published));
drop policy if exists public_services_read on public.services;
create policy public_services_read on public.services for select to anon,authenticated using(is_active and exists(select 1 from public.businesses b where b.id=business_id and b.status='active' and b.is_published));
-- No exponer email/teléfono de empleados en la página pública.
drop policy if exists public_employees_read on public.employees;
revoke select on public.employees from anon;
grant select(id,business_id,display_name,bio,avatar_url,is_active) on public.employees to anon;
create or replace view public.public_employees with (security_invoker=true) as
 select id,business_id,display_name,bio,avatar_url,is_active from public.employees;
grant select on public.public_employees to anon,authenticated;
create policy public_employees_read on public.employees for select to anon using(is_active and exists(select 1 from public.businesses b where b.id=business_id and b.status='active' and b.is_published));
drop policy if exists public_employee_services_read on public.employee_services;
create policy public_employee_services_read on public.employee_services for select to anon,authenticated using(exists(select 1 from public.businesses b where b.id=business_id and b.status='active' and b.is_published));
drop policy if exists public_employee_locations_read on public.employee_locations;
create policy public_employee_locations_read on public.employee_locations for select to anon,authenticated using(exists(select 1 from public.businesses b where b.id=business_id and b.status='active' and b.is_published));
drop policy if exists public_working_hours_read on public.working_hours;
create policy public_working_hours_read on public.working_hours for select to anon,authenticated using(exists(select 1 from public.businesses b where b.id=business_id and b.status='active' and b.is_published));
-- Las excepciones de disponibilidad se consultan desde el backend para no exponer notas internas.
drop policy if exists public_exceptions_read on public.availability_exceptions;
drop policy if exists public_website_settings_read on public.website_settings;
create policy public_website_settings_read on public.website_settings for select to anon,authenticated using(exists(select 1 from public.businesses b where b.id=business_id and b.status='active' and b.is_published));

-- No crear policies anon de INSERT/SELECT para customers, appointments o appointment_services.
-- El backend debe validar horarios y crear cliente+cita+detalle dentro de una transacción.
commit;
