# Conectar la tabla de posiciones (Supabase)

El juego funciona solo, sin esto. Estos pasos activan los apodos, la tabla de posiciones y el candado que impide jugar el diario más de una vez al día. Son unos 10 minutos y es gratis.

1. **Crea una cuenta** en https://supabase.com (gratis) y un **proyecto nuevo**. Elige una región cercana. La contraseña de la base de datos no la necesita el juego; guárdala donde quieras.
2. **Crea las tablas.** En el proyecto abre **SQL Editor**, pulsa **New query**, pega TODO el contenido de `supabase/esquema.sql` y pulsa **Run**. Debe terminar sin errores. Se puede ejecutar más de una vez sin problema.
3. **Copia dos datos públicos.** En **Project Settings > API** copia:
   - **Project URL** (algo como `https://abcdefgh.supabase.co`)
   - la clave **anon** (o **publishable**) de la sección de claves.

   **No copies la clave `service_role`**: esa es secreta y daría acceso total a la base de datos.
4. **Pégalos en `config.js`**, entre las comillas de `url` y `key`, y guarda. Estos dos valores son públicos por diseño: pueden estar en el repositorio.
5. Abre el juego: debe aparecer el panel **Jugador** en la pantalla de inicio. Entra con un apodo y un PIN y prueba el diario.

## Cómo funciona la seguridad

- Las tablas no tienen ningún acceso directo desde el navegador. Todo pasa por las funciones de `esquema.sql`, que comprueban el PIN.
- El PIN se guarda cifrado (bcrypt), nunca en texto.
- La fecha del día la decide el servidor, en hora de Ciudad de México.
- El diario cuenta como jugado desde que se empieza, así que no se puede salir a medias y reintentar.

## Límites que conviene saber

- Los puntajes se calculan en el navegador de cada jugador, así que alguien con conocimientos podría enviar un puntaje falso. Entre amigos suele bastar.
- Alguien con muchas ganas podría adivinar un PIN de 4 dígitos probando muchas combinaciones; usen PIN más largos si les preocupa.
- Los proyectos gratuitos de Supabase pueden pausarse tras una semana sin uso; se reactivan desde el panel.
