// Consignas de Pokémon definidas por REGLAS sobre la base de datos (data/pokedex.js).
// En vez de escribir la lista de respuestas, cada consigna lleva una función que dice qué Pokémon cumplen.
// Las respuestas válidas y su nivel de rareza se calculan solos. Ver "oscuridad" más abajo.
//
// Uso:  CC.regla("pokemon", null | { since: "AAAA-MM-DD" }, [
//         ["Nombra un Pokémon de tipo Fuego que no sea de la primera generación", function (p) { return tipo(p, "Fuego") && p.g > 1; }],
//       ]);
// Debe cargarse DESPUÉS de data/core.js y data/pokedex.js.
(function (root) {
  "use strict";
  var CC = root.CC, DEX = root.CC_DEX;
  if (!CC || !DEX) { return; }

  // Datos extra (data/pokedex_extra.js): formas regionales, megas, ultraentes, fósiles, iniciales, anime.
  var EX = root.CC_DEX_EXTRA || {};
  var en = function (lista, n) { return (lista || []).indexOf(n) >= 0; };
  DEX.forEach(function (p) {
    var n = String(p.n);
    p.formas = (EX.formas || {})[n] || [];
    p.formaTipos = (EX.forma_tipos || {})[n] || [];
    p.mega = en(EX.megas, p.n) ? 1 : 0;
    p.megaTipos = (EX.mega_tipos || {})[n] || [];
    p.ultraente = en(EX.ultraentes, p.n) ? 1 : 0;
    p.fosil = en(EX.fosiles, p.n) ? 1 : 0;
    p.inicial = en(EX.iniciales, p.n) ? 1 : 0;
    p.lineaInicial = en(EX.linea_inicial, p.n) ? 1 : 0;
    p.ash = en(EX.ash, p.n) ? 1 : 0;
    p.rocket = Object.keys(EX.rocket || {}).filter(function (per) { return en(EX.rocket[per], p.n); });
  });

  // ---------- Fama: lo que cualquiera diría primero ----------
  var ICONOS = ("Pikachu Charizard Charmander Bulbasaur Squirtle Eevee Mewtwo Mew Gengar Snorlax Jigglypuff Meowth Psyduck " +
    "Magikarp Gyarados Dragonite Lucario Greninja Blastoise Venusaur Lapras Arcanine Ditto Rayquaza Garchomp Umbreon Espeon " +
    "Lugia Ho-Oh Gardevoir Machamp Onix Geodude Zubat Rattata Pidgey Vulpix Ninetales Raichu Cubone Scyther Gastly Alakazam " +
    "Togepi Charmeleon Wartortle Ivysaur Sylveon Vaporeon Jolteon Flareon Leafeon Glaceon Blaziken Sceptile Swampert " +
    "Tyranitar Salamence Metagross Mimikyu Zorua Lucario Pichu Slowpoke Growlithe Ponyta Machop Abra Kadabra Haunter Voltorb").split(" ");
  var POPULARES = ("Clefairy Clefable Nidoking Nidoqueen Golem Dugtrio Poliwhirl Poliwrath Tentacruel Magnemite Magneton Dodrio Seel " +
    "Muk Cloyster Hitmonlee Hitmonchan Koffing Weezing Rhydon Chansey Tangela Kangaskhan Horsea Seadra Goldeen Seaking Starmie " +
    "Mr.Mime Jynx Electabuzz Magmar Pinsir Tauros Aerodactyl Articuno Zapdos Moltres Dratini Dragonair Cyndaquil Typhlosion " +
    "Totodile Feraligatr Chikorita Meganium Marill Sudowoodo Togetic Mareep Ampharos Wooper Quagsire Murkrow Misdreavus " +
    "Unown Wobbuffet Girafarig Steelix Snubbull Granbull Scizor Heracross Sneasel Teddiursa Ursaring Slugma Corsola Remoraid " +
    "Octillery Delibird Mantine Skarmory Houndour Houndoom Kingdra Phanpy Donphan Porygon2 Stantler Smeargle Tyrogue " +
    "Hitmontop Smoochum Elekid Magby Miltank Blissey Raikou Entei Suicune Larvitar Pupitar Celebi Treecko Grovyle Torchic " +
    "Combusken Mudkip Marshtomp Ralts Kirlia Shroomish Breloom Slakoth Vigoroth Slaking Nincada Ninjask Whismur Loudred " +
    "Exploud Makuhita Hariyama Azurill Sableye Mawile Aron Lairon Aggron Meditite Medicham Electrike Manectric Plusle Minun " +
    "Roselia Gulpin Swalot Carvanha Sharpedo Wailmer Wailord Numel Camerupt Torkoal Spoink Grumpig Trapinch Vibrava Flygon " +
    "Cacnea Cacturne Swablu Altaria Zangoose Seviper Lunatone Solrock Barboach Whiscash Corphish Crawdaunt Baltoy Claydol " +
    "Feebas Milotic Castform Kecleon Shuppet Banette Duskull Dusclops Tropius Chimecho Absol Wynaut Snorunt Glalie Spheal " +
    "Sealeo Walrein Clamperl Huntail Gorebyss Relicanth Luvdisc Bagon Shelgon Beldum Metang Regirock Regice Registeel " +
    "Latias Latios Kyogre Groudon Jirachi Deoxys Turtwig Grotle Torterra Chimchar Monferno Infernape Piplup Prinplup Empoleon " +
    "Starly Staravia Staraptor Bidoof Bibarel Kricketot Shinx Luxio Luxray Buizel Floatzel Cherubi Cherrim Shellos Gastrodon " +
    "Drifloon Drifblim Buneary Lopunny Glameow Purugly Stunky Skuntank Bronzor Bronzong Bonsly Mime Jr. Happiny Chatot " +
    "Spiritomb Gible Gabite Munchlax Riolu Hippopotas Hippowdon Skorupi Drapion Croagunk Toxicroak Carnivine Finneon Lumineon " +
    "Mantyke Snover Abomasnow Weavile Magnezone Lickilicky Rhyperior Tangrowth Electivire Magmortar Togekiss Yanmega " +
    "Leafeon Glaceon Gliscor Mamoswine Porygon-Z Gallade Probopass Dusknoir Froslass Rotom Uxie Mesprit Azelf Dialga Palkia " +
    "Heatran Regigigas Giratina Cresselia Phione Manaphy Darkrai Shaymin Arceus Victini Snivy Tepig Oshawott Zekrom Reshiram " +
    "Kyurem Genesect Keldeo Meloetta Froakie Frogadier Fennekin Chespin Rowlet Litten Popplio Decidueye Incineroar Primarina " +
    "Rockruff Lycanroc Solgaleo Lunala Necrozma Marshadow Zeraora Grookey Scorbunny Sobble Cinderace Rillaboom Inteleon " +
    "Zacian Zamazenta Eternatus Sprigatito Fuecoco Quaxly Meowscarada Skeledirge Quaquaval Koraidon Miraidon").split(" ");
  var ICON = {}, POP = {};
  ICONOS.forEach(function (n) { ICON[n.toLowerCase()] = 1; });
  POPULARES.forEach(function (n) { POP[n.toLowerCase()] = 1; });

  var GEN = [0, 0, 0.05, 0.12, 0.16, 0.22, 0.26, 0.28, 0.30, 0.32];

  // 0 = lo primero que diría cualquiera, 1 = rarísimo. Fórmula: generación, número, etapa de evolución,
  // si es bebé/mítico, estadísticas bajas y dos listas de Pokémon famosos que bajan la oscuridad.
  function oscuridad(p) {
    var n = p.en.toLowerCase();
    var o = GEN[p.g] + (p.n / 1025) * 0.12;
    var bst = p.st[0] + p.st[1] + p.st[2] + p.st[3] + p.st[4] + p.st[5];
    if (p.bebe) { o += 0.30; }
    else if (p.etapa === 0 && p.evoluciona) { o += 0.04; }
    else if (p.etapa >= 1 && p.evoluciona) { o += 0.12; }
    else if (p.etapa >= 1) { o += 0.02; }
    if (p.leg === 2) { o += 0.12; }
    if (bst < 300) { o += 0.06; }
    if (ICON[n]) { o = 0; }
    else if (POP[n]) { o -= 0.22; }
    return Math.max(0, Math.min(1, o));
  }

  var CORTES = [0.10, 0.20, 0.30, 0.40, 0.50];
  function nivelAbsoluto(o) {
    for (var i = 0; i < CORTES.length; i++) { if (o < CORTES[i]) { return i; } }
    return 5;
  }
  var PCT = [0.12, 0.35, 0.60, 0.80, 0.93];
  function nivelRelativo(r) {
    for (var i = 0; i < PCT.length; i++) { if (r < PCT[i]) { return i; } }
    return 5;
  }

  // ---------- Ayudas para escribir reglas ----------
  function tipo(p, t) { return p.t.indexOf(t) >= 0; }
  function inicial(p) { return CC.norm(p.es).charAt(0); }
  function letras(p) { return CC.norm(p.es).length; }
  function bst(p) { return p.st[0] + p.st[1] + p.st[2] + p.st[3] + p.st[4] + p.st[5]; }
  // Pokémon que EVOLUCIONA con ese método (la forma de partida, no el resultado).
  function metodo(p, m) {
    var re = { nivel: /^Level/i, piedra: /Stone|Cuff|Wreath/, intercambio: /trade/i, amistad: /Friendship/ }[m];
    return p.a.some(function (e) { return re.test(e.cond); });
  }
  function sinEvo(p) { return !p.evoluciona && p.de.length === 0; }
  function tiene(p, hab) { return p.hab.indexOf(hab) >= 0 || p.oculta.indexOf(hab) >= 0; }
  var H = { tipo: tipo, inicial: inicial, letras: letras, bst: bst, metodo: metodo, sinEvo: sinEvo, tiene: tiene };

  // ---------- Reglas declarativas (las que escribe la tarea diaria) ----------
  // Una regla es un objeto JSON con estas condiciones (todas deben cumplirse):
  //   tipo: ["Fuego","Agua"]  alguno de esos tipos        tipos: [...]  todos esos tipos      sin_tipo: [...]  ninguno
  //   num_tipos: 1 | 2        gen: [1,2]  gen_min  gen_max       leg: "no" | "legendario" | "mitico" | "cualquiera"
  //   evo: "ninguna" | "evoluciona" | "no_evoluciona" | "es_evolucion" | "etapa0" | "etapa1" | "etapa2" | "final3"
  //   metodo: "intercambio" | "piedra" | "amistad" | "nivel"   (el Pokémon EVOLUCIONA con ese método)
  //   empieza: "m"   termina: "o"   letras: 5   letras_min   letras_max   (sobre el nombre en español)
  //   alt_min alt_max (metros)   peso_min peso_max (kg)   ps_min ataque_min defensa_min ataque_esp_min defensa_esp_min velocidad_min total_min total_max
  //   color: "Rosa"   habilidad: "Levitación"   habitat: "caverna"   bebe: 1   excluir: ["Pikachu"]
  //   forma: "Alola" | "Galar" | "Hisui" | "Paldea" | "cualquiera"   forma_tipo: ["Hielo"]  (tipo de su forma regional)
  //   mega: 1 (puede megaevolucionar, incluye Leyendas Z-A)   mega_tipo: ["Dragón"]  (tipo de su megaevolución)
  //   ultraente: 1   fosil: 1   inicial: "base" (primera etapa, incluye Pikachu y Eevee) | "linea" (los 27 iniciales y sus evoluciones)
  //   ash: 1 (lo tuvo Ash en el anime)   rocket: ["Jessie", "James", "Giovanni", "Butch", "Cassidy"] | "cualquiera"
  var CLAVES = ["tipo", "tipos", "sin_tipo", "num_tipos", "gen", "gen_min", "gen_max", "leg", "evo", "metodo", "empieza", "termina",
    "letras", "letras_min", "letras_max", "alt_min", "alt_max", "peso_min", "peso_max", "ps_min", "ataque_min", "defensa_min",
    "ataque_esp_min", "defensa_esp_min", "velocidad_min", "total_min", "total_max", "color", "habilidad", "habitat", "bebe", "excluir",
    "forma", "forma_tipo", "mega", "mega_tipo", "ultraente", "fosil", "inicial", "ash", "rocket"];
  var STATS = { ps_min: 0, ataque_min: 1, defensa_min: 2, ataque_esp_min: 3, defensa_esp_min: 4, velocidad_min: 5 };

  function desde(spec) {
    Object.keys(spec).forEach(function (k) {
      if (CLAVES.indexOf(k) < 0) { throw new Error("condición desconocida: " + k); }
    });
    var lista = function (v) { return Array.isArray(v) ? v : [v]; };
    return function (p) {
      var nom = CC.norm(p.es), k, v;
      for (k in spec) {
        v = spec[k];
        if (k === "tipo" && !lista(v).some(function (t) { return tipo(p, t); })) { return false; }
        if (k === "tipos" && !lista(v).every(function (t) { return tipo(p, t); })) { return false; }
        if (k === "sin_tipo" && lista(v).some(function (t) { return tipo(p, t); })) { return false; }
        if (k === "num_tipos" && p.t.length !== v) { return false; }
        if (k === "gen" && lista(v).indexOf(p.g) < 0) { return false; }
        if (k === "gen_min" && p.g < v) { return false; }
        if (k === "gen_max" && p.g > v) { return false; }
        if (k === "leg") {
          if (v === "no" && p.leg !== 0) { return false; }
          if (v === "legendario" && p.leg !== 1) { return false; }
          if (v === "mitico" && p.leg !== 2) { return false; }
          if (v === "cualquiera" && p.leg === 0) { return false; }
        }
        if (k === "evo") {
          if (v === "ninguna" && !sinEvo(p)) { return false; }
          if (v === "evoluciona" && p.a.length === 0) { return false; }
          if (v === "no_evoluciona" && p.a.length > 0) { return false; }
          if (v === "es_evolucion" && p.de.length === 0) { return false; }
          if (/^etapa\d$/.test(v) && p.etapa !== +v.charAt(5)) { return false; }
          if (v === "final3" && !(p.etapa === 2 && p.a.length === 0)) { return false; }
        }
        if (k === "metodo" && !metodo(p, v)) { return false; }
        if (k === "empieza" && !lista(v).some(function (x) { return nom.indexOf(CC.norm(x)) === 0; })) { return false; }
        if (k === "termina" && !lista(v).some(function (x) { var t = CC.norm(x); return nom.slice(nom.length - t.length) === t; })) { return false; }
        if (k === "letras" && nom.length !== v) { return false; }
        if (k === "letras_min" && nom.length < v) { return false; }
        if (k === "letras_max" && nom.length > v) { return false; }
        if (k === "alt_min" && p.alt < v) { return false; }
        if (k === "alt_max" && p.alt > v) { return false; }
        if (k === "peso_min" && p.peso < v) { return false; }
        if (k === "peso_max" && p.peso > v) { return false; }
        if (STATS.hasOwnProperty(k) && p.st[STATS[k]] < v) { return false; }
        if (k === "total_min" && bst(p) < v) { return false; }
        if (k === "total_max" && bst(p) > v) { return false; }
        if (k === "color" && p.color !== v) { return false; }
        if (k === "habilidad" && !tiene(p, v)) { return false; }
        if (k === "habitat" && p.habitat !== v) { return false; }
        if (k === "bebe" && p.bebe !== v) { return false; }
        if (k === "excluir" && lista(v).some(function (x) { return CC.norm(x) === nom || CC.norm(x) === CC.norm(p.en); })) { return false; }
        if (k === "forma" && !(v === "cualquiera" ? p.formas.length : p.formas.indexOf(v) >= 0)) { return false; }
        if (k === "forma_tipo" && !lista(v).some(function (t) { return p.formaTipos.indexOf(t) >= 0; })) { return false; }
        if (k === "mega" && p.mega !== v) { return false; }
        if (k === "mega_tipo" && !lista(v).some(function (t) { return p.megaTipos.indexOf(t) >= 0; })) { return false; }
        if (k === "ultraente" && p.ultraente !== v) { return false; }
        if (k === "fosil" && p.fosil !== v) { return false; }
        if (k === "inicial" && !(v === "base" ? p.inicial : p.lineaInicial)) { return false; }
        if (k === "ash" && p.ash !== v) { return false; }
        if (k === "rocket" && !(v === "cualquiera" ? p.rocket.length : lista(v).some(function (x) { return p.rocket.indexOf(x) >= 0; }))) { return false; }
      }
      return true;
    };
  }

  // ---------- Motor ----------
  var MIN = 12, MAX = 160;

  function respuestas(f) {
    var lista = DEX.filter(typeof f === "function" ? f : desde(f)).map(function (p) { return { p: p, o: oscuridad(p) }; });
    lista.sort(function (a, b) { return a.o - b.o || a.p.n - b.p.n; });
    var vistos = {}, total = lista.length, niveles = [[], [], [], [], [], []];
    lista.forEach(function (x, i) {
      var nom = x.p.es !== x.p.en ? x.p.es + "/" + x.p.en : x.p.es;
      var clave = CC.norm(x.p.es);
      if (vistos[clave]) { return; }
      vistos[clave] = 1;
      var lvl = Math.round((nivelAbsoluto(x.o) + nivelRelativo(i / total)) / 2);
      niveles[lvl].push(nom);
    });
    return { n: total, niveles: niveles };
  }

  function regla(cat, meta, filas) {
    var rows = [];
    filas.forEach(function (fila) {
      var r;
      try { r = respuestas(fila[1]); }
      catch (e) { if (root.console) { console.warn("Regla inválida (" + e.message + "): " + fila[0]); } return; }
      if (r.n < MIN || r.n > MAX) {
        if (root.console) { console.warn("Regla fuera de rango (" + r.n + " respuestas): " + fila[0]); }
        return;
      }
      rows.push([fila[0]].concat(r.niveles.map(function (l) { return l.join(";"); })));
    });
    if (rows.length) { CC.add(cat, meta, rows); }
  }

  // Completa consignas escritas a mano con todos los Pokémon de la base de datos que cumplen la regla.
  // Las respuestas escritas a mano se conservan (con su nivel); solo se agregan las que faltan.
  function completar(cat, filas) {
    var c = CC.cats[cat];
    if (!c) { return; }
    filas.forEach(function (fila) {
      var r = respuestas(fila[1]), row = [fila[0]].concat(r.niveles.map(function (l) { return l.join(";"); }));
      var nuevas = CC.build(row);
      c.prompts.forEach(function (pr) {
        if (pr.q !== fila[0]) { return; }
        var claves = {};
        pr.answers.forEach(function (a) { a.keys.forEach(function (k) { claves[k] = 1; }); });
        nuevas.forEach(function (a) {
          if (a.keys.some(function (k) { return claves[k]; })) { return; }
          pr.answers.push(a);
        });
      });
    });
  }

  CC.regla = regla;
  CC.reglasDesde = desde;
  CC.completar = completar;

  // Igual que completar, pero con una fila ya escrita ["consigna", n0..n5] (la usa data/pokemon_objetos.js).
  CC.completarFilas = function (cat, filas) {
    var c = CC.cats[cat];
    if (!c) { return; }
    filas.forEach(function (row) {
      var nuevas = CC.build(row);
      c.prompts.forEach(function (pr) {
        if (pr.q !== row[0]) { return; }
        var claves = {};
        pr.answers.forEach(function (a) { a.keys.forEach(function (k) { claves[k] = a; }); });
        nuevas.forEach(function (a) {
          var ya = null;
          a.keys.forEach(function (k) { if (!ya && claves[k]) ya = claves[k]; });
          if (!ya) { pr.answers.push(a); a.keys.forEach(function (k) { claves[k] = a; }); return; }
          // la respuesta ya estaba: sus otros nombres (por ejemplo el inglés "Ice Beam") pasan a ser alias de la existente
          a.keys.forEach(function (k) { if (!claves[k]) { ya.keys.push(k); claves[k] = ya; } });
        });
        CC.bilingue(pr.answers);
      });
    });
  };
  CC.reglasAyuda = H;
  CC.reglasRespuestas = respuestas;
  CC.oscuridad = oscuridad;

  // ---------- Consignas por regla ----------
  var NOLEG = function (p) { return p.leg === 0; };

  regla("pokemon", null, [
    ["Nombra un Pokémon de tipo Fantasma que no sea de la primera generación", function (p) { return tipo(p, "Fantasma") && p.g > 1; }],
    ["Nombra un Pokémon de tipo Dragón que no sea legendario ni mítico", function (p) { return tipo(p, "Dragón") && NOLEG(p); }],
    ["Nombra un Pokémon de tipo Acero o de tipo Hada", function (p) { return tipo(p, "Acero") || tipo(p, "Hada"); }],
    ["Nombra un Pokémon de tipo Hielo que evolucione o sea resultado de una evolución", function (p) { return tipo(p, "Hielo") && !sinEvo(p); }],
    ["Nombra un Pokémon de tipo Siniestro que no sea de la primera ni de la segunda generación", function (p) { return tipo(p, "Siniestro") && p.g > 2; }],
    ["Nombra un Pokémon de tipo Lucha que no sea legendario", function (p) { return tipo(p, "Lucha") && NOLEG(p); }],
    ["Nombra un Pokémon de tipo Psíquico y de otro tipo a la vez", function (p) { return tipo(p, "Psíquico") && p.t.length === 2; }],
    ["Nombra un Pokémon de tipo Agua que también sea de tipo Volador, Tierra o Veneno", function (p) {
      return tipo(p, "Agua") && (tipo(p, "Volador") || tipo(p, "Tierra") || tipo(p, "Veneno")); }],
    ["Nombra un Pokémon de tipo Eléctrico que no evolucione", function (p) { return tipo(p, "Eléctrico") && p.a.length === 0; }],
    ["Nombra un Pokémon de tipo Roca o Tierra que sea de la tercera generación o posterior", function (p) {
      return (tipo(p, "Roca") || tipo(p, "Tierra")) && p.g >= 3; }],
    ["Nombra un Pokémon de tipo Planta que sea de la cuarta generación o posterior", function (p) { return tipo(p, "Planta") && p.g >= 4; }],
    ["Nombra un Pokémon de tipo Fuego que no sea de la primera generación", function (p) { return tipo(p, "Fuego") && p.g > 1; }],
    ["Nombra un Pokémon de tipo Normal que evolucione", function (p) { return tipo(p, "Normal") && p.a.length > 0; }],
    ["Nombra un Pokémon de tipo Bicho que sea de la tercera generación o posterior", function (p) { return tipo(p, "Bicho") && p.g >= 3; }],

    ["Nombra un Pokémon de la primera o la segunda generación que no tenga evolución", function (p) { return p.g <= 2 && sinEvo(p); }],
    ["Nombra un Pokémon de la segunda generación que sea de doble tipo", function (p) { return p.g === 2 && p.t.length === 2; }],
    ["Nombra un Pokémon de Hoenn que no sea legendario ni mítico", function (p) { return p.g === 3 && NOLEG(p); }],
    ["Nombra un Pokémon de Sinnoh de un solo tipo", function (p) { return p.g === 4 && p.t.length === 1; }],
    ["Nombra un Pokémon de Teselia (quinta generación) que sea de tipo Agua, Fuego o Planta", function (p) {
      return p.g === 5 && (tipo(p, "Agua") || tipo(p, "Fuego") || tipo(p, "Planta")); }],
    ["Nombra un Pokémon de Alola o de Galar que no sea legendario", function (p) { return (p.g === 7 || p.g === 8) && NOLEG(p); }],
    ["Nombra un Pokémon de Paldea (novena generación) que no sea legendario", function (p) { return p.g === 9 && NOLEG(p); }],

    ["Nombra un Pokémon que evolucione por intercambio", function (p) { return metodo(p, "intercambio"); }],
    ["Nombra un Pokémon que evolucione al usar una piedra", function (p) { return metodo(p, "piedra"); }],
    ["Nombra un Pokémon que evolucione por amistad", function (p) { return metodo(p, "amistad"); }],
    ["Nombra la forma final de una línea evolutiva de tres etapas", function (p) { return p.etapa === 2 && !p.evoluciona; }],
    ["Nombra un Pokémon de segunda etapa que todavía pueda evolucionar", function (p) { return p.etapa === 1 && p.evoluciona; }],
    ["Nombra un Pokémon que sea la primera etapa de una línea de tres", function (p) {
      return p.etapa === 0 && p.a.length > 0 && p.a.some(function (e) { return DEX[e.n - 1].a.length > 0; }); }],
    ["Nombra un Pokémon que no evolucione ni sea legendario", function (p) { return sinEvo(p) && NOLEG(p); }],
    ["Nombra un Pokémon legendario", function (p) { return p.leg === 1; }],
    ["Nombra un Pokémon mítico", function (p) { return p.leg === 2; }],

    ["Nombra un Pokémon que mida más de dos metros y no sea legendario", function (p) { return p.alt > 2 && NOLEG(p); }],
    ["Nombra un Pokémon que mida 30 centímetros o menos", function (p) { return p.alt <= 0.3; }],
    ["Nombra un Pokémon que pese más de 300 kilos", function (p) { return p.peso > 300; }],
    ["Nombra un Pokémon que pese menos de un kilo", function (p) { return p.peso < 1; }],
    ["Nombra un Pokémon con más de 130 de ataque base", function (p) { return p.st[1] > 130; }],
    ["Nombra un Pokémon con más de 120 de velocidad base", function (p) { return p.st[5] > 120; }],
    ["Nombra un Pokémon con más de 130 de defensa base", function (p) { return p.st[2] > 130; }],

    ["Nombra un Pokémon de color rosa", function (p) { return p.color === "Rosa"; }],
    ["Nombra un Pokémon de color amarillo", function (p) { return p.color === "Amarillo"; }],
    ["Nombra un Pokémon de color blanco", function (p) { return p.color === "Blanco"; }],
    ["Nombra un Pokémon de color negro", function (p) { return p.color === "Negro"; }],
    ["Nombra un Pokémon de color morado", function (p) { return p.color === "Morado"; }],
    ["Nombra un Pokémon de color marrón", function (p) { return p.color === "Marrón"; }],
    ["Nombra un Pokémon de color azul que no sea de tipo Agua", function (p) { return p.color === "Azul" && !tipo(p, "Agua"); }],

    ["Nombra un Pokémon cuyo nombre en español empiece con la letra M", function (p) { return inicial(p) === "m"; }],
    ["Nombra un Pokémon cuyo nombre en español empiece con la letra S", function (p) { return inicial(p) === "s"; }],
    ["Nombra un Pokémon cuyo nombre en español empiece con la letra G", function (p) { return inicial(p) === "g"; }],
    ["Nombra un Pokémon cuyo nombre en español empiece con la letra T", function (p) { return inicial(p) === "t"; }],
    ["Nombra un Pokémon cuyo nombre en español termine en la letra O", function (p) { return /o$/.test(CC.norm(p.es)); }],
    ["Nombra un Pokémon cuyo nombre en español tenga exactamente cuatro letras", function (p) { return letras(p) === 4; }],
    ["Nombra un Pokémon cuyo nombre en español tenga exactamente cinco letras", function (p) { return letras(p) === 5; }],
    ["Nombra un Pokémon cuyo nombre en español tenga once letras o más", function (p) { return letras(p) >= 11; }],

    ["Nombra un Pokémon que pueda tener la habilidad Levitación", function (p) { return tiene(p, "Levitación"); }],
    ["Nombra un Pokémon que pueda tener la habilidad Intimidación", function (p) { return tiene(p, "Intimidación"); }],
    ["Nombra un Pokémon que pueda tener la habilidad Presión", function (p) { return tiene(p, "Presión"); }],
    ["Nombra un Pokémon que habite en cavernas", function (p) { return p.habitat === "caverna"; }],
    ["Nombra un Pokémon que habite en el mar o en agua salada", function (p) { return p.habitat === "mar" || p.habitat === "agua salada"; }],
    ["Nombra un Pokémon que habite en montañas", function (p) { return p.habitat === "montaña"; }]
  ]);

  // ---------- Consignas hechas a mano que ahora se completan con la base de datos ----------
  var GEN_DE = function (g) { return function (p) { return p.g === g; }; };
  var TIPO_DE = function (t) { return function (p) { return tipo(p, t); }; };
  var comp = [];
  ["Tierra", "Roca", "Volador", "Veneno", "Agua", "Normal", "Fantasma", "Dragón", "Hielo", "Eléctrico", "Psíquico",
   "Fuego", "Hada", "Lucha", "Siniestro", "Acero", "Bicho", "Planta"].forEach(function (t) {
    comp.push(["Nombra un Pokémon de tipo " + t, TIPO_DE(t)]);
  });
  comp.push(["Nombra un Pokémon de la primera generación (los 151 originales)", GEN_DE(1)]);
  comp.push(["Nombra un Pokémon de la segunda generación", GEN_DE(2)]);
  comp.push(["Nombra un Pokémon de la cuarta generación", GEN_DE(4)]);
  comp.push(["Nombra un Pokémon de la quinta generación", GEN_DE(5)]);
  comp.push(["Nombra un Pokémon de la sexta generación", GEN_DE(6)]);
  comp.push(["Nombra un Pokémon de la séptima generación", GEN_DE(7)]);
  comp.push(["Nombra un Pokémon de la octava generación", GEN_DE(8)]);
  comp.push(["Nombra un Pokémon introducido en la región de Hoenn", GEN_DE(3)]);
  comp.push(["Nombra un Pokémon de tipo Agua de la primera generación", function (p) { return p.g === 1 && tipo(p, "Agua"); }]);
  comp.push(["Nombra un Pokémon de tipo Veneno de la primera generación", function (p) { return p.g === 1 && tipo(p, "Veneno"); }]);
  comp.push(["Nombra un Pokémon de tipo Normal de la primera generación", function (p) { return p.g === 1 && tipo(p, "Normal"); }]);
  comp.push(["Nombra un Pokémon de tipo Bicho que no sea de la primera generación", function (p) { return p.g > 1 && tipo(p, "Bicho"); }]);
  comp.push(["Nombra un Pokémon de tipo Eléctrico que no sea Pikachu", function (p) { return p.n !== 25 && tipo(p, "Eléctrico"); }]);
  comp.push(["Nombra un Pokémon legendario o mítico", function (p) { return p.leg > 0; }]);
  comp.push(["Nombra un Pokémon que evolucione al ser intercambiado", function (p) { return metodo(p, "intercambio"); }]);
  comp.push(["Nombra un Pokémon que evolucione con una piedra evolutiva", function (p) { return metodo(p, "piedra"); }]);
  comp.push(["Nombra un Pokémon que pueda evolucionar por amistad", function (p) { return metodo(p, "amistad"); }]);
  comp.push(["Nombra un Pokémon que no tenga evolución ni preevolución", sinEvo]);
  comp.push(["Nombra un Pokémon cuyo nombre tenga exactamente cinco letras", function (p) { return letras(p) === 5; }]);
  comp.push(["Nombra un Pokémon cuyo nombre empiece con la letra M", function (p) { return inicial(p) === "m"; }]);
  comp.push(["Nombra un Pokémon cuyo nombre tenga más de una palabra, un guion o un apóstrofe", function (p) { return /[ \-'.:]/.test(p.es); }]);
  comp.push(["Nombra una evolución de Eevee", function (p) { return p.de.some(function (e) { return e.n === 133; }); }]);
  comp.push(["Nombra un Pokémon bebé", function (p) { return p.bebe === 1; }]);
  comp.push(["Nombra un Pokémon que tenga forma de Alola", function (p) { return p.formas.indexOf("Alola") >= 0; }]);
  comp.push(["Nombra un Pokémon que tenga una forma regional", function (p) { return p.formas.length > 0; }]);
  comp.push(["Nombra un Ultraente", function (p) { return p.ultraente === 1; }]);
  comp.push(["Nombra un Pokémon fósil (revivido de un fósil)", function (p) { return p.fosil === 1; }]);
  comp.push(["Nombra un Pokémon inicial de cualquier región (su primera etapa)", function (p) { return p.inicial === 1; }]);
  comp.push(["Nombra un Pokémon que haya tenido Ash en el anime", function (p) { return p.ash === 1; }]);
  comp.push(["Nombra un Pokémon que hayan tenido Jessie o James del Team Rocket", function (p) {
    return p.rocket.indexOf("Jessie") >= 0 || p.rocket.indexOf("James") >= 0; }]);
  comp.push(["Nombra un Pokémon inicial de tipo Planta o una de sus evoluciones", function (p) { return p.lineaInicial && tipo(p, "Planta"); }]);
  comp.push(["Nombra un Pokémon inicial de tipo Fuego o una de sus evoluciones", function (p) { return p.lineaInicial && tipo(p, "Fuego"); }]);
  completar("pokemon", comp);

  // ---------- Consignas nuevas con los datos de Serebii (formas, megas, iniciales, anime) ----------
  var MEGA = function (p) { return p.mega === 1; };
  regla("pokemon", null, [
    ["Nombra un Pokémon que tenga forma de Galar", function (p) { return p.formas.indexOf("Galar") >= 0; }],
    ["Nombra un Pokémon que tenga forma de Hisui", function (p) { return p.formas.indexOf("Hisui") >= 0; }],
    ["Nombra un Pokémon de la primera generación que tenga forma regional", function (p) { return p.g === 1 && p.formas.length > 0; }],
    ["Nombra un Pokémon cuya forma regional tenga un tipo que el original no tiene", function (p) {
      return p.formaTipos.some(function (t) { return p.t.indexOf(t) < 0; }); }],
    ["Nombra un Pokémon de la primera generación que pueda megaevolucionar", function (p) { return MEGA(p) && p.g === 1; }],
    ["Nombra un Pokémon que pueda megaevolucionar y no sea de Kanto ni de Hoenn", function (p) { return MEGA(p) && p.g !== 1 && p.g !== 3; }],
    ["Nombra un Pokémon cuya megaevolución sea de tipo Dragón, Acero o Hada", function (p) {
      return ["Dragón", "Acero", "Hada"].some(function (t) { return p.megaTipos.indexOf(t) >= 0; }); }],
    ["Nombra un Pokémon cuya megaevolución sea de tipo Lucha, Siniestro o Fantasma", function (p) {
      return ["Lucha", "Siniestro", "Fantasma"].some(function (t) { return p.megaTipos.indexOf(t) >= 0; }); }],
    ["Nombra un Pokémon inicial (en cualquier etapa) que pueda megaevolucionar", function (p) { return MEGA(p) && p.lineaInicial; }],
    ["Nombra un Pokémon legendario o mítico que pueda megaevolucionar o tener regresión primigenia", function (p) { return MEGA(p) && p.leg > 0; }],
    ["Nombra un Pokémon que pueda megaevolucionar y sea de tipo Agua, Hielo o Eléctrico", function (p) {
      return MEGA(p) && (tipo(p, "Agua") || tipo(p, "Hielo") || tipo(p, "Eléctrico")); }],
    ["Nombra un Pokémon inicial de tipo Agua o una de sus evoluciones", function (p) { return p.lineaInicial && tipo(p, "Agua"); }],
    ["Nombra la evolución final de un Pokémon inicial", function (p) { return p.lineaInicial && p.de.length > 0 && p.a.length === 0; }],
    ["Nombra la etapa intermedia de un Pokémon inicial", function (p) { return p.lineaInicial && p.etapa === 1 && p.a.length > 0; }],
    ["Nombra un Pokémon inicial o una de sus evoluciones que tenga dos tipos", function (p) { return p.lineaInicial && p.t.length === 2; }],
    ["Nombra un Pokémon fósil que no sea de la primera generación", function (p) { return p.fosil && p.g > 1; }],
    ["Nombra un Pokémon que haya tenido Ash y que no sea de Kanto", function (p) { return p.ash && p.g > 1; }],
    ["Nombra un Pokémon que haya tenido Ash y que sea de la primera generación", function (p) { return p.ash && p.g === 1; }],
    ["Nombra un Pokémon que haya tenido Ash y que sea de tipo Agua, Hielo o Volador", function (p) {
      return p.ash && (tipo(p, "Agua") || tipo(p, "Hielo") || tipo(p, "Volador")); }],
    ["Nombra un Pokémon que haya tenido Ash y que sea de tipo Planta, Bicho, Fuego o Lucha", function (p) {
      return p.ash && (tipo(p, "Planta") || tipo(p, "Bicho") || tipo(p, "Fuego") || tipo(p, "Lucha")); }],
    ["Nombra un Pokémon que haya tenido alguien del Team Rocket en el anime (Jessie, James, Giovanni, Butch o Cassidy)", function (p) {
      return p.rocket.length > 0; }],
    ["Nombra un Pokémon que hayan tenido Giovanni, Butch o Cassidy en el anime", function (p) {
      return ["Giovanni", "Butch", "Cassidy"].some(function (x) { return p.rocket.indexOf(x) >= 0; }); }]
  ]);
})(typeof window !== "undefined" ? window : globalThis);
