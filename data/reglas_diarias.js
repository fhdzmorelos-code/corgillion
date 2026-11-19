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

CC.regla("pokemon", { since: "2026-11-20" }, [
  ["Nombra un Pokémon de tipo Agua que pese 100 kilos o más", {"tipo": ["Agua"], "peso_min": 100}],
  ["Nombra un Pokémon que sea de tipo Planta y Veneno a la vez", {"tipos": ["Planta", "Veneno"]}],
  ["Nombra un Pokémon que pueda tener la habilidad Nado Rápido", {"habilidad": "Nado Rápido"}],
  ["Nombra un Pokémon que habite en la ciudad", {"habitat": "ciudad"}],
  ["Nombra un Pokémon cuyo nombre en español termine en la letra A", {"termina": "a"}],
  ["Nombra un Pokémon con 110 o más de ataque especial base que no sea legendario ni mítico", {"ataque_esp_min": 110, "leg": "no"}],
  ["Nombra un Pokémon de color rojo", {"color": "Rojo"}],
  ["Nombra un Pokémon de tipo Volador con 100 o más de velocidad base", {"tipo": ["Volador"], "velocidad_min": 100}]
]);
