-- Corgillion: base de datos para el candado del diario y la tabla de posiciones.
-- Cómo usarlo: en Supabase abre "SQL Editor", pega TODO este archivo y pulsa "Run".
-- Se puede ejecutar más de una vez sin romper nada.
--
-- Seguridad: las tablas no tienen ninguna política de acceso, así que nadie puede leerlas ni
-- escribirlas directamente. Todo pasa por las funciones de abajo, que comprueban el PIN.

create extension if not exists pgcrypto with schema extensions;

-- ---------- tablas ----------

create table if not exists public.jugadores (
  apodo    text primary key check (apodo ~ '^[A-Za-z0-9_áéíóúñÁÉÍÓÚÑ.-]{2,20}$'),
  pin_hash text not null,
  creado   timestamptz not null default now()
);

create table if not exists public.diarios (
  apodo      text not null references public.jugadores(apodo) on delete cascade,
  fecha      date not null,
  categoria  text not null check (categoria in ('clasica', 'pokemon', 'deportes', 'geografia')),
  puntos     int,
  respuestas jsonb,
  iniciado   timestamptz not null default now(),
  terminado  timestamptz,
  primary key (apodo, fecha, categoria)
);

create table if not exists public.records (
  apodo       text not null references public.jugadores(apodo) on delete cascade,
  categoria   text not null check (categoria in ('clasica', 'pokemon', 'deportes', 'geografia')),
  modo        text not null check (modo in ('clasico', 'sinfinal', 'contra')),
  puntos      int not null check (puntos >= 0),
  actualizado timestamptz not null default now(),
  primary key (apodo, categoria, modo)
);

alter table public.jugadores enable row level security;
alter table public.diarios   enable row level security;
alter table public.records   enable row level security;

revoke all on public.jugadores from anon, authenticated;
revoke all on public.diarios   from anon, authenticated;
revoke all on public.records   from anon, authenticated;

-- ---------- utilidades internas ----------

-- La fecha del día la decide el servidor (hora de Ciudad de México), no el reloj de cada jugador.
create or replace function public.fecha_servidor()
returns date
language sql stable
as $$ select (now() at time zone 'America/Mexico_City')::date $$;

-- Comprueba apodo y PIN. Devuelve true si coinciden.
create or replace function public.pin_correcto(p_apodo text, p_pin text)
returns boolean
language sql stable security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.jugadores
    where apodo = p_apodo and pin_hash = extensions.crypt(p_pin, pin_hash)
  )
$$;

-- ---------- funciones que usa el juego ----------

-- Entrar: si el apodo no existe se crea con ese PIN; si existe, el PIN debe coincidir.
create or replace function public.entrar(p_apodo text, p_pin text)
returns json
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if p_apodo is null or p_apodo !~ '^[A-Za-z0-9_áéíóúñÁÉÍÓÚÑ.-]{2,20}$' then
    return json_build_object('ok', false, 'error', 'apodo');
  end if;
  if p_pin is null or char_length(p_pin) < 4 or char_length(p_pin) > 12 then
    return json_build_object('ok', false, 'error', 'pin_formato');
  end if;

  if exists (select 1 from public.jugadores where lower(apodo) = lower(p_apodo)
             and apodo <> p_apodo) then
    return json_build_object('ok', false, 'error', 'apodo_parecido');
  end if;

  if not exists (select 1 from public.jugadores where apodo = p_apodo) then
    insert into public.jugadores (apodo, pin_hash)
    values (p_apodo, extensions.crypt(p_pin, extensions.gen_salt('bf')));
    return json_build_object('ok', true, 'nuevo', true);
  end if;

  if public.pin_correcto(p_apodo, p_pin) then
    return json_build_object('ok', true, 'nuevo', false);
  end if;
  return json_build_object('ok', false, 'error', 'pin');
end;
$$;

-- Empezar el diario de hoy. Cuenta como intento desde que se empieza, así nadie puede
-- salirse a medias y volver a intentarlo. Solo se puede una vez por categoría y día.
create or replace function public.iniciar_diario(p_apodo text, p_pin text, p_categoria text)
returns json
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  hoy date := public.fecha_servidor();
  fila public.diarios;
begin
  if not public.pin_correcto(p_apodo, p_pin) then
    return json_build_object('ok', false, 'error', 'pin');
  end if;
  if p_categoria not in ('clasica', 'pokemon', 'deportes', 'geografia') then
    return json_build_object('ok', false, 'error', 'categoria');
  end if;

  insert into public.diarios (apodo, fecha, categoria)
  values (p_apodo, hoy, p_categoria)
  on conflict (apodo, fecha, categoria) do nothing;

  if found then
    return json_build_object('ok', true, 'fecha', hoy);
  end if;

  select * into fila from public.diarios
  where apodo = p_apodo and fecha = hoy and categoria = p_categoria;
  return json_build_object(
    'ok', false, 'error', 'ya_jugado', 'fecha', hoy,
    'terminado', fila.terminado is not null, 'puntos', fila.puntos
  );
end;
$$;

-- Guardar el resultado del diario. Solo se puede guardar una vez por intento.
create or replace function public.terminar_diario(
  p_apodo text, p_pin text, p_categoria text, p_puntos int, p_respuestas jsonb
)
returns json
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  fila public.diarios;
begin
  if not public.pin_correcto(p_apodo, p_pin) then
    return json_build_object('ok', false, 'error', 'pin');
  end if;

  select * into fila from public.diarios
  where apodo = p_apodo and categoria = p_categoria and terminado is null
  order by fecha desc limit 1;

  if not found then
    return json_build_object('ok', false, 'error', 'sin_intento');
  end if;

  update public.diarios
  set puntos = least(greatest(coalesce(p_puntos, 0), 0), 700),
      respuestas = p_respuestas,
      terminado = now()
  where apodo = fila.apodo and fecha = fila.fecha and categoria = fila.categoria;

  return json_build_object('ok', true, 'fecha', fila.fecha);
end;
$$;

-- Subir un récord de los modos Libre, Sin final o Contrarreloj. Solo queda el mejor.
create or replace function public.subir_record(
  p_apodo text, p_pin text, p_categoria text, p_modo text, p_puntos int
)
returns json
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if not public.pin_correcto(p_apodo, p_pin) then
    return json_build_object('ok', false, 'error', 'pin');
  end if;
  if p_categoria not in ('clasica', 'pokemon', 'deportes', 'geografia') or p_modo not in ('clasico', 'sinfinal', 'contra') then
    return json_build_object('ok', false, 'error', 'datos');
  end if;

  insert into public.records (apodo, categoria, modo, puntos)
  values (p_apodo, p_categoria, p_modo, least(greatest(coalesce(p_puntos, 0), 0), 20000))
  on conflict (apodo, categoria, modo) do update
    set puntos = greatest(public.records.puntos, excluded.puntos),
        actualizado = now();

  return json_build_object('ok', true);
end;
$$;

-- Tabla del diario de un día (por defecto, hoy). Pública: no pide PIN.
create or replace function public.tabla_diaria(p_categoria text, p_fecha date default null)
returns table (apodo text, puntos int)
language sql stable security definer
set search_path = public, extensions
as $$
  select d.apodo, d.puntos
  from public.diarios d
  where d.categoria = p_categoria
    and d.fecha = coalesce(p_fecha, public.fecha_servidor())
    and d.terminado is not null
  order by d.puntos desc, d.terminado asc
  limit 50
$$;

-- Mejores récords por categoría y modo. Pública.
create or replace function public.tabla_records(p_categoria text, p_modo text)
returns table (apodo text, puntos int)
language sql stable security definer
set search_path = public, extensions
as $$
  select r.apodo, r.puntos
  from public.records r
  where r.categoria = p_categoria and r.modo = p_modo
  order by r.puntos desc, r.actualizado asc
  limit 50
$$;

-- ---------- permisos: el juego solo puede llamar a estas funciones ----------

revoke all on function public.pin_correcto(text, text) from public, anon, authenticated;

grant execute on function public.fecha_servidor()                               to anon, authenticated;
grant execute on function public.entrar(text, text)                             to anon, authenticated;
grant execute on function public.iniciar_diario(text, text, text)               to anon, authenticated;
grant execute on function public.terminar_diario(text, text, text, int, jsonb)  to anon, authenticated;
grant execute on function public.subir_record(text, text, text, text, int)      to anon, authenticated;
grant execute on function public.tabla_diaria(text, date)                       to anon, authenticated;
grant execute on function public.tabla_records(text, text)                      to anon, authenticated;
