// Consignas nuevas que se añaden cada día. NO borrar lo que ya está aquí.
// Cada bloque lleva la fecha de estreno en "since" (AAAA-MM-DD): ese día entran al modo Diario
// y desde ese día se pueden jugar en los demás modos. Añade los bloques nuevos al FINAL del archivo.
//
// Ejemplo de bloque:
// CC.add("clasica", { since: "2026-11-16" }, [
//   ["Nombra algo que ...",
//     "nivel 0;otra respuesta/alias",
//     "nivel 1", "nivel 2", "nivel 3", "nivel 4", "nivel 5"]
// ]);

CC.add("clasica", { since: "2026-11-17" }, [
  ["Nombra un fruto seco",
    "Almendra;Nuez/Nuez de Castilla;Cacahuate/Maní/Cacahuete;Avellana",
    "Pistache/Pistacho;Castaña;Pacana/Nuez pecana;Anacardo/Marañón",
    "Macadamia;Piñón;Nuez de Brasil",
    "Bellota;Hayuco;Pili",
    "Baru;Shea/Nuez de karité",
    ""],

  ["Nombra un animal que se pueda tener como mascota en casa",
    "Perro;Gato;Pez/Pez dorado;Hámster/Hamster;Conejo",
    "Tortuga;Canario;Periquito/Perico;Cobaya/Cuy/Conejillo de indias;Loro/Papagayo",
    "Iguana;Erizo/Erizo pigmeo;Hurón;Chinchilla;Gecko",
    "Jerbo/Gerbo;Ajolote/Axolote;Tarántula;Ardilla;Cotorra",
    "Rata/Ratón",
    ""],

  ["Nombra un juego infantil de patio",
    "Escondidas;Las traes/Pilla pilla;Stop;Avioncito/Rayuela;Gallinita ciega;Congelados",
    "Quemados;Tres en raya;Luz roja, luz verde;Saltar la cuerda;Canicas;Trompo",
    "Doña Blanca;El lobo/Lobo está;Las estatuas",
    "Matatena;Pídola",
    "",
    ""],

  ["Nombra algo que tenga teclas",
    "Teclado;Piano;Calculadora;Teléfono/Celular",
    "Computadora/Ordenador/Compu;Máquina de escribir;Cajero automático/Cajero",
    "Órgano;Clavecín/Cémbalo;Clavicordio;Caja registradora",
    "Celesta;Melódica;Melotrón",
    "Pianola;Armonio",
    "Ondas Martenot/Ondes Martenot"],

  ["Nombra algo que tenga cuerda y no sea un instrumento musical",
    "Raqueta;Yoyó/Yo-yó;Cometa/Papalote;Tendedero;Marioneta/Títere",
    "Arco;Hamaca;Mochila/Mochila de cordón;Persiana;Lazo",
    "Ballesta;Reloj de cuerda;Juguete de cuerda",
    "Paracaídas;Atarraya/Chinchorro;Parapente",
    "Hilo dental/Seda dental",
    "Hilo de pescar/Sedal"],

  ["Nombra un músculo del cuerpo humano",
    "Bíceps;Tríceps;Abdominales/Recto abdominal;Pectoral/Pectorales;Glúteo/Glúteos",
    "Deltoides;Cuádriceps;Gemelo/Gemelos;Trapecio;Dorsal/Dorsal ancho",
    "Isquiotibiales/Isquiotibial;Masetero;Diafragma;Sóleo;Temporal",
    "Sartorio;Esternocleidomastoideo;Platisma;Serrato anterior/Serrato;Psoas/Iliopsoas",
    "Orbicular de los ojos/Orbicular;Pronador redondo;Cremáster/Cremaster;Escalenos/Escaleno",
    "Palmar largo/Palmar;Tibial anterior/Tibial"],

  ["Nombra una batalla histórica",
    "Waterloo;Hastings/Batalla de Hastings;Trafalgar;Gettysburg;Maratón/Batalla de Maratón",
    "Stalingrado/Stalingrad;Termópilas/Las Termópilas;Lepanto;Austerlitz;Puebla/Batalla de Puebla",
    "Verdún/Verdun;Somme/Batalla del Somme;Midway;Salamina;Cannas;Alesia",
    "Gaugamela;Actium;Borodinó/Borodino;Ayacucho;Boyacá;Carabobo",
    "Chapultepec;Yorktown;Pichincha;Little Bighorn;Bunker Hill",
    "Kadesh/Qadesh"],

  ["Nombra un tipo de nube",
    "Cúmulo/Cúmulos;Cirro/Cirros;Estrato/Estratos;Nimbo;Cumulonimbo/Cumulonimbos",
    "Altocúmulo/Altocúmulos;Altoestrato/Altostrato;Cirrocúmulo/Cirrocúmulos;Cirroestrato/Cirrostrato;Estratocúmulo",
    "Nimboestrato;Mammatus/Mamatus;Lenticular;Noctilucente/Nube noctilucente",
    "Nube nacarada/Nacarada",
    "",
    ""],

  ["Nombra una película dirigida por Pedro Almodóvar",
    "Todo sobre mi madre;Volver;Hable con ella/Habla con ella;Julieta;Dolor y gloria",
    "Mujeres al borde de un ataque de nervios;Átame;La mala educación;Los abrazos rotos;La ley del deseo",
    "Matador;Kika;Tacones lejanos;Carne trémula;Qué he hecho yo para merecer esto",
    "Pepi, Luci, Bom y otras chicas del montón/Pepi Luci Bom;Entre tinieblas;Laberinto de pasiones;La flor de mi secreto",
    "",
    ""],

  ["Nombra una golosina",
    "Chocolate;Caramelo/Caramelos;Chicle/Chicles;Paleta/Piruleta;Gomita/Gomitas",
    "Malvavisco/Malvaviscos;Regaliz;Bombón/Bombones;Mazapán;Turrón",
    "Algodón de azúcar/Algodón de dulce;Alfajor;Cocada;Jamoncillo",
    "Palanqueta;Obleas;Camote",
    "Tamarindo/Dulce de tamarindo;Membrillo/Dulce de membrillo",
    "Mantecado"]
]);

CC.add("pokemon", { since: "2026-11-17" }, [
  ["Nombra un Pokémon de tipo Tierra",
    "Diglett;Sandshrew;Cubone;Onix;Geodude",
    "Dugtrio;Sandslash;Marowak;Golem;Rhyhorn",
    "Nidoking;Nidoqueen;Gligar;Trapinch;Wooper",
    "Swampert;Quagsire;Hippopotas/Hipopotas;Vibrava;Sandile",
    "Flygon;Garchomp;Krookodile;Drilbur;Excadrill",
    "Gliscor;Landorus;Stunfisk;Camerupt;Rhydon"],

  ["Nombra un Pokémon de tipo Roca",
    "Geodude;Onix;Golem;Aerodactyl;Tyranitar",
    "Graveler;Rhyhorn;Omanyte;Kabuto;Sudowoodo",
    "Lunatone;Solrock;Corsola;Relicanth;Shieldon",
    "Lileep;Anorith;Cranidos;Nosepass;Carbink",
    "Rampardos;Bastiodon;Tyrunt;Amaura;Regirock",
    "Probopass;Terrakion;Omastar;Kabutops;Rhydon"],

  ["Nombra un Pokémon de tipo Volador",
    "Pidgey;Zubat;Charizard;Dragonite;Gyarados",
    "Spearow;Butterfree;Articuno;Zapdos;Moltres",
    "Hoothoot;Noctowl;Pelipper;Swellow;Togekiss",
    "Dodrio;Staraptor;Braviary;Talonflame;Farfetch'd",
    "Lugia;Ho-Oh;Rayquaza;Golbat;Fearow",
    "Crobat;Doduo;Ledyba;Pidgeot"],

  ["Nombra un Pokémon cuyo nombre tenga exactamente cinco letras",
    "Eevee;Ekans;Golem;Ditto;Pichu",
    "Arbok;Lugia;Gloom;Snivy",
    "Gible;Zorua;Tepig;Bagon;Magby",
    "Ralts;Lotad",
    "",
    ""],

  ["Nombra un Pokémon cuyo nombre empiece con la letra M",
    "Mew;Mewtwo;Magikarp;Meowth",
    "Machamp;Magnemite;Mankey;Marowak;Mudkip",
    "Magmar;Metapod;Mareep;Murkrow;Medicham",
    "Milotic;Mismagius;Munchlax;Monferno;Marill",
    "Makuhita;Meditite;Mightyena;Magneton;Misdreavus",
    "Mamoswine;Mr. Mime"],

  ["Nombra un Pokémon cuyo nombre tenga más de una palabra, un guion o un apóstrofe",
    "Mr. Mime;Ho-Oh;Porygon-Z;Tapu Koko;Farfetch'd",
    "Mr. Rime;Mime Jr.;Tapu Lele;Tapu Bulu;Tapu Fini",
    "Tipo: Nulo/Type: Null;Kommo-o;Jangmo-o;Hakamo-o;Sirfetch'd",
    "",
    "",
    ""],

  ["Nombra un Pokémon de la séptima generación",
    "Rowlet;Litten;Popplio;Rockruff;Mimikyu",
    "Incineroar;Primarina;Decidueye;Lycanroc;Oricorio",
    "Toxapex;Golisopod;Salazzle;Bewear;Tsareena",
    "Komala;Silvally;Turtonator;Pyukumuku;Drampa",
    "Wimpod;Comfey;Stufful;Palossand;Dhelmise",
    ""],

  ["Nombra un Pokémon introducido en la región de Hoenn",
    "Treecko;Torchic;Mudkip;Zigzagoon;Wingull",
    "Breloom;Gardevoir;Aron;Sableye;Mawile",
    "Ninjask;Shedinja;Exploud;Makuhita;Skitty",
    "Shroomish;Surskit;Masquerain;Taillow;Cascoon",
    "Whismur;Lairon;Hariyama;Nincada;Shiftry",
    "Kirlia;Wurmple;Lombre;Ludicolo"],

  ["Nombra un Pokémon de la quinta generación",
    "Victini;Patrat;Purrloin;Lillipup;Pansage",
    "Zorua;Haxorus;Hydreigon;Reshiram;Zekrom",
    "Durant;Swoobat;Gigalith;Foongus;Joltik",
    "Vanilluxe;Whimsicott;Cobalion;Genesect;Escavalier",
    "Chandelure;Druddigon;Beartic;Galvantula;Eelektrik",
    "Cofagrigus;Krookodile"],

  ["Nombra un Pokémon de la segunda generación",
    "Chikorita;Cyndaquil;Totodile;Pichu;Togepi",
    "Ledyba;Mareep;Marill;Sentret;Hoppip",
    "Qwilfish;Scizor;Shuckle;Heracross;Sneasel",
    "Teddiursa;Slugma;Corsola;Remoraid;Delibird",
    "Espeon;Umbreon;Porygon2;Smeargle;Tyrogue",
    "Larvitar;Celebi;Raikou;Suicune;Entei"]
]);
