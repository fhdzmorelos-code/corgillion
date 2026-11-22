// Pixel art del juego: el corgi (24x24, 5 variantes) y los hallazgos de cada nivel.
(function (root) {
  "use strict";

  // Mitad izquierda del corgi; la derecha es su espejo.
  // . vacío · O contorno · F pelaje · D pelaje en sombra · L pelaje claro · C marca
  // W blanco · S blanco en sombra · P oreja interior · E ojo · H brillo del ojo
  // N nariz · T lengua · B rubor
  var HALF = [
    "...OO.......",
    "..OFFO......",
    "..OFPFO.....",
    ".OFPPFFO....",
    ".OFPPFFFOOOO",
    ".OFFPFFFFFFL",
    ".OFFFFFFFFLW",
    ".OFFCCFFFFLW",
    ".OFFFEEHFFWW",
    ".OFFFEEEFWWW",
    ".ODFBBFFWWWW",
    "..ODFFWWWWNN",
    "..OODWWWWWWN",
    "...OWWWWWOWO",
    "....OOWWWWTT",
    "...OFFOOWWTT",
    "..OFFFFSWWWW",
    "..OFFFFSWWWW",
    "..OFDFFWWWWW",
    "..OFDFFWWWWW",
    "..OFDFOWWWOW",
    "..OFFFOWWWOW",
    "..OWWWOWWWOO",
    "...OOO.OOO.."
  ];
  var BASE = HALF.map(function (h) { return h + h.split("").reverse().join(""); });

  var COMMON = {
    O: "#1c1410", P: "#f2a7a0", E: "#1c1410", H: "#ffffff", N: "#1c1410",
    T: "#e8607a", B: "#f4a58f", S: "#e9dcc4"
  };

  // Accesorios: [fila, columna inicial, píxeles]; "." deja ver lo de abajo.
  var VARIANTS = [
    {
      name: "Donna", desc: "Roja y blanca con pañuelo",
      pal: { F: "#e08a3c", D: "#c26f27", L: "#f0a65c", C: "#c26f27", W: "#fff6e6", a: "#d8343a", b: "#9c1f2b" },
      acc: [[15, 6, "aaaaaaaaaaaa"], [16, 9, "abaaba"], [17, 10, "abba"], [18, 11, "aa"]]
    },
    {
      name: "Jaquavius", desc: "Tricolor con casco de minero",
      pal: { F: "#35343f", D: "#24232c", L: "#4a4957", C: "#d98a45", B: "#d98a45", W: "#fff6e6", y: "#f6c12d", l: "#fffbe0", d: "#b98510" },
      acc: [[1, 9, "yyyyyy"], [2, 8, "yyyllyyy"], [3, 8, "yyyllyyy"], [4, 6, "dddddddddddd"]]
    },
    {
      name: "Brady", desc: "Sable con casco plateado estilo Patriots",
      pal: { F: "#b8763a", D: "#8a5527", L: "#cf8f52", C: "#5b3a22", W: "#f7ead2", h: "#c4cbd2", d: "#8f979f", n: "#0c2340", r: "#c60c30", w: "#ffffff", m: "#0c2340", x: "#1c1410" },
      acc: [
        [1, 8, "xxxxxxxx"], [2, 6, "xhhhhwhhhhhx"], [3, 4, "xhhhhhwhhhhhhhhx"], [4, 3, "xhnnrhhhhhhhhrnnhx"],
        [5, 2, "xhhwnnhhhhhhhhnnwhhx"], [6, 2, "xhxhhhhhhhhhhhhhhxhx"], [7, 2, "xddddddddddddddddddx"],
        [8, 3, "m"], [8, 20, "m"], [9, 3, "m"], [9, 20, "m"], [10, 3, "m"], [10, 20, "m"], [11, 3, "m"], [11, 20, "m"],
        [12, 3, "mmmmmmm"], [12, 14, "mmmmmmm"]
      ]
    },
    {
      name: "Niebla", desc: "Azul merle con gafas de piloto",
      pal: { F: "#8d9bb0", D: "#66728a", L: "#a9b5c7", C: "#4b566b", W: "#f4f7fb", S: "#dfe5ee", g: "#3a2a20", c: "#7fe3ff" },
      acc: [
        [7, 4, "ggggg"], [7, 15, "ggggg"], [8, 2, "gggcEcgggggggggcEcggg"],
        [9, 4, "gcEcg"], [9, 15, "gcEcg"], [10, 4, "ggggg"], [10, 15, "ggggg"]
      ]
    },
    {
      name: "Nube", desc: "Crema esponjoso con corona",
      pal: { F: "#f3d9a4", D: "#dcbd80", L: "#fbeccb", C: "#fbeccb", W: "#fffaf0", o: "#f6c12d", r: "#d8343a", z: "#3f8fd6" },
      acc: [[0, 9, "o.oo.o"], [1, 9, "oooooo"], [2, 9, "orozoo"], [3, 9, "oooooo"]]
    }
  ];

  // Hallazgos por nivel de rareza (0 = tierrita … 5 = hueso de oro).
  var ITEMS = [
    {
      pal: { O: "#1c1410", B: "#9a6237", D: "#7c4a27", L: "#b98152" },
      rows: ["....OOOO....", "..OOBLBBOO..", ".OBLBDBBBBO.", "OBBBBBBDBLBO", "OBDBBLBBBBBO", "OBBBBDBBBDBO", ".OBBBBBBBBO.", "..OOOOOOOO.."]
    },
    {
      pal: { O: "#1c1410", G: "#9aa3ad", D: "#6f7882", L: "#c9d1d8" },
      rows: ["....OOOO....", "..OOGLLGOO..", ".OGLLGGGGGO.", "OGLGGGGGDGGO", "OGGGGGGGGDGO", "OGGDGGGGDDGO", ".OGDDGGDDGO.", "..OOOOOOOO.."]
    },
    {
      pal: { O: "#1c1410", W: "#fff6e6", S: "#d9cbb0" },
      rows: [".OO......OO.", "OWWO....OWWO", "OWWWOOOOWWWO", ".OWWWWWWWWO.", ".OWSSSSSSWO.", "OWWSOOOOSWWO", "OWSO....OSWO", ".OO......OO."]
    },
    {
      pal: { O: "#1c1410", S: "#59c2a4", K: "#1f6f5b", L: "#a5ecd6" },
      rows: ["...OOOOOO...", "..OSLLSSSO..", ".OSLKKKKSSO.", "OSLKSSSSKSSO", "OSKSSKKSSKSO", "OSKSKSSKSKSO", "OSKSSKSKSKSO", "OSSKSSSKSSO.", ".OSSKKKSSO..", "..OOOOOOO..."]
    },
    {
      pal: { O: "#1c1410", H: "#9c5a2a", D: "#6e3b17", Y: "#f6c12d", L: "#fff1a8", J: "#c58bea" },
      rows: [".OOOOOOOOOO.", "OHHHHYYHHHHO", "OHDDHYYHDDHO", "OOOOOYYOOOOO", "OYLJYLYJYLYO", "OOOOOOOOOOOO", "OHHHHYYHHHHO", "OHDDHYYHDDHO", "OHHHHHHHHHHO", "OOOOOOOOOOOO"]
    },
    {
      pal: { O: "#1c1410", W: "#ffcf3f", S: "#d99a12", L: "#fff7c2" },
      rows: [".OO......OO.", "OLWO....OLWO", "OLWWOOOOWWWO", ".OLLLWWWWWO.", ".OWSSSSSSWO.", "OWWSOOOOSWWO", "OWSO....OSWO", ".OO......OO."]
    }
  ];

  // Íconos de categoría (12x12).
  var ICONS = {
    pokeball: {
      pal: { O: "#1c1410", R: "#e3363b", L: "#ff9a9a", W: "#ffffff", S: "#cfd6de" },
      rows: ["....OOOO....", "..OORRRROO..", ".ORRLLRRRRO.", ".ORLRRRRRRO.", "ORRROOOORRRO", "OOOOWWWWOOOO",
        "OWWWOOOOWWWO", "OSWWWWWWWWSO", ".OSWWWWWWSO.", ".OSSWWWWSSO.", "..OOSSSSOO..", "....OOOO...."]
    },
    trofeo: {
      pal: { O: "#1c1410", Y: "#f6c12d", L: "#fff1a8", D: "#b98510", B: "#7a4a28" },
      rows: ["..OOOOOOOO..", "OOOYLYYYYOOO", "OYOYLYYYYOYO", "OYOYLYYYDOYO", ".OOYYYYYDOO.", "..OYYYYYDO..",
        "...OYYYDO...", "....OYDO....", "....OYDO....", "...OOOOOO...", "..OBBBBBBO..", "..OOOOOOOO.."]
    },
    planeta: {
      pal: { O: "#1c1410", B: "#3f8fd6", L: "#8fd3ff", G: "#5bb04a", D: "#3f8a35" },
      rows: ["....OOOO....", "..OOLBGGOO..", ".OLBGGGBBBO.", ".OBGGDBBBGO.", "OBBGGBBBGGBO", "OBBBDBBBGDBO",
        "OBGGBBBBBBBO", "OBGDGBBGGBBO", ".OBGGBBGDBO.", ".OBBBBBBBBO.", "..OOBBBBOO..", "....OOOO...."]
    },
    balon: {
      pal: { O: "#1c1410", W: "#ffffff", K: "#1c1410", S: "#d5dbe2" },
      rows: ["....OOOO....", "..OOWWWWOO..", ".OWWWKKWWWO.", ".OWWKKKKWWO.", "OKWWWKKWWWKO", "OKKWWWWWWKKO",
        "OWWKWWWWKWWO", "OWKKKWWKKKSO", ".OWKWWWWKSO.", ".OWWWKKWSSO.", "..OOSKKSOO..", "....OOOO...."]
    }
  };

  function rects(g, pal) {
    var out = "";
    for (var y = 0; y < g.length; y++) {
      var x = 0, row = g[y];
      while (x < row.length) {
        var ch = row[x];
        if (ch === "." || !pal[ch]) { x++; continue; }
        var w = 1;
        while (x + w < row.length && row[x + w] === ch) w++;
        out += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="1" fill="' + pal[ch] + '"/>';
        x += w;
      }
    }
    return out;
  }

  function svg(v, size, cls) {
    v = ((v % VARIANTS.length) + VARIANTS.length) % VARIANTS.length;
    var g = BASE.map(function (r) { return r.split(""); });
    VARIANTS[v].acc.forEach(function (a) {
      for (var i = 0; i < a[2].length; i++) if (a[2][i] !== ".") g[a[0]][a[1] + i] = a[2][i];
    });
    return '<svg class="corgi ' + (cls || "") + '" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" shape-rendering="crispEdges" role="img" aria-label="Corgi ' +
      VARIANTS[v].name + '">' + rects(g, Object.assign({}, COMMON, VARIANTS[v].pal)) + "</svg>";
  }

  function item(tier, size, cls) {
    var it = ITEMS[tier], w = 12, h = it.rows.length;
    return '<svg class="item ' + (cls || "") + '" width="' + size + '" height="' + Math.round(size * h / w) +
      '" viewBox="0 0 ' + w + " " + h + '" shape-rendering="crispEdges" aria-hidden="true">' +
      rects(it.rows.map(function (r) { return r.split(""); }), it.pal) + "</svg>";
  }

  function icon(name, size) {
    var it = ICONS[name];
    if (!it) return "";
    return '<svg class="icon" width="' + size + '" height="' + size + '" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">' +
      rects(it.rows.map(function (r) { return r.split(""); }), it.pal) + "</svg>";
  }

  root.Corgi = { svg: svg, item: item, icon: icon, variants: VARIANTS };
})(typeof window !== "undefined" ? window : globalThis);
