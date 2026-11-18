// Consignas de Pokémon creadas cada día por REGLA (sin lista de respuestas): la base de datos decide quién es respuesta válida.
// Cada regla va en UNA línea, con JSON válido. Condiciones disponibles: ver el comentario de data/reglas.js.
// Esta carpeta se carga DESPUÉS de data/reglas.js. La tarea diaria añade bloques al final:
//
// CC.regla("pokemon", { since: "AAAA-MM-DD" }, [
//   ["Nombra un Pokémon de tipo Fuego que no sea de la primera generación", {"tipo": ["Fuego"], "gen_min": 2}],
// ]);

CC.regla("pokemon", { since: "2026-11-19" }, [
  ["Nombra un Pokémon de tipo Fantasma que pese menos de 10 kilos", {"tipo": ["Fantasma"], "peso_max": 9.9}],
  ["Nombra un Pokémon de tipo Eléctrico que mida un metro o más", {"tipo": ["Eléctrico"], "alt_min": 1}],
  ["Nombra un Pokémon con dos tipos que pese 200 kilos o más", {"num_tipos": 2, "peso_min": 200}],
  ["Nombra un Pokémon cuyo nombre en español termine en la letra R", {"termina": "r"}],
  ["Nombra un Pokémon de color verde que no sea de tipo Planta", {"color": "Verde", "sin_tipo": ["Planta"]}],
  ["Nombra un Pokémon de tipo Hada de la quinta generación o anteriores", {"tipo": ["Hada"], "gen_max": 5}],
  ["Nombra un Pokémon que pueda tener la habilidad Mudar", {"habilidad": "Mudar"}],
  ["Nombra un Pokémon que habite en el bosque", {"habitat": "bosque"}]
]);
