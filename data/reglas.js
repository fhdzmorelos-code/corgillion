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
  function metodo(p, m) {
    var re = { nivel: /^Level/i, piedra: /Stone|Cuff|Wreath/, intercambio: /trade/i, amistad: /Friendship/ }[m];
    return p.de.some(function (e) { return re.test(e.cond); });
  }
  function sinEvo(p) { return !p.evoluciona && p.de.length === 0; }
  function tiene(p, hab) { return p.hab.indexOf(hab) >= 0 || p.oculta.indexOf(hab) >= 0; }
  var H = { tipo: tipo, inicial: inicial, letras: letras, bst: bst, metodo: metodo, sinEvo: sinEvo, tiene: tiene };

  // ---------- Motor ----------
  var MIN = 12, MAX = 160;

  function respuestas(f) {
    var lista = DEX.filter(f).map(function (p) { return { p: p, o: oscuridad(p) }; });
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
      var r = respuestas(fila[1]);
      if (r.n < MIN || r.n > MAX) {
        if (root.console) { console.warn("Regla fuera de rango (" + r.n + " respuestas): " + fila[0]); }
        return;
      }
      rows.push([fila[0]].concat(r.niveles.map(function (l) { return l.join(";"); })));
    });
    if (rows.length) { CC.add(cat, meta, rows); }
  }

  CC.regla = regla;
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
})(typeof window !== "undefined" ? window : globalThis);
