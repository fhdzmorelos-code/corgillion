// Consignas de Pokémon creadas cada día por REGLA (sin lista de respuestas): la base de datos decide quién es respuesta válida.
// Cada regla va en UNA línea, con JSON válido. Condiciones disponibles: ver el comentario de data/reglas.js.
// Esta carpeta se carga DESPUÉS de data/reglas.js. La tarea diaria añade bloques al final:
//
// CC.regla("pokemon", { since: "AAAA-MM-DD" }, [
//   ["Nombra un Pokémon de tipo Fuego que no sea de la primera generación", {"tipo": ["Fuego"], "gen_min": 2}],
// ]);
