-- ==============================================================================
-- MIGRACIÓN DEFINITIVA: Habilitar inserción pública (anon) para reservas de clientes
-- Archivo: docs/habilitar_reservas_publicas_rls.sql
-- ==============================================================================

-- 1. Permitir que clientes anónimos puedan registrarse en la tabla customers
--    siempre que el negocio exista, esté activo y publicado.
drop policy if exists public_customers_insert on public.customers;
create policy public_customers_insert on public.customers
for insert to anon, authenticated
with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.status = 'active'
      and b.is_published = true
  )
);

-- 2. Permitir que clientes anónimos puedan crear citas (appointments)
--    para negocios activos y publicados.
drop policy if exists public_appointments_insert on public.appointments;
create policy public_appointments_insert on public.appointments
for insert to anon, authenticated
with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.status = 'active'
      and b.is_published = true
  )
);

-- 3. Permitir que se inserten los servicios de la cita en appointment_services
drop policy if exists public_appointment_services_insert on public.appointment_services;
create policy public_appointment_services_insert on public.appointment_services
for insert to anon, authenticated
with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.status = 'active'
      and b.is_published = true
  )
);
