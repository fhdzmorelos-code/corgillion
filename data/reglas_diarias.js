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

CC.regla("pokemon", { since: "2026-11-21" }, [
  ["Nombra un Pokémon de tipo Tierra que también tenga otro tipo", {"tipo": ["Tierra"], "num_tipos": 2}],
  ["Nombra un Pokémon cuyo nombre en español empiece con la letra C", {"empieza": "c"}],
  ["Nombra un Pokémon de color gris", {"color": "Gris"}],
  ["Nombra un Pokémon que pueda tener la habilidad Robustez", {"habilidad": "Robustez"}],
  ["Nombra un Pokémon que habite en praderas", {"habitat": "pradera"}],
  ["Nombra un Pokémon de tipo Roca con 100 o más de defensa base", {"tipo": ["Roca"], "defensa_min": 100}],
  ["Nombra un Pokémon con 100 o más de PS base que no sea legendario ni mítico", {"ps_min": 100, "leg": "no"}]
]);

CC.regla("pokemon", { since: "2026-11-22" }, [
  ["Nombra un Pokémon cuyo nombre en español empiece con la letra P", {"empieza": "p"}],
  ["Nombra un Pokémon que pueda tener la habilidad Clorofila", {"habilidad": "Clorofila"}],
  ["Nombra un Pokémon con 110 o más de defensa especial base que no sea legendario ni mítico", {"defensa_esp_min": 110, "leg": "no"}],
  ["Nombra un Pokémon cuyas estadísticas base sumen 600 o más", {"total_min": 600}],
  ["Nombra un Pokémon de tipo Hielo que también tenga otro tipo", {"tipo": ["Hielo"], "num_tipos": 2}],
  ["Nombra un Pokémon de tipo Acero que pese 100 kilos o más", {"tipo": ["Acero"], "peso_min": 100}],
  ["Nombra un Pokémon de tipo Veneno que no sea de la primera generación", {"tipo": ["Veneno"], "gen_min": 2}]
]);

CC.regla("pokemon", { since: "2026-11-23" }, [
  ["Nombra un Pokémon cuyo nombre en español empiece con la letra B", {"empieza": "b"}],
  ["Nombra un Pokémon que pueda tener la habilidad Absorbe Agua", {"habilidad": "Absorbe Agua"}],
  ["Nombra un Pokémon de tipo Lucha que también tenga otro tipo", {"tipo": ["Lucha"], "num_tipos": 2}],
  ["Nombra un Pokémon de tipo Planta que mida un metro o más", {"tipo": ["Planta"], "alt_min": 1}],
  ["Nombra un Pokémon de la tercera generación de un solo tipo", {"gen": 3, "num_tipos": 1}],
  ["Nombra un Pokémon de tipo Eléctrico con 100 o más de velocidad base", {"tipo": ["Eléctrico"], "velocidad_min": 100}],
  ["Nombra un Pokémon que habite en el campo", {"habitat": "campo"}]
]);
