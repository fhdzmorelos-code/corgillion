// Conexión con la base de datos de la tabla de posiciones (Supabase).
// Mientras "url" y "key" estén vacíos, el juego funciona solo, sin cuentas ni tabla en línea.
// Estos dos valores son públicos por diseño (la "anon key" / "publishable key" de Supabase):
// pueden estar en el repositorio. NUNCA pongas aquí la clave "service_role".
window.CORGI_ONLINE = {
  url: "",
  key: ""
};
