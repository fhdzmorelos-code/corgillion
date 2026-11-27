(function () {
  "use strict";

  var GAME_NAME = "CORGILLION";
  var CC = window.CC, Corgi = window.Corgi;
  var app = document.getElementById("app");

  var TIERS = [
    { n: "Tierrita", en: "Dirt", p: 10, s: 2, say: "Solo tierrita…", sayEn: "Just dirt…" },
    { n: "Piedrita", en: "Pebble", p: 20, s: 3, say: "Una piedrita.", sayEn: "A pebble." },
    { n: "Hueso", en: "Bone", p: 35, s: 5, say: "¡Un hueso!", sayEn: "A bone!" },
    { n: "Fósil", en: "Fossil", p: 60, s: 8, say: "¡Un fósil!", sayEn: "A fossil!" },
    { n: "Tesoro", en: "Treasure", p: 80, s: 11, say: "¡Un tesoro!", sayEn: "A treasure!" },
    { n: "Hueso de Oro", en: "Golden Bone", p: 100, s: 15, say: "¡¡HUESO DE ORO!!", sayEn: "GOLDEN BONE!!" }
  ];
  // Ícono pixelado de cada categoría (ver Corgi.icon).
  var CAT_ICON = { clasica: "trofeo", pokemon: "pokeball", deportes: "balon", geografia: "planeta" };
  function catIcon(id, size) { return CAT_ICON[id] ? Corgi.icon(CAT_ICON[id], size) : ""; }
  var QTIME = 25, RUN = 7, CLOCK = 45, FULL = 7000, SKIP_PEN = 5;
  var PX = 4, GROUND = 300, PXM = 0.26, DOG = 72;

  var MODES = {
    diario: { n: "Diario", en: "Daily", d: "7 consignas, las mismas para todos hoy. Un solo intento.",
      de: "7 prompts, the same for everyone today. One try.", finite: true },
    clasico: { n: "Libre", en: "Free play", d: "7 consignas al azar que cambian en cada intento.",
      de: "7 random prompts that change every time.", finite: true },
    sinfinal: { n: "Sin final", en: "Endless", d: "Consignas sin parar. Cava hasta que te retires.",
      de: "Prompts nonstop. Dig until you retire.", finite: false },
    contra: { n: "Contrarreloj", en: "Time attack", d: "0:45 en el reloj. Lo raro suma hasta +15 s; pasar resta 5 s.",
      de: "0:45 on the clock. Rare answers add up to +15 s; skipping costs 5 s.", finite: false }
  };

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- guardado ----------
  var KEY = "corgicava.v2";
  var save = { corgi: 0, best: {}, daily: {} };
  try { Object.assign(save, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* sin guardado */ }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* sin guardado */ } }
  SFX.setOn(save.sound !== false);

  // ---------- idioma (Ajustes) ----------
  // Las consignas y la interfaz se traducen; las respuestas siguen siendo las del banco en español,
  // pero se muestran en inglés cuando el diccionario de data/ingles.js tiene la palabra.
  var LANG = save.lang === "en" ? "en" : "es";
  function L(es, en) { return LANG === "en" ? en : es; }
  function tn(i) { return L(TIERS[i].n, TIERS[i].en); }
  function mn(m) { return L(MODES[m].n, MODES[m].en); }
  var CAT_EN = {
    clasica: ["Classic", "A bit of everything: everyday things, science, movies, games, sports and geography."],
    pokemon: ["Pokémon", "Only Pokémon: types, regions, generations, characters and items."],
    deportes: ["Sports", "Soccer, American football, basketball and a bit of everything else."],
    geografia: ["Geography", "Countries, capitals, borders, languages, cities, rivers, mountains and more."]
  };
  function cn(id) { return LANG === "en" && CAT_EN[id] ? CAT_EN[id][0] : CC.cats[id].name; }
  function cd(id) { return LANG === "en" && CAT_EN[id] ? CAT_EN[id][1] : CC.cats[id].desc; }
  function qt(q) { return LANG === "en" ? CC.qEN(q) : q; }
  function an(name, keys, q) { return LANG === "en" && name && !/nombre/.test(q || "") ? CC.nameEN(name, keys) : name; }
  // engrane pixelado para el botón de Ajustes
  function engrane(size) {
    var rows = ["...##...", ".#.##.#.", "..####..", "###..###", "###..###", "..####..", ".#.##.#.", "...##..."], r = "";
    rows.forEach(function (fila, y) { for (var x = 0; x < 8; x++) if (fila[x] === "#") r += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>'; });
    return '<svg class="icon gear-ic" viewBox="0 0 8 8" width="' + size + '" height="' + size + '" shape-rendering="crispEdges" aria-hidden="true">' + r + "</svg>";
  }
  var CORGI_EN = ["Red and white with a bandana", "Tricolor with a miner's helmet", "Sable with a silver Patriots-style helmet",
    "Blue merle with pilot goggles", "Fluffy cream with a crown"];
  function vd(i) { return LANG === "en" && CORGI_EN[i] ? CORGI_EN[i] : Corgi.variants[i].desc; }
  // "Se acabó el tiempo" y "Pasaste" se guardan así en los resultados; aquí solo se traducen al mostrarse
  function porque(w) { return LANG === "en" ? ({ "Se acabó el tiempo": "Time's up", "Pasaste": "Skipped" })[w] || w : w; }
  document.documentElement.lang = LANG;

  // ---------- utilidades ----------
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  function seeded(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    var a = h >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rnd) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor((rnd || Math.random)() * (i + 1)), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  // Consignas disponibles hoy: las nuevas no aparecen antes de su fecha de estreno.
  function pool(catId) {
    var t = today();
    return CC.cats[catId].prompts.filter(function (p) { return !p.since || p.since <= t; });
  }
  // Mazo del diario de la fecha t: primero las consignas que se estrenan ese día, luego las anteriores.
  // Con una fecha sin estrenos el resultado es el mismo mazo de siempre, así que el avance guardado no se rompe.
  function dailyDeck(catId, t) {
    var all = CC.cats[catId].prompts, rnd = seeded(t + "|" + catId);
    var fresh = all.filter(function (p) { return p.since === t; });
    var older = all.filter(function (p) { return !p.since || p.since < t; });
    var deck = shuffle(fresh, rnd).slice(0, RUN);
    return deck.length < RUN ? deck.concat(shuffle(older, rnd).slice(0, RUN - deck.length)) : deck;
  }
  function fmtClock(s) {
    s = Math.max(0, Math.ceil(s));
    return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
  }
  function meters(pts) { return Math.round(pts * 10).toLocaleString(LANG === "en" ? "en-US" : "es-MX") + " m"; }
  function bestOf(cat, mode) { return (save.best[cat] || {})[mode] || 0; }
  function chip(t) {
    return t < 0 ? '<span class="chip t-x">' + L("Nada", "Nothing") + "</span>"
      : '<span class="chip t-' + t + '">' + Corgi.item(t, 18) + tn(t) + "</span>";
  }
  function show(html) {
    document.body.classList.remove("jugando");
    app.innerHTML = html;
    app.classList.remove("enter"); void app.offsetWidth; app.classList.add("enter");
    window.scrollTo(0, 0);
  }

  // ---------- inicio ----------
  var G = null, timer = null;

  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  function home() {
    stopTimer(); G = null; vista = home;
    var v = Corgi.variants[save.corgi], t = today();
    var picks = Corgi.variants.map(function (x, i) {
      return '<button class="pick' + (i === save.corgi ? " on" : "") + '" data-corgi="' + i +
        '" title="' + esc(vd(i)) + '">' + Corgi.svg(i, 48) + "<span>" + esc(x.name) + "</span></button>";
    }).join("");
    var cats = CC.order.map(function (id) {
      var c = CC.cats[id], d = save.daily[id];
      var modes = Object.keys(MODES).map(function (m) {
        var extra;
        if (m === "diario") {
          if (d && d.date === t && d.done) extra = L("Hoy: ", "Today: ") + meters(d.score);
          else if (d && d.date === t) extra = L("En curso", "In progress");
          else if (Online.enabled && !save.player) extra = L("Pide entrar", "Sign in first");
          else extra = L("Nuevo hoy", "New today");
        } else {
          extra = bestOf(id, m) ? L("Récord ", "Best ") + meters(bestOf(id, m)) : L("Sin récord", "No record");
        }
        return '<button class="mode" data-cat="' + id + '" data-mode="' + m + '">' +
          '<span class="mode-n">' + mn(m) + '</span><span class="mode-d">' + L(MODES[m].d, MODES[m].de) +
          '</span><span class="mode-x">' + extra + "</span></button>";
      }).join("");
      return '<section class="panel catbox" style="--c:' + c.color + '"><div class="cat-head"><h2>' + catIcon(id, 28) + "<span>" + esc(cn(id)) + "</span>" +
        "</h2><p>" + esc(cd(id)) + '</p></div><div class="modegrid">' + modes + "</div></section>";
    }).join("");
    var legend = TIERS.map(function (x, i) {
      return "<tr><td>" + chip(i) + "</td><td>" + x.p + " pts</td><td>" + x.p * 10 + " m</td><td>+" + x.s + " s</td></tr>";
    }).join("");

    show(
      '<header class="logo"><h1>' + Corgi.item(2, 44, "logo-deco") + "<span>" + GAME_NAME + "</span>" + Corgi.item(5, 44, "logo-deco flip") + "</h1><p>" +
      L("Cuanto más rara tu respuesta, más hondo cava tu corgi.", "The rarer your answer, the deeper your corgi digs.") + "</p></header>" +
      '<main class="home"><div class="col side">' +
      '<section class="panel kennel"><h2>' + L("Tu corgi", "Your corgi") + "</h2>" +
      '<div class="bubble">' + L("¡Guau! Soy ", "Woof! I'm ") + esc(v.name) + L(". ¿Cavamos?", ". Shall we dig?") + "</div>" +
      '<div class="stage">' + Corgi.svg(save.corgi, 192, "idle") + '<div class="mound"></div></div>' +
      '<p class="vdesc">' + esc(vd(save.corgi)) + '</p><div class="picks">' + picks + "</div></section>" + whoPanel() +
      '<section class="panel how"><h2>' + L("Cómo se juega", "How to play") + "</h2><p>" +
      L("Cada consigna pide nombrar algo y tiene muchas respuestas válidas. Las obvias valen poco; las que casi nadie diría, mucho. " +
        "Si escribes con erratas, el corgi toma la respuesta más parecida de su lista. También entiende respuestas en inglés.",
        "Each prompt asks you to name something, and it has lots of valid answers. Obvious ones are worth little; the ones almost nobody " +
        "would say are worth a lot. If you make a typo, the corgi takes the closest answer on its list. The answer bank is in Spanish, " +
        "but common words and most names also work in English.") + "</p>" +
      "<table><tr><th>" + L("Hallazgo", "Find") + "</th><th>" + L("Puntos", "Points") + "</th><th>" + L("Cava", "Digs") + "</th><th>" +
      L("Reloj", "Clock") + "</th></tr>" + legend + "</table></section>" +
      recordsPanel() +
      '</div><div class="col">' + cats + "</div></main>"
    );
    stickSide();
    flush();
  }

  // Tus récords: lo más hondo que has cavado en cada categoría y modo.
  function recordsPanel() {
    var t = today();
    var head = "<tr><th></th>" + Object.keys(MODES).map(function (m) { return "<th>" + mn(m) + "</th>"; }).join("") + "</tr>";
    var rows = CC.order.map(function (id) {
      var d = save.daily[id];
      return '<tr><td class="rec-cat" title="' + esc(cn(id)) + '">' + catIcon(id, 22) + "</td>" + Object.keys(MODES).map(function (m) {
        var v = m === "diario" ? (d && d.date === t && d.done ? d.score : 0) : bestOf(id, m);
        return "<td>" + (v ? meters(v) : "—") + "</td>";
      }).join("") + "</tr>";
    }).join("");
    return '<section class="panel recs"><h2>' + L("Tus récords", "Your records") + "</h2><table>" + head + rows + "</table>" +
      '<p class="recs-note">' + L("El diario muestra lo de hoy; los demás, tu mejor marca.", "The daily shows today's score; the rest show your best.") +
      "</p></section>";
  }

  // La columna del corgi acompaña al bajar: se queda fija y, si es más alta que la ventana, se fija por su parte de abajo.
  function stickSide() {
    var el = document.querySelector(".home .side");
    if (el) el.style.top = Math.min(16, window.innerHeight - el.offsetHeight - 16) + "px";
  }

  // ---------- subsuelo dibujado (pantalla completa) ----------
  var LAYERS = [
    { from: 0, c: ["#a9713f", "#b88049", "#986234"] },
    { from: 1000, c: ["#87572f", "#95633a", "#784b27"] },
    { from: 2500, c: ["#6b6f7a", "#7a7e89", "#5b5f69"] },
    { from: 4000, c: ["#4a3f66", "#574a77", "#3d3356"] },
    { from: 5500, c: ["#7a2a22", "#8e352b", "#64201a"] },
    { from: 7000, c: ["#2a2433", "#352e40", "#201b28"] },
    { from: 10000, c: ["#1f4a4a", "#285858", "#173a3a"] },
    { from: 14000, c: ["#b5541c", "#cf6a26", "#8f3f12"] }
  ];
  var rgbMemo = {};
  function rgb(h) {
    return rgbMemo[h] || (rgbMemo[h] = [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]);
  }

  // ---------- Cielo y colores según la hora en que se juega ----------
  // cielo: franjas de arriba hacia abajo; tinte: color y fuerza con que se tiñen colinas, árboles y pasto.
  var HORAS = {
    amanecer: { cielo: ["#3d4f9e", "#6b6fb5", "#a585b8", "#dc9ea2", "#f4b58e", "#ffcf98", "#ffe4b8"], astro: "sol",
      sol: ["#ff9f4a", "#ffd27a"], nube: ["#ffe4dc", "#f5c6bd", "#e4aaa8"], tinte: ["#ff9a5c", 0.14], estrellas: 0 },
    dia: { cielo: ["#2a7ee8", "#3a90f3", "#4ba1fa", "#5fb2ff", "#76c2ff", "#91d1ff", "#afdfff"], astro: "sol",
      sol: ["#ffe066", "#fff6b0"], nube: ["#ffffff", "#d7ecff", "#bcdcf7"], tinte: null, estrellas: 0 },
    atardecer: { cielo: ["#2c2f7a", "#55408f", "#8f4f93", "#cc5f7c", "#ec855e", "#ffaa5c", "#ffcd7a"], astro: "sol",
      sol: ["#ff6a2a", "#ffb25e"], nube: ["#ffc9a8", "#f0a28a", "#d8817a"], tinte: ["#ff7a3d", 0.2], estrellas: 0 },
    noche: { cielo: ["#070b24", "#0b1335", "#101b45", "#152455", "#1b2d66", "#223878", "#2a4388"], astro: "luna",
      sol: ["#f4f1d0", "#fffbe8"], nube: ["#3b4876", "#323e68", "#29335a"], tinte: ["#0b1335", 0.5], estrellas: 1 }
  };
  // ?hora=noche (o amanecer, dia, atardecer) en la dirección fuerza un momento, para probarlo
  var horaFija = (location.search.match(/[?&]hora=(amanecer|dia|atardecer|noche)/) || [])[1];
  function momento() {
    if (horaFija) return horaFija;
    var h = new Date().getHours();
    return h >= 6 && h < 8 ? "amanecer" : h >= 8 && h < 18 ? "dia" : h >= 18 && h < 20 ? "atardecer" : "noche";
  }
  var HORA = HORAS[momento()], tonoMemo = {};
  function aplicarHora() {
    var m = momento();
    HORA = HORAS[m]; tonoMemo = {};
    document.documentElement.setAttribute("data-hora", m);
    return m;
  }
  // tiñe un color de la superficie (colinas, árboles, pasto) con la luz del momento
  function tono(col) {
    if (!HORA.tinte) return col;
    if (tonoMemo[col]) return tonoMemo[col];
    var a = rgb(col), b = rgb(HORA.tinte[0]), k = HORA.tinte[1], out = "#";
    for (var i = 0; i < 3; i++) { var v = Math.round(a[i] + (b[i] - a[i]) * k); out += (v < 16 ? "0" : "") + v.toString(16); }
    return (tonoMemo[col] = out);
  }
  // sol (con rayos de día) o media luna; x, y es su centro aproximado
  function dibujaAstro(px, x, y) {
    var c = HORA.sol;
    if (HORA.astro === "luna") {
      px(x - 3, y - 1, c[0], 6, 8); px(x - 4, y, c[0], 8, 6); px(x - 2, y + 1, "#d9d4b0", 2, 2); px(x + 1, y + 4, "#d9d4b0", 2, 1);
      px(x, y - 1, HORA.cielo[1], 4, 3); px(x + 1, y + 2, HORA.cielo[1], 3, 2);
      return;
    }
    px(x - 3, y - 1, c[0], 6, 8); px(x - 4, y, c[0], 8, 6); px(x - 2, y, c[1], 3, 2);
    if (HORA === HORAS.dia) {
      [[-7, 2, 2, 1], [5, 2, 2, 1], [0, -4, 1, 2], [0, 8, 1, 2], [-6, -3, 1, 1], [5, -3, 1, 1], [-6, 7, 1, 1], [5, 7, 1, 1]]
        .forEach(function (a) { px(x + a[0], y + a[1], "#ffd23f", a[2], a[3]); });
    }
  }
  function dibujaEstrellas(px, r, W, alto) {
    if (!HORA.estrellas) return;
    for (var i = 0, n = Math.floor(W * alto / 40); i < n; i++) {
      var x = Math.floor(r() * W), y = Math.floor(r() * alto);
      px(x, y, r() < 0.7 ? "#ffffff" : "#c9d6ff");
      if (r() < 0.08) { px(x - 1, y, "#8fa3e0"); px(x + 1, y, "#8fa3e0"); px(x, y - 1, "#8fa3e0"); px(x, y + 1, "#8fa3e0"); }
    }
  }
  // dónde va el sol o la luna: al amanecer sale por la izquierda y al atardecer se pone por la derecha
  function lugarAstro(W, alto, yDia) {
    var m = momento();
    return m === "amanecer" ? [18, alto - 9] : m === "atardecer" ? [W - 26, alto - 9] : [W - 30, yDia];
  }

  function paintWorld() {
    var cv = $("strata");
    if (!cv) return;
    var W = Math.ceil(Math.max(window.innerWidth, 1040) / PX) + 2;
    var H = Math.ceil((GROUND + worldDepth() * PXM + 700) / PX);
    var G0 = GROUND / PX, r = seeded("estratos-corgi"), x, y, i, n;
    cv.width = W; cv.height = H;
    cv.style.width = W * PX + "px"; cv.style.height = H * PX + "px"; cv.style.marginLeft = -(W * PX / 2) + "px";
    $("world").style.height = H * PX + "px";
    var c = cv.getContext("2d"), img = c.createImageData(W, H), d = img.data;
    function px(a, b, col, w, h) {
      var k = rgb(col);
      for (var yy = b; yy < b + (h || 1); yy++) {
        for (var xx = a; xx < a + (w || 1); xx++) {
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          var o = (yy * W + xx) * 4;
          d[o] = k[0]; d[o + 1] = k[1]; d[o + 2] = k[2]; d[o + 3] = 255;
        }
      }
    }
    var sky = HORA.cielo, nb = HORA.nube;
    for (y = 0; y < G0; y++) px(0, y, sky[Math.min(sky.length - 1, Math.floor(y / (G0 / sky.length)))], W, 1);
    dibujaEstrellas(px, seeded("estrellas-juego"), W, G0 - 14);
    var ast = lugarAstro(W - 30, G0, 38); dibujaAstro(px, ast[0], ast[1]);
    for (i = 0; i < Math.ceil(W / 40); i++) {
      x = Math.floor(r() * W); y = 30 + Math.floor(r() * 30); n = 8 + Math.floor(r() * 10);
      if (HORA.estrellas && i % 3) continue;   // de noche, menos nubes
      px(x, y, nb[0], n, 2); px(x + 2, y - 1, nb[0], n - 5, 1); px(x + 1, y + 2, nb[1], n - 3, 1);
    }
    // colinas y arbolitos en el horizonte
    for (x = 0; x < W; x++) {
      var hh1 = Math.round(5 + Math.sin(x * 0.045) * 3 + Math.sin(x * 0.11 + 1) * 1.5);
      px(x, G0 - hh1 - 3, tono("#8fd07c"), 1, hh1 + 3);
      var hh2 = Math.round(2 + Math.sin(x * 0.08 + 2) * 2 + Math.sin(x * 0.19) * 1);
      if (hh2 > 0) px(x, G0 - hh2, tono("#6cbf58"), 1, hh2);
    }
    for (i = 0; i < Math.ceil(W / 60); i++) {
      x = 4 + Math.floor(r() * (W - 8)); y = G0 - 8 - Math.floor(r() * 3);
      px(x + 1, y + 3, tono("#6b4425"), 1, 3); px(x, y, tono("#3f8f3f"), 3, 3); px(x + 1, y - 1, tono("#3f8f3f")); px(x, y, tono("#5fae4d"));
    }
    var wob = [];
    for (x = 0; x < W; x++) wob[x] = Math.round(Math.sin(x * 0.21) * 2 + Math.sin(x * 0.07) * 2 + (r() - 0.5) * 1.5);
    function layerAt(a, b) {
      var m = ((b + wob[a]) * PX - GROUND) / PXM;
      for (var k = LAYERS.length - 1; k > 0; k--) if (m >= LAYERS[k].from) return k;
      return 0;
    }
    for (x = 0; x < W; x++) {
      var prev = -1;
      for (y = G0; y < H; y++) {
        var k = layerAt(x, y), cols = LAYERS[k].c, q = r();
        px(x, y, k !== prev && prev >= 0 ? cols[2] : q < 0.68 ? cols[0] : q < 0.84 ? cols[1] : cols[2]);
        if (k !== prev && prev >= 0) px(x, y - 1, LAYERS[prev].c[2]);
        prev = k;
      }
    }
    // vetas de sedimento para que la tierra no se vea plana
    for (i = 0, n = Math.floor(W * (H - G0) / 45); i < n; i++) {
      x = Math.floor(r() * W); y = G0 + 4 + Math.floor(r() * (H - G0 - 6));
      var kv = layerAt(x, y), lv = 3 + Math.floor(r() * 7), cv2 = r() < 0.6 ? LAYERS[kv].c[2] : LAYERS[kv].c[1];
      for (var m2 = 0; m2 < lv; m2++) if (layerAt(x + m2, y) === kv) px(x + m2, y, cv2);
    }
    // raíces bajo el pasto
    for (i = 0; i < W / 5; i++) {
      x = Math.floor(r() * W); n = 3 + Math.floor(r() * 9);
      for (y = 0; y < n; y++) { px(x, G0 + 3 + y, "#5d3b1e"); if (r() < 0.4) x += r() < 0.5 ? -1 : 1; }
    }
    // detalles enterrados según la capa
    var deco = [
      function (a, b) { px(a, b, "#d2a877", 2, 1); px(a, b + 1, "#7c4a27", 2, 1); },
      function (a, b) {
        if (r() < 0.6) { px(a, b, "#9aa3ad", 3, 2); px(a, b, "#c9d1d8", 2, 1); px(a + 1, b + 2, "#5b3a22", 2, 1); }
        else { px(a, b, "#f1e7d0", 4, 1); px(a - 1, b - 1, "#f1e7d0"); px(a - 1, b + 1, "#f1e7d0"); px(a + 4, b - 1, "#f1e7d0"); px(a + 4, b + 1, "#f1e7d0"); }
      },
      function (a, b) {
        var t = r();
        if (t < 0.4) { for (var m = 0; m < 4; m++) px(a + m, b + (m % 2 ? m - 1 : m), "#3f434c"); }
        else if (t < 0.75) { px(a, b, "#f6c12d", 2, 2); px(a, b, "#fff1a8"); px(a + 2, b + 1, "#b98510"); }
        else { px(a, b, "#d9e2ea", 2, 1); px(a + 1, b + 1, "#aab4bf", 2, 1); }
      },
      function (a, b) {
        var col = r() < 0.5 ? ["#7fe3ff", "#d6f7ff", "#3ba6c9"] : ["#f28fd0", "#ffd9f1", "#b34f93"];
        px(a + 1, b, col[0]); px(a, b + 1, col[0], 3, 1); px(a + 1, b + 2, col[2]); px(a + 1, b + 1, col[1]);
      },
      function (a, b) {
        if (r() < 0.6) { px(a, b, "#ff8a2a", 4, 1); px(a + 1, b + 1, "#ff8a2a", 3, 1); px(a + 1, b, "#ffe066", 2, 1); }
        else px(a, b, "#3a100c", 2, 1);
      },
      function (a, b) { px(a, b, "#6f5aa8", 1, 3); px(a + 1, b + 1, "#a892e6"); px(a - 1, b + 2, "#17121d", 3, 1); },
      function (a, b) {
        if (r() < 0.5) { px(a, b, "#bfeee0", 3, 1); px(a, b + 1, "#bfeee0"); px(a + 2, b + 1, "#bfeee0"); px(a, b + 2, "#bfeee0", 3, 1); px(a + 1, b + 1, "#0f2a2a"); }
        else { px(a, b, "#7fd8bd", 5, 1); px(a + 1, b - 1, "#7fd8bd"); px(a + 3, b + 1, "#7fd8bd"); }
      },
      function (a, b) { px(a, b, "#ffe066", 3, 2); px(a + 1, b, "#fffbe0"); px(a - 1, b + 2, "#ff8a2a", 4, 1); }
    ];
    for (i = 0, n = Math.floor(W * H / 240); i < n; i++) {
      x = 2 + Math.floor(r() * (W - 8)); y = G0 + 5 + Math.floor(r() * (H - G0 - 10));
      var kk = layerAt(x, y);
      if (layerAt(x + 4, y + 3) === kk && layerAt(x, y - 2) === kk) deco[kk](x, y);
    }
    // pasto y flores
    for (x = 0; x < W; x++) {
      px(x, G0, tono(r() < 0.5 ? "#6cc24a" : "#5bb04a")); px(x, G0 + 1, tono("#4a9a3c")); px(x, G0 + 2, r() < 0.6 ? tono("#3f8a35") : "#5d3b1e");
      if (r() < 0.25) px(x, G0 - 1, tono("#6cc24a"));
      if (r() < 0.04) { px(x, G0 - 2, tono(["#ffffff", "#ffcf3f", "#f28fb8"][Math.floor(r() * 3)])); px(x, G0 - 1, tono("#3f8a35")); }
    }
    c.putImageData(img, 0, 0);

    var ticks = "";
    for (i = 1; i <= Math.floor(worldDepth() / 1000); i++) {
      ticks += '<span class="tick" style="top:' + (GROUND + i * 1000 * PXM) + 'px">' + i + " km</span>";
    }
    $("ticks").innerHTML = ticks;
  }

  function burst(tier) {
    if (reduce) return;
    var shaft = $("world"), dg = $("digger");
    if (!shaft || !dg) return;
    var cols = [["#9a6237", "#7c4a27", "#b98152"], ["#9a6237", "#9aa3ad", "#7c4a27"], ["#9a6237", "#fff6e6", "#7c4a27"],
      ["#59c2a4", "#9a6237", "#a5ecd6"], ["#c58bea", "#f6c12d", "#9a6237"], ["#ffcf3f", "#fff7c2", "#f6c12d"]][tier];
    var cx = dg.offsetLeft + DOG / 2, cy = dg.offsetTop + DOG * 0.55, n = 14 + tier * 4;
    for (var i = 0; i < n; i++) {
      var s = document.createElement("i"), side = i % 2 ? 1 : -1;
      s.className = "clod";
      s.style.left = cx + "px"; s.style.top = cy + "px";
      s.style.background = cols[i % cols.length];
      s.style.setProperty("--dx", (side * (24 + Math.random() * 70)) + "px");
      s.style.setProperty("--dy", (-20 - Math.random() * 90) + "px");
      s.style.animationDelay = (Math.random() * 520) + "ms";
      shaft.appendChild(s);
      (function (el) { setTimeout(function () { el.remove(); }, 1500); })(s);
    }
  }

  // ---------- partida ----------
  function start(cat, mode, fecha) {
    var p = pool(cat), t = fecha || today(), d = save.daily[cat], deck, resume = null;
    if (mode === "diario") {
      deck = dailyDeck(cat, t);
      if (d && d.date === t) {
        if (d.done) { return results({ cat: cat, mode: mode, results: d.results, score: d.score, stored: true, fecha: t }); }
        resume = d;
      } else {
        save.daily[cat] = { date: t, results: [], score: 0, done: false };
        persist();
      }
    } else {
      deck = bolsa(cat, MODES[mode].finite ? RUN : 1);
      if (MODES[mode].finite) deck = deck.slice(0, RUN);
    }
    G = {
      cat: cat, mode: mode, deck: deck, idx: 0, results: [], score: 0, shown: 0,
      clock: CLOCK, qLeft: QTIME, phase: "ask", last: performance.now()
    };
    if (resume) { G.results = resume.results.slice(); G.score = resume.score; G.shown = G.score; G.idx = G.results.length; }
    if (G.idx >= deck.length && MODES[mode].finite) return finish();
    renderGame();
    stopTimer();
    timer = setInterval(tick, 100);
  }

  function worldDepth() { return MODES[G.mode].finite ? FULL : 20000; }
  function depthPx(pts) { return Math.min(pts * 10, worldDepth()) * PXM; }
  function yFor(pts) { return GROUND - 58 + depthPx(pts); }
  function cumul(n) {
    var s = 0;
    for (var i = 0; i < n; i++) s += G.results[i].pts;
    return s;
  }

  function renderGame() {
    var c = CC.cats[G.cat], fin = MODES[G.mode].finite;
    show(
      '<div class="scene" id="scene"><div class="world" id="world"><canvas id="strata"></canvas>' +
      '<div id="ticks"></div><div class="tunnel" id="tunnel"></div><div id="relics"></div>' +
      '<div class="digger" id="digger">' + Corgi.svg(save.corgi, DOG) + '</div><div class="found" id="found"></div></div></div>' +
      '<header class="hud"><div class="hud-izq"><button class="btn ghost" data-go="quit">' + (fin ? L("Salir", "Quit") : L("Retirarse", "Retire")) +
      '</button><button class="btn ghost small" data-go="ajustes" title="' + L("Ajustes", "Settings") + '" aria-label="' + L("Ajustes", "Settings") +
      '">' + engrane(18) + "</button></div>" +
      '<div class="trailbox"><div class="hud-title" style="--c:' + c.color + '">' + catIcon(G.cat, 16) + esc(cn(G.cat)) + " · " + mn(G.mode) +
      '</div><div class="trail" id="trail"></div></div>' +
      '<div class="depth"><b id="dnum">0 m</b><span id="dpts">0 pts</span></div></header>' +
      '<section class="ask"><div class="timer"><div class="timer-fill" id="tfill"></div><span class="timer-txt" id="ttxt"></span></div>' +
      '<div class="q" id="q"></div><div id="zone"></div></section>'
    );
    document.body.classList.add("jugando");
    paintWorld();
    G.results.forEach(function (r, i) { if (r.tier >= 0) relic(r.tier, cumul(i + 1), i); });
    drawShaft(); drawDepth(G.score); ask();
  }

  function dot(r, fresh) {
    return '<i class="dot done ' + (fresh ? "fresh " : "") + (r.tier < 0 ? "t-x" : "t-" + r.tier) + '" title="' +
      esc((r.ans ? an(r.ans, null, r.q) : L("Sin respuesta", "No answer")) + " — " + (r.tier < 0 ? L("nada", "nothing") : tn(r.tier)) + " — " + qt(r.q)) + '">' +
      (r.tier < 0 ? "0" : r.pts) + "</i>";
  }
  function drawTrail() {
    var el = $("trail"), h = "", i;
    if (!el) return;
    if (MODES[G.mode].finite) {
      for (i = 0; i < RUN; i++) {
        h += G.results[i] ? dot(G.results[i], G.phase === "dig" && i === G.results.length - 1) : '<i class="dot' + (i === G.idx && G.phase === "ask" ? " now" : "") + '"></i>';
      }
    } else {
      var from = Math.max(0, G.results.length - 9);
      if (from > 0) h += '<span class="more">+' + from + "</span>";
      for (i = from; i < G.results.length; i++) h += dot(G.results[i], G.phase === "dig" && i === G.results.length - 1);
      if (G.phase === "ask") h += '<i class="dot now"></i>';
    }
    el.innerHTML = h;
  }

  // Modos libres (Libre, Sin final, Contrarreloj): cada categoría lleva en el navegador, sin mostrarlo,
  // la lista de consignas que ya salieron. Se reparten primero las que faltan; cuando ya salieron todas,
  // empieza otra vuelta con las mismas en otro orden. El diario no la usa ni la cambia.
  function bolsa(cat, n) {
    var p = pool(cat), vistas = (save.vistas = save.vistas || {})[cat] || [], ya = {};
    vistas.forEach(function (id) { ya[id] = 1; });
    var faltan = shuffle(p.filter(function (x) { return !ya[x.id]; }));
    if (faltan.length >= n) return faltan;
    // se acabaron: las que quedaban van primero y detrás el resto revuelto; la vuelta nueva empieza vacía
    save.vistas[cat] = [];
    persist();
    return faltan.concat(shuffle(p.filter(function (x) { return ya[x.id]; })));
  }
  function marcarVista(p) {
    if (G.mode === "diario") return;
    var l = (save.vistas = save.vistas || {})[G.cat] || (save.vistas[G.cat] = []);
    if (l.indexOf(p.id) < 0) { l.push(p.id); persist(); }
  }

  function ask() {
    var p = G.deck[G.idx];
    marcarVista(p);
    G.phase = "ask"; G.qLeft = QTIME; G.last = performance.now(); G.lastTick = 0;
    drawTrail();
    var q = $("q");
    q.textContent = qt(p.q);
    q.classList.remove("in"); void q.offsetWidth; q.classList.add("in");
    $("zone").innerHTML =
      '<form id="form" autocomplete="off"><input id="ans" type="text" maxlength="60" spellcheck="false" ' +
      'placeholder="' + L("Escribe tu respuesta", "Type your answer") + '" aria-label="' + L("Tu respuesta", "Your answer") + '">' +
      '<button class="btn" type="submit">' + L("Cavar", "Dig") + "</button></form>" +
      '<div class="fb" id="fb">' + L("Piensa en algo que casi nadie diría.", "Think of something almost nobody would say.") + "</div>" +
      '<button class="btn ghost small" data-go="skip">' + L("Pasar esta consigna", "Skip this prompt") + (G.mode === "contra" ? " (-" + SKIP_PEN + " s)" : "") + "</button>";
    $("ans").focus();
    // las consignas de cine arman sus miles de respuestas al primer uso: se adelanta mientras se lee la consigna
    setTimeout(function () { void p.answers; }, 60);
    $("digger").className = "digger";
    drawTimer();
  }

  function tick() {
    if (!G || G.phase !== "ask") return;
    var now = performance.now(), dt = (now - G.last) / 1000;
    G.last = now;
    if (G.mode === "contra") {
      G.clock -= dt;
      if (G.clock <= 0) { G.clock = 0; drawTimer(); return enviarUltimo() || finish(); }
    } else {
      G.qLeft -= dt;
      if (G.qLeft <= 0) { G.qLeft = 0; drawTimer(); return enviarUltimo() || resolve(null, "Se acabó el tiempo"); }
    }
    var left = G.mode === "contra" ? G.clock : G.qLeft, lim = G.mode === "contra" ? 10 : 5, sec = Math.ceil(left);
    if (left <= lim && sec !== G.lastTick) { G.lastTick = sec; SFX.tick(); }
    drawTimer();
  }

  // Al acabarse el tiempo se manda lo que quedó escrito, solo si coincide o se parece de verdad a una respuesta.
  function enviarUltimo() {
    var input = $("ans"), raw = input ? input.value.trim() : "";
    var m = raw ? CC.matchFinal(G.deck[G.idx], raw) : null;
    if (!m) return false;
    resolve(m, raw);
    return true;
  }

  function drawTimer() {
    var contra = G.mode === "contra";
    var left = contra ? G.clock : G.qLeft, frac = Math.min(1, left / (contra ? CLOCK : QTIME));
    var fill = $("tfill");
    if (!fill) return;
    fill.style.transform = "scaleX(" + frac + ")";
    fill.className = "timer-fill" + (left <= (contra ? 10 : 7) ? " low" : "");
    $("ttxt").textContent = contra ? fmtClock(left) : Math.ceil(left) + " s";
  }

  function submit() {
    if (!G || G.phase !== "ask") return;
    var input = $("ans"), raw = input.value.trim();
    if (!raw) return;
    var m = CC.match(G.deck[G.idx], raw);
    if (!m) {
      var fb = $("fb");
      fb.className = "fb bad";
      SFX.miss();
      fb.textContent = L("«" + raw + "» no está en mi lista. Prueba otra.", "“" + raw + "” isn't on my list. Try another one.");
      input.value = ""; input.focus();
      input.classList.remove("shake"); void input.offsetWidth; input.classList.add("shake");
      var dg = $("digger");
      dg.className = "digger"; void dg.offsetWidth; dg.className = "digger sad";
      return;
    }
    resolve(m, raw);
  }

  function relic(tier, pts, i) {
    var el = document.createElement("div");
    el.className = "relic" + (i % 2 ? " right" : "");
    el.style.top = (yFor(pts) + DOG - 26) + "px";
    el.innerHTML = Corgi.item(tier, 24);
    $("relics").appendChild(el);
  }

  function resolve(m, raw) {
    var p = G.deck[G.idx], tier = m ? m.a.tier : -1, t = TIERS[tier], g = G;
    var r = {
      q: p.q, tier: tier, pts: m ? t.p : 0,
      ans: m ? m.a.name : "", typed: m && m.fixed ? raw : "", en: m && m.en ? raw : "",
      why: m ? "" : raw, pen: 0
    };
    var from = G.score;
    G.phase = "dig";
    G.results.push(r); G.score += r.pts; G.acierto = m ? m.a : null;
    if (m && G.mode === "contra") G.clock += t.s;
    // en Contrarreloj, pasar una consigna cuesta segundos del reloj
    if (!m && raw === "Pasaste" && G.mode === "contra") { r.pen = SKIP_PEN; G.clock = Math.max(0, G.clock - SKIP_PEN); }
    if (G.mode === "diario") {
      var d = save.daily[G.cat];
      d.results = G.results.slice(); d.score = G.score; persist();
    }
    drawTrail();

    var dg = $("digger"), found = $("found");
    if (!m) {
      dg.className = "digger sad";
      SFX.miss();
      $("zone").innerHTML = '<div class="digging">' + esc(porque(raw)) + "…</div>";
      return setTimeout(function () { if (G === g) reveal(r); }, reduce ? 0 : 550);
    }
    // 1) el corgi se clava y cava  2) baja por el túnel  3) sale con lo que encontró
    $("zone").innerHTML = '<div class="digging"><span>' + L("Cavando", "Digging") + "</span><i></i><i></i><i></i></div>";
    dg.className = "digger dig";
    $("scene").className = "scene rumble";
    burst(tier);
    SFX.dig();
    drawShaft();
    countDepth(from, G.score, 1000);
    setTimeout(function () {
      if (G !== g) return;
      $("scene").className = "scene" + (tier >= 4 ? " flash" : "");
      dg.className = "digger cheer";
      SFX.found(tier);
      found.style.top = (yFor(G.score) - 46) + "px";
      found.className = "found show t-" + tier;
      found.innerHTML = Corgi.item(tier, 60) + "<b>" + L(t.say, t.sayEn) + "</b>" + (tier >= 3 ? "<s></s><s></s><s></s><s></s>" : "");
      relic(tier, G.score, G.results.length - 1);
      reveal(r);
    }, reduce ? 0 : 1100);
  }

  // Tres respuestas al azar que valían Hueso o menos, para cuando fallas o pasas
  function sugerencias(p) {
    // cada lugar sale de un nivel al azar (Tierrita, Piedrita o Hueso) y dentro de él una respuesta al azar,
    // para que no salgan siempre las mismas ni tres Huesos rarísimos en las listas enormes
    var por = [[], [], []], elegidas = [];
    p.answers.forEach(function (a) { if (a.tier <= 2) por[a.tier].push(a); });
    while (elegidas.length < 3) {
      var llenos = por.filter(function (l) { return l.length; });
      if (!llenos.length) break;
      var l = llenos[Math.floor(Math.random() * llenos.length)];
      elegidas.push(l.splice(Math.floor(Math.random() * l.length), 1)[0]);
    }
    if (!elegidas.length) return "";
    elegidas.sort(function (a, b) { return a.tier - b.tier; });
    return '<div class="rv-sug"><span>' + L("Podías decir:", "You could have said:") + "</span>" + elegidas.map(function (a) {
      return '<span class="sug">' + esc(an(a.name, a.keys, p.q)) + chip(a.tier) + "</span>";
    }).join("") + "</div>";
  }

  // ---------- Descripción corta del acierto (Wikipedia en español) ----------
  var DESC = {};
  var TEMAS = ("película serie videojuego juego anime personaje animal planeta país capital ciudad río lago montaña volcán isla " +
    "pokémon director directora actor actriz cantante grupo banda deporte equipo futbolista jugador comida fruta verdura " +
    "instrumento elemento dios diosa raza árbol flor ave pez dinosaurio libro canción marca estado provincia").split(" ");
  // palabra que dice de qué trata la consigna ("película", "planeta"...), para buscar el artículo correcto
  function palabraTema(q) {
    var w = q.toLowerCase().replace(/\([^)]*\)/g, " ").split(/[\s,]+/);
    for (var i = 0; i < w.length; i++) if (TEMAS.indexOf(w[i]) >= 0) return w[i];
    for (i = 1; i < w.length; i++) if (w[i] && !/^(un|una|unos|unas|a|al|el|la|los|las|alguien|que|haya|cualquier|algo|lo|de|del)$/.test(w[i])) return w[i];
    return "";
  }
  function wiki(params, host) {
    var url = "https://" + (host || "es") + ".wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1" +
      "&prop=extracts%7Cpageprops%7Cinfo%7Clanglinks&lllang=en&inprop=url&exintro=1&explaintext=1&exsentences=2&" + params;
    var ctl = window.AbortController ? new AbortController() : null;
    if (ctl) setTimeout(function () { ctl.abort(); }, 6000);
    return fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (res) { return res.json(); }).then(function (d) {
      var pg = (d.query && d.query.pages) || {};
      return Object.keys(pg).map(function (k) { return pg[k]; }).sort(function (a, b) { return (a.index || 0) - (b.index || 0); });
    });
  }
  function desamb(pg) { return pg.pageprops && "disambiguation" in pg.pageprops; }
  function frasePagina(pg) {
    // las páginas que son listas ("Anexo:Pokémon de la primera generación") no describen la respuesta
    if (/^(Anexo:|List of )/.test(pg.title) || /^(esta es una |la siguiente es una |this is a |the following is a )?lista?\b/i.test(pg.extract || "")) return null;
    var t = (pg.extract || "").replace(/[\u200b\u200e]/g, "").replace(/\s+/g, " ").trim();
    // sin paréntesis (pronunciación, idioma original...), aunque estén anidados
    for (var antes = ""; antes !== t;) { antes = t; t = t.replace(/\s*\([^()]*\)/g, ""); }
    if (!t) return null;
    if (t.length > 230) t = t.slice(0, 227).replace(/\s+\S*$/, "") + "…";
    return { texto: t, url: pg.fullurl };
  }
  // en inglés, el artículo en español encontrado lleva a su versión en la Wikipedia en inglés (si existe)
  function enIdioma(pg) {
    if (LANG !== "en") return frasePagina(pg);
    var ll = pg.langlinks && pg.langlinks[0] && pg.langlinks[0]["*"];
    if (!ll) return null;
    return wiki("titles=" + encodeURIComponent(ll), "en").then(function (p2) {
      return p2[0] && !("missing" in p2[0]) ? frasePagina(p2[0]) : null;
    });
  }
  function describir(a, q, el) {
    if (!el || !window.fetch) return;
    var nombre = a.name.replace(/\s\(\d{4}\)$/, ""), anio = (a.name.match(/\((\d{4})\)$/) || [])[1] || "";
    var tema = palabraTema(q), clave = a.name + "|" + tema + "|" + LANG;
    function poner(d) {
      DESC[clave] = d || false;
      if (!d || !el.isConnected) return;
      el.innerHTML = esc(d.texto) + ' <a href="' + esc(d.url) + '" target="_blank" rel="noopener">Wikipedia</a>';
      el.hidden = false;
    }
    if (clave in DESC) return poner(DESC[clave]);
    var raiz = CC.norm(tema).slice(0, 5);
    wiki("generator=search&gsrlimit=5&gsrsearch=" + encodeURIComponent((nombre + " " + anio + " " + tema).trim())).then(function (pgs) {
      // el artículo debe llamarse como la respuesta; si lleva paréntesis, que diga el año o el tema ("Titanic (película de 1997)")
      for (var i = 0; i < pgs.length; i++) {
        var pg = pgs[i], m = pg.title.match(/^(.*?)(?:\s*\(([^)]*)\))?$/), par = CC.norm(m[2] || "");
        if (desamb(pg) || a.keys.indexOf(CC.norm(m[1])) < 0) continue;
        if (par && !(anio && par.indexOf(anio) >= 0) && !(raiz && par.indexOf(raiz) >= 0)) continue;
        return enIdioma(pg);
      }
      if (anio) return null;
      // si no, el artículo con ese nombre exacto (o al que redirige), salvo que sea de desambiguación
      return wiki("titles=" + encodeURIComponent(nombre)).then(function (p2) {
        var pg = p2[0];
        return !pg || "missing" in pg || desamb(pg) ? null : enIdioma(pg);
      });
    }).then(poner, function () { poner(null); });
  }

  function reveal(r) {
    var m = r.tier >= 0, t = TIERS[r.tier], nom = an(r.ans, G.acierto && G.acierto.keys, r.q);
    G.phase = "reveal";
    var last = MODES[G.mode].finite && G.idx + 1 >= G.deck.length;
    var head = m
      ? '<div class="rv-ans">' + esc(nom) + "</div>" +
        (r.typed ? '<div class="rv-fix">' + L("Escribiste «" + esc(r.typed) + "»; lo tomé como «" + esc(nom) + "».",
          "You typed “" + esc(r.typed) + "”; I took it as “" + esc(nom) + "”.") + "</div>" : "") +
        (r.en && LANG !== "en" ? '<div class="rv-fix">«' + esc(r.en) + "» en español es «" + esc(r.ans) + "».</div>" : "") +
        '<div class="rv-row">' + chip(r.tier) + '<span class="rv-pts">+' + r.pts + L(" pts · baja ", " pts · down ") + r.pts * 10 + " m" +
        (G.mode === "contra" ? " · +" + t.s + " s" : "") + "</span></div>" +
        '<div class="rv-desc" id="rvDesc" hidden></div>'
      : '<div class="rv-ans miss">' + esc(porque(r.why)) + '</div><div class="rv-row">' + chip(-1) +
        '<span class="rv-pts">+0 pts' + (r.pen ? " · -" + r.pen + " s" : "") + "</span></div>" +
        sugerencias(G.deck[G.idx]);
    $("zone").innerHTML =
      '<div class="reveal ' + (m ? "t-" + r.tier : "t-x") + '">' + head + "</div>" +
      '<button class="btn" id="next" data-go="next">' + (last ? L("Ver resultado", "See results") : L("Siguiente", "Next")) + "</button>";
    $("next").focus();
    if (m && G.acierto) describir(G.acierto, r.q, $("rvDesc"));
    drawTimer();
    if (G.mode === "contra") {
      var g = G;
      setTimeout(function () { if (G === g && G.phase === "reveal") next(); }, 1700);
    }
  }

  function next() {
    if (!G || G.phase !== "reveal") return;
    $("found").className = "found";
    G.idx++;
    if (G.idx >= G.deck.length) {
      if (MODES[G.mode].finite) return finish();
      G.deck = G.deck.concat(bolsa(G.cat, 1));
    }
    ask();
  }

  function drawShaft() {
    var y = yFor(G.score);
    $("tunnel").style.height = (y + DOG - GROUND) + "px";
    $("digger").style.top = y + "px";
    $("world").style.transform = "translateY(" + (-depthPx(G.score)) + "px)";
  }

  function drawDepth(pts) {
    var a = $("dnum");
    if (!a) return;
    a.textContent = meters(pts); $("dpts").textContent = Math.round(pts) + " pts";
  }
  function countDepth(from, to, ms) {
    if (reduce || from === to) return drawDepth(to);
    var t0 = performance.now(), g = G;
    (function step(now) {
      if (G !== g) return;
      var k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      drawDepth(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step); else drawDepth(to);
    })(t0);
    setTimeout(function () { if (G === g) drawDepth(to); }, ms + 80);
  }

  function finish() {
    stopTimer();
    var g = G; G = null;
    var prev = bestOf(g.cat, g.mode), record = false;
    if (g.mode === "diario") {
      var d = save.daily[g.cat];
      d.results = g.results; d.score = g.score; d.done = true;
    } else if (g.score > prev) {
      (save.best[g.cat] = save.best[g.cat] || {})[g.mode] = g.score; record = true;
    }
    persist();
    var pl = player();
    if (pl) {
      if (g.mode === "diario") {
        send({ t: "diario", apodo: pl.apodo, cat: g.cat, pts: g.score, res: compact(g.results) });
      } else if (record) {
        send({ t: "record", apodo: pl.apodo, cat: g.cat, modo: g.mode, pts: g.score });
      }
    }
    results({ cat: g.cat, mode: g.mode, results: g.results, score: g.score, record: record,
      fecha: g.mode === "diario" ? save.daily[g.cat].date : null });
  }

  function shareText(o) {
    return GAME_NAME + " - " + cn(o.cat) + " - " + mn(o.mode) + (o.mode === "diario" ? " " + (o.fecha || today()) : "") + "\n" +
      o.results.map(function (r, i) { return (i + 1) + ". " + (r.tier < 0 ? L("nada", "nothing") : tn(r.tier)); }).join("\n") + "\n" +
      L("Cavé ", "I dug ") + meters(o.score) + " (" + o.score + " pts)";
  }

  // ---------- Curva de campana del resultado ----------
  // Todavía no hay puntajes de otros jugadores: la curva se estima con lo que suele sacar una persona en cada consigna.
  var TIPICO = [0.18, 0.34, 0.2, 0.13, 0.08, 0.04, 0.03];   // nada, Tierrita, Piedrita, Hueso, Fósil, Tesoro, Hueso de Oro
  function repartoTipico(n) {
    var d = [1];
    for (var k = 0; k < n; k++) {
      var nd = [];
      for (var j = 0; j < d.length + 20; j++) nd.push(0);
      for (var i = 0; i < d.length; i++) {
        if (!d[i]) continue;
        nd[i] += d[i] * TIPICO[0];
        for (var t = 0; t < 6; t++) nd[i + TIERS[t].p / 5] += d[i] * TIPICO[t + 1];
      }
      d = nd;
    }
    return d;   // d[i]: probabilidad de sacar i * 5 puntos
  }
  function campana(o) {
    var n = o.results.length;
    if (!n) return { html: "" };
    var d = repartoTipico(n), media = 0, v = 0, i;
    for (i = 0; i < d.length; i++) media += d[i] * i * 5;
    for (i = 0; i < d.length; i++) v += d[i] * Math.pow(i * 5 - media, 2);
    var sd = Math.sqrt(v), max = Math.max(media + 3.2 * sd, o.score * 1.08, 60);
    function pct(pts) {
      var a = 0, k = Math.round(pts / 5);
      for (var j = 0; j < d.length && j <= k; j++) a += j < k ? d[j] : d[j] / 2;
      return a;
    }
    function frase(q) {
      return q < 0.01 ? L("menos del 1%", "less than 1%") : q > 0.99 ? L("más del 99%", "over 99%") : L("el ", "") + Math.round(q * 100) + "%";
    }
    // la curva exacta va en escalones de 5 puntos; se suaviza para que se vea como campana
    var bw = Math.max(8, sd * 0.35);
    function alto(p) {
      var y = 0;
      for (var j = 0; j < d.length; j++) if (d[j] > 1e-9) y += d[j] * Math.exp(-Math.pow((j * 5 - p) / bw, 2) / 2);
      return y;
    }
    var W = 1000, H = 190, top = 34, pie = 26, xs = [], ys = [], ym = 0, x;
    for (x = 0; x <= 160; x++) { var p = max * x / 160, y = alto(p); xs.push(p); ys.push(y); ym = Math.max(ym, y); }
    var X = function (p) { return 16 + (W - 32) * Math.min(p, max) / max; };
    var Y = function (y) { return H - pie - (H - pie - top) * y / ym; };
    var linea = xs.map(function (p, j) { return (j ? "L" : "M") + X(p).toFixed(1) + " " + Y(ys[j]).toFixed(1); }).join(" ");
    var area = linea + " L" + X(max).toFixed(1) + " " + (H - pie) + " L" + X(0).toFixed(1) + " " + (H - pie) + " Z";
    var paso = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000].filter(function (s) { return max / s <= 5; })[0] || 5000, eje = "";
    for (var t = 0; t <= max; t += paso) {
      eje += '<text class="curva-eje" x="' + X(t).toFixed(1) + '" y="' + (H - 4) + '" text-anchor="middle">' + meters(t) + "</text>";
    }
    var tx = X(o.score), ty = Y(alto(o.score)), q = pct(o.score);
    var ancla = tx < 60 ? "start" : tx > W - 60 ? "end" : "middle";
    var svg = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + L("Curva estimada de puntajes; cavaste más hondo que ", "Estimated score curve; you beat ") + frase(q) +
      L(" de los jugadores", " of players") + '">' +
      '<path class="curva-area" d="' + area + '"/><path class="curva-linea" d="' + linea + '"/>' +
      '<line class="curva-base" x1="16" x2="' + (W - 16) + '" y1="' + (H - pie) + '" y2="' + (H - pie) + '"/>' + eje +
      '<line class="curva-guia" id="curvaGuia" x1="0" x2="0" y1="' + top + '" y2="' + (H - pie) + '"/>' +
      '<line class="curva-tu" x1="' + tx.toFixed(1) + '" x2="' + tx.toFixed(1) + '" y1="' + (ty - 4).toFixed(1) + '" y2="' + (H - pie) + '"/>' +
      '<circle class="curva-punto" cx="' + tx.toFixed(1) + '" cy="' + ty.toFixed(1) + '" r="7"/>' +
      '<text class="curva-tu-txt" x="' + tx.toFixed(1) + '" y="' + Math.max(12, ty - 14).toFixed(1) + '" text-anchor="' + ancla + '">' + L("TÚ", "YOU") + "</text></svg>";
    return {
      html: '<section class="panel curva"><h2>' + L("¿Qué tan hondo cavaste?", "How deep did you dig?") + "</h2>" +
        '<p class="curva-txt">' + L("Cavaste más hondo que <b>", "You beat <b>") + frase(q) + L("</b> de los jugadores.", "</b> of players.") + "</p>" +
        '<div class="curva-box" id="curva">' + svg + '<div class="curva-tip" id="curvaTip" hidden></div></div>' +
        '<p class="nota">' + L("Es una estimación: todavía no hay puntajes de otros jugadores, así que la curva sale de cómo le suele ir a una persona en ",
          "This is an estimate: there are no scores from other players yet, so the curve comes from how a typical person does on ") +
        n + (n === 1 ? L(" consigna.", " prompt.") : L(" consignas.", " prompts.")) + "</p></section>",
      activar: function () {
        var box = $("curva"), tip = $("curvaTip"), guia = $("curvaGuia");
        if (!box) return;
        box.addEventListener("pointermove", function (e) {
          var r = box.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width * W;
          var pts = Math.round(Math.max(0, Math.min(max, (fx - 16) / (W - 32) * max)) / 5) * 5;
          tip.hidden = false;
          tip.textContent = meters(pts) + L(": más hondo que ", ": beats ") + frase(pct(pts));
          tip.style.left = Math.max(90, Math.min(r.width - 90, e.clientX - r.left)) + "px";
          guia.setAttribute("x1", X(pts)); guia.setAttribute("x2", X(pts)); guia.style.opacity = 1;
        });
        box.addEventListener("pointerleave", function () { tip.hidden = true; guia.style.opacity = 0; });
      }
    };
  }

  var shown = null;
  function results(o) {
    stopTimer(); shown = o;
    vista = function () { results(Object.assign({}, o, { stored: true })); };
    var c = CC.cats[o.cat], fin = MODES[o.mode].finite;
    var hits = o.results.filter(function (r) { return r.tier >= 0; }).length;
    var avg = hits ? o.score / hits : 0;
    if (!o.stored) SFX.done(hits > 0, !!o.record);
    var say = !hits ? L("Hoy no encontré nada… ¡otra vez!", "Found nothing this time… again!")
      : avg >= 75 ? L("¡GUAU! ¡Puro tesoro enterrado!", "WOOF! Nothing but buried treasure!")
      : avg >= 45 ? L("¡Buen hoyo! Olí cosas muy raras.", "Nice hole! I sniffed out some rare stuff.")
      : L("Cavé un poco. La próxima, algo más raro.", "I dug a little. Next time, something rarer.");
    var rows = o.results.map(function (r, i) {
      return '<tr style="--i:' + i + '"><td>' + esc(qt(r.q)) + "</td><td>" + esc(r.ans ? an(r.ans, null, r.q) : "—") + "</td><td>" +
        chip(r.tier) + "</td><td>+" + r.pts + "</td></tr>";
    }).join("");
    var curva = campana(o);
    var haul = o.results.filter(function (r) { return r.tier >= 0; }).map(function (r, i) {
      return '<span style="--i:' + i + '">' + Corgi.item(r.tier, 40) + "</span>";
    }).join("");
    show(
      '<header class="bar"><button class="btn ghost" data-go="home">' + L("Inicio", "Home") + "</button>" +
      '<h1 style="--c:' + c.color + '">' + catIcon(o.cat, 22) + esc(cn(o.cat)) + " · " + mn(o.mode) + "</h1><span></span></header>" +
      '<main class="results">' +
      '<section class="panel score"><div class="stage">' + Corgi.svg(save.corgi, 168, hits ? "happy" : "sadloop") +
      '<div class="mound"></div></div><div><div class="bubble">' + say + "</div>" +
      '<div class="big" id="big">0 m</div><div class="haul">' + haul + "</div>" +
      '<div class="sub">' + o.score + " pts · " + hits + L(" de ", " of ") + o.results.length + L(" consignas", " prompts") +
      (fin ? L(" · máximo ", " · max ") + meters(700) : "") + (o.record ? ' · <b class="rec">' + L("NUEVO RÉCORD", "NEW RECORD") + "</b>" : "") + "</div>" +
      (o.mode === "diario" ? '<div class="sub">' + L("Vuelve mañana por un diario nuevo.", "Come back tomorrow for a new daily.") + "</div>" : "") +
      '<div class="acts">' +
      (o.mode !== "diario" ? '<button class="btn" data-go="again">' + L("Jugar de nuevo", "Play again") + "</button>" : "") +
      '<button class="btn alt" data-go="share">' + L("Copiar resultado", "Copy result") + "</button></div></div></section>" +
      curva.html +
      '<section class="panel"><h2>' + L("Tu excavación", "Your dig") + "</h2>" +
      (rows ? '<table class="rt"><tr><th>' + L("Consigna", "Prompt") + "</th><th>" + L("Tu respuesta", "Your answer") + "</th><th>" +
        L("Hallazgo", "Find") + "</th><th>Pts</th></tr>" + rows + "</table>" : "<p>" + L("No respondiste ninguna consigna.", "You didn't answer any prompt.") + "</p>") +
      "</section></main>"
    );
    if (curva.activar) curva.activar();
    var big = $("big"), t0 = performance.now();
    if (reduce) { big.textContent = meters(o.score); return; }
    (function step(now) {
      if (shown !== o || !big.isConnected) return;
      var k = Math.min(1, (now - t0) / 1200), e = 1 - Math.pow(1 - k, 3);
      big.textContent = meters(o.score * e);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
    setTimeout(function () { if (big.isConnected) big.textContent = meters(o.score); }, 1300);
  }

  function copy(text, btn) {
    function ok() { btn.textContent = L("Copiado", "Copied"); }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); ok(); } catch (e) { btn.textContent = L("No se pudo copiar", "Couldn't copy"); }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback);
    else fallback();
  }

  // ---------- jugador, candado del diario y tabla de posiciones ----------
  var retryFn = null, loginAfter = null, boardView = { cat: "clasica", modo: "diario" }, boardTok = 0;

  function player() { return Online.enabled && save.player ? save.player : null; }
  function compact(res) {
    return res.map(function (r) { return { q: r.q, a: r.ans, t: r.tier, p: r.pts }; });
  }

  // Los envíos que fallan por falta de conexión se guardan y se reintentan al volver al inicio.
  function queue(job) { save.pending = (save.pending || []).concat([job]); persist(); }
  function send(job) {
    var p = player();
    if (!p || p.apodo !== job.apodo) return;
    var call = job.t === "diario" ? Online.terminar(p, job.cat, job.pts, job.res) : Online.record(p, job.cat, job.modo, job.pts);
    call.catch(function () { queue(job); });
  }
  function flush() {
    var list = save.pending || [];
    if (!player() || !list.length) return;
    save.pending = []; persist();
    list.forEach(send);
  }

  function panelPage(title, inner) {
    show(
      '<header class="bar"><button class="btn ghost" data-go="home">' + L("Inicio", "Home") + "</button>" +
      '<h1 style="--c:#f6c12d">' + esc(title) + "</h1><span></span></header>" +
      '<main class="login"><section class="panel">' + inner + "</section></main>"
    );
  }
  function wait(text) { panelPage(L("Un momento", "One moment"), '<p class="big-note">' + esc(text) + "</p>"); }
  function problem(text, retry) {
    retryFn = retry;
    panelPage(L("Sin conexión", "Offline"), "<p>" + esc(text) + '</p><div class="acts"><button class="btn" data-go="retry">' + L("Reintentar", "Retry") + "</button>" +
      '<button class="btn ghost" data-go="home">' + L("Volver", "Back") + "</button></div>");
  }

  function whoPanel() {
    if (!Online.enabled) return "";
    return '<section class="panel who"><h2>' + L("Jugador", "Player") + "</h2>" + (save.player
      ? '<p class="whoami">' + L("Juegas como ", "Playing as ") + "<b>" + esc(save.player.apodo) + '</b></p><div class="acts">' +
        '<button class="btn" data-go="board">' + L("Tabla de posiciones", "Leaderboard") + "</button>" +
        '<button class="btn ghost small" data-go="logout">' + L("Cambiar", "Switch") + "</button></div>"
      : "<p>" + L("Entra con un apodo y un PIN para jugar el diario y aparecer en la tabla.", "Sign in with a nickname and a PIN to play the daily and appear on the leaderboard.") +
        '</p><div class="acts"><button class="btn" data-go="login">' + L("Entrar", "Sign in") + '</button><button class="btn ghost" data-go="board">' +
        L("Ver tabla", "View leaderboard") + "</button></div>") +
      "</section>";
  }

  function loginScreen(after, note) {
    loginAfter = after;
    panelPage(L("Jugador", "Player"),
      "<h2>" + L("Tu apodo y tu PIN", "Your nickname and PIN") + "</h2><p>" +
      L("Si el apodo es nuevo, se crea con ese PIN. Si ya existe, tienes que poner el mismo PIN. " +
        "El PIN sirve para que nadie más use tu nombre; no lo compartas.",
        "If the nickname is new, it's created with that PIN. If it already exists, you have to enter the same PIN. " +
        "The PIN keeps anyone else from using your name; don't share it.") + "</p>" +
      '<form id="loginform" class="lform" autocomplete="off">' +
      "<label>" + L("Apodo", "Nickname") + '<input id="lnick" type="text" maxlength="20" spellcheck="false" placeholder="' + L("2 a 20 caracteres", "2 to 20 characters") + '"></label>' +
      '<label>PIN<input id="lpin" type="password" maxlength="12" placeholder="' + L("4 a 12 caracteres", "4 to 12 characters") + '"></label>' +
      '<button class="btn" type="submit">' + L("Entrar", "Sign in") + "</button></form>" +
      '<div class="fb' + (note ? " bad" : "") + '" id="lerr">' + esc(note || "") + "</div>");
    var n = $("lnick"); if (n) n.focus();
  }

  var LOGIN_ERR = {
    apodo: ["El apodo debe tener de 2 a 20 caracteres: letras, números, punto, guion o guion bajo.",
      "Nicknames need 2 to 20 characters: letters, numbers, period, hyphen or underscore."],
    pin_formato: ["El PIN debe tener entre 4 y 12 caracteres.", "The PIN needs 4 to 12 characters."],
    apodo_parecido: ["Ya existe un apodo igual pero con otras mayúsculas o minúsculas. Escríbelo tal cual.",
      "That nickname already exists with different capitalization. Type it exactly."],
    pin: ["Ese apodo ya existe y el PIN no coincide.", "That nickname exists and the PIN doesn't match."]
  };

  function doLogin() {
    var nick = $("lnick").value.trim(), pin = $("lpin").value, err = $("lerr");
    if (!nick || !pin) { err.className = "fb bad"; err.textContent = L("Escribe tu apodo y tu PIN.", "Enter your nickname and PIN."); return; }
    err.className = "fb"; err.textContent = L("Entrando…", "Signing in…");
    Online.entrar({ apodo: nick, pin: pin }).then(function (r) {
      if (!r.ok) { err.className = "fb bad"; err.textContent = LOGIN_ERR[r.error] ? L(LOGIN_ERR[r.error][0], LOGIN_ERR[r.error][1]) : L("No se pudo entrar.", "Couldn't sign in."); return; }
      save.player = { apodo: nick, pin: pin };
      // los récords que ya tenías en este navegador también suben a la tabla
      Object.keys(save.best).forEach(function (cat) {
        Object.keys(save.best[cat]).forEach(function (modo) {
          if (save.best[cat][modo] > 0) queue({ t: "record", apodo: nick, cat: cat, modo: modo, pts: save.best[cat][modo] });
        });
      });
      persist(); flush();
      if (loginAfter) loginAfter(); else home();
    }).catch(function () {
      err.className = "fb bad"; err.textContent = L("No pude conectar con el servidor. Revisa tu conexión.", "Couldn't reach the server. Check your connection.");
    });
  }

  // Empezar una partida. El diario, con conexión, pasa antes por el servidor, que lleva la cuenta de quién ya lo jugó.
  function begin(cat, mode) {
    if (mode !== "diario" || !Online.enabled) return start(cat, mode);
    if (!save.player) return loginScreen(function () { begin(cat, mode); }, L("Para jugar el diario necesitas entrar.", "You need to sign in to play the daily."));
    var again = function () { begin(cat, mode); };
    wait(L("Consultando el diario de hoy…", "Checking today's daily…"));
    Online.fecha().then(function (fecha) {
      var d = save.daily[cat];
      if (d && d.date === fecha) return start(cat, "diario", fecha);
      return Online.iniciar(save.player, cat).then(function (r) {
        if (r.ok) return start(cat, "diario", String(r.fecha || fecha).slice(0, 10));
        if (r.error === "pin") { save.player = null; persist(); return loginScreen(again, L("El PIN ya no coincide. Entra otra vez.", "The PIN no longer matches. Sign in again.")); }
        if (r.error === "ya_jugado") return playedScreen(cat, r);
        return problem(L("No se pudo empezar el diario (", "Couldn't start the daily (") + r.error + ").", again);
      });
    }).catch(function () {
      problem(L("No hay conexión con el servidor. El diario la necesita para llevar la cuenta de quién ya lo jugó.",
        "No connection to the server. The daily needs it to keep track of who already played."), again);
    });
  }

  function playedScreen(cat, r) {
    panelPage(L("Diario de hoy", "Today's daily"),
      "<h2>" + L("Ya jugaste este diario", "You already played this daily") + "</h2><p>" + (r.terminado
        ? L("Tu resultado de hoy en ", "Your result today in ") + esc(cn(cat)) + L(" fue de <b>", " was <b>") + meters(r.puntos || 0) + "</b>."
        : L("Ya empezaste el diario de hoy en ", "You already started today's daily in ") + esc(cn(cat)) +
          L(" (quizá en otro dispositivo) y cuenta como jugado.", " (maybe on another device), so it counts as played.")) +
      "</p><p>" + L("Vuelve mañana por uno nuevo. Mientras tanto puedes jugar los otros modos.", "Come back tomorrow for a new one. Meanwhile you can play the other modes.") + "</p>" +
      '<div class="acts"><button class="btn" data-go="board">' + L("Ver la tabla", "View leaderboard") + "</button>" +
      '<button class="btn ghost" data-go="home">' + L("Inicio", "Home") + "</button></div>");
  }

  var BOARD_MODES = [["diario", "Hoy", "Today"], ["clasico", "Libre", "Free play"], ["sinfinal", "Sin final", "Endless"], ["contra", "Contrarreloj", "Time attack"]];
  function board() {
    vista = board;
    var tok = ++boardTok, v = boardView, me = save.player && save.player.apodo;
    var cats = CC.order.map(function (id) {
      return '<button class="tab' + (id === v.cat ? " on" : "") + '" data-bcat="' + id + '">' + esc(cn(id)) + "</button>";
    }).join("");
    var modes = BOARD_MODES.map(function (m) {
      return '<button class="tab' + (m[0] === v.modo ? " on" : "") + '" data-bmode="' + m[0] + '">' + L(m[1], m[2]) + "</button>";
    }).join("");
    show(
      '<header class="bar"><button class="btn ghost" data-go="home">' + L("Inicio", "Home") + "</button>" +
      '<h1 style="--c:#f6c12d">' + L("Tabla de posiciones", "Leaderboard") + "</h1><span></span></header>" +
      '<main class="login"><section class="panel"><div class="tabs">' + cats + '</div><div class="tabs">' + modes +
      '</div><div id="boardbody" class="boardbody"><p>' + L("Cargando…", "Loading…") + '</p></div></section></main>'
    );
    if (!Online.enabled) { $("boardbody").innerHTML = "<p>" + L("La tabla en línea todavía no está conectada.", "The online leaderboard isn't connected yet.") + "</p>"; return; }
    var req = v.modo === "diario" ? Online.tablaDiaria(v.cat) : Online.tablaRecords(v.cat, v.modo);
    req.then(function (rows) {
      if (tok !== boardTok || !$("boardbody")) return;
      if (!rows.length) {
        $("boardbody").innerHTML = "<p>" + (v.modo === "diario" ? L("Nadie ha terminado el diario de hoy todavía.", "Nobody has finished today's daily yet.") : L("Todavía no hay récords aquí.", "No records here yet.")) + "</p>";
        return;
      }
      $("boardbody").innerHTML = '<table class="rank"><tr><th>#</th><th>' + L("Jugador", "Player") + "</th><th>" + L("Profundidad", "Depth") + "</th><th>" + L("Puntos", "Points") + '</th></tr>' +
        rows.map(function (r, i) {
          return '<tr class="' + (r.apodo === me ? "me" : "") + '" style="--i:' + i + '"><td>' + (i + 1) + "</td><td>" + esc(r.apodo) +
            "</td><td>" + meters(r.puntos) + "</td><td>" + r.puntos + "</td></tr>";
        }).join("") + "</table>";
    }).catch(function () {
      if (tok === boardTok && $("boardbody")) $("boardbody").innerHTML = "<p>" + L("No pude cargar la tabla. Revisa tu conexión.", "Couldn't load the leaderboard. Check your connection.") + "</p>";
    });
  }

  // ---------- eventos ----------
  app.addEventListener("click", function (e) {
    var el = e.target.closest("button");
    if (!el) return;
    SFX.click();
    if (el.dataset.corgi) { save.corgi = +el.dataset.corgi; persist(); return home(); }
    if (el.dataset.bcat) { boardView.cat = el.dataset.bcat; return board(); }
    if (el.dataset.bmode) { boardView.modo = el.dataset.bmode; return board(); }
    if (el.dataset.mode) return begin(el.dataset.cat, el.dataset.mode);
    switch (el.dataset.go) {
      case "login": return loginScreen(home);
      case "logout": save.player = null; persist(); return home();
      case "board": return board();
      case "retry": return retryFn && retryFn();
      case "home": return home();
      case "skip": return G && G.phase === "ask" && resolve(null, "Pasaste");
      case "next": return next();
      case "quit":
        if (!G || MODES[G.mode].finite) return home();
        return finish();
      case "again": return start(shown.cat, shown.mode);
      case "share": return copy(shareText(shown), el);
      case "ajustes": return ajustes();
    }
  });
  app.addEventListener("submit", function (e) {
    e.preventDefault();
    if (e.target.id === "loginform") return doLogin();
    submit();
  });

  // sonido al pasar sobre un botón y al teclear la respuesta
  var lastBtn = null;
  app.addEventListener("mouseover", function (e) {
    var b = e.target.closest("button");
    if (b && b !== lastBtn) SFX.hover();
    lastBtn = b;
  });
  app.addEventListener("keydown", function (e) {
    if (e.target.id === "ans" && e.key.length === 1) SFX.key();
  });

  // ---------- Ajustes: idioma y sonido ----------
  var vista = null, gear = $("ajustes");
  function paintGear() { gear.innerHTML = engrane(16) + "<span>" + L("Ajustes", "Settings") + "</span>"; }
  function opcion(k, v, txt, on) {
    return '<button class="tab' + (on ? " on" : "") + '" type="button" data-aj="' + k + '" data-v="' + v + '" aria-pressed="' + on + '">' + txt + "</button>";
  }
  function cerrarAjustes() { var c = $("ajustesCapa"); if (c) c.remove(); }
  function ajustes(otraVez) {
    cerrarAjustes();
    var capa = document.createElement("div");
    capa.id = "ajustesCapa"; capa.className = "capa";
    capa.innerHTML = '<section class="panel ajustes' + (otraVez ? " quieta" : "") + '" role="dialog" aria-modal="true" aria-labelledby="ajTit">' +
      '<h2 id="ajTit">' + L("Ajustes", "Settings") + "</h2>" +
      '<div class="aj-fila"><span>' + L("Idioma", "Language") + '</span><div class="aj-ops">' +
      opcion("lang", "es", "Español", LANG === "es") + opcion("lang", "en", "English", LANG === "en") + "</div></div>" +
      '<div class="aj-fila"><span>' + L("Sonido", "Sound") + '</span><div class="aj-ops">' +
      opcion("sound", "1", L("Sí", "On"), save.sound !== false) + opcion("sound", "0", L("No", "Off"), save.sound === false) + "</div></div>" +
      (LANG === "en" ? '<p class="aj-nota">The answer bank is in Spanish. Common words and most names also work in English, ' +
        "and answers show in English when the game knows the translation.</p>" : "") +
      '<div class="acts"><button class="btn" type="button" data-aj="cerrar">' + L("Listo", "Done") + "</button></div></section>";
    document.body.appendChild(capa);
    var on = capa.querySelector(".tab.on");
    if (on) on.focus();
  }
  function cambiarIdioma(l) {
    if (l === LANG) return;
    LANG = l; save.lang = l; persist();
    document.documentElement.lang = l;
    paintGear();
    if (G && $("q")) {
      // a media partida solo se traduce la consigna en pantalla; el resto cambia en la siguiente
      $("q").textContent = qt(G.deck[G.idx].q);
    } else if (vista) vista();
  }
  document.addEventListener("click", function (e) {
    var capa = $("ajustesCapa");
    if (!capa) return;
    var b = e.target.closest("[data-aj]");
    if (!b) { if (e.target === capa) cerrarAjustes(); return; }
    SFX.click();
    if (b.dataset.aj === "cerrar") return cerrarAjustes();
    if (b.dataset.aj === "lang") cambiarIdioma(b.dataset.v);
    if (b.dataset.aj === "sound") { save.sound = b.dataset.v === "1"; SFX.setOn(save.sound); persist(); }
    ajustes(true);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && $("ajustesCapa")) { cerrarAjustes(); var a = $("ans"); if (a) a.focus(); }
  });
  gear.addEventListener("click", function () { SFX.click(); ajustes(); });
  paintGear();


  // ---------- Fondo de la página: cielo pintado y tierra con textura ----------
  function pixelCanvas(w, h) {
    var cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    var c = cv.getContext("2d");
    return { cv: cv, c: c, px: function (x, y, col, ww, hh) { c.fillStyle = col; c.fillRect(x * PX, y * PX, (ww || 1) * PX, (hh || 1) * PX); } };
  }
  var SKY_H = 152, GRASS_H = 24;
  function paintBackdrop() {
    var W = Math.ceil(Math.max(window.innerWidth, 1100) / PX), H = Math.ceil((SKY_H + GRASS_H) / PX), G = SKY_H / PX;
    var r = seeded("cielo-corgi"), x, y, i, n;
    var top = pixelCanvas(W * PX, H * PX), px = top.px;
    var bands = HORA.cielo, nb = HORA.nube;
    for (y = 0; y < G; y++) px(0, y, bands[Math.min(bands.length - 1, Math.floor(y / (G / bands.length)))], W, 1);
    dibujaEstrellas(px, seeded("estrellas-menu"), W, G - 10);
    // sol (o luna)
    var ast = lugarAstro(W, G, 9), sx = ast[0], sy = ast[1];
    dibujaAstro(px, sx, sy);
    // nubes
    function nube(a, b, w) {
      px(a + 2, b, nb[0], w - 4, 1); px(a + 1, b + 1, nb[0], w - 2, 1); px(a, b + 2, nb[0], w, 2);
      px(a + 3, b - 1, nb[0], Math.max(2, Math.floor(w / 3)), 1); px(a, b + 4, nb[1], w, 1); px(a + 1, b + 5, nb[2], w - 2, 1);
    }
    for (i = 0; i < Math.ceil(W / 45); i++) {
      x = Math.floor(r() * (W - 20)); y = 4 + Math.floor(r() * 16);
      if (Math.abs(x - sx) < 16 && Math.abs(y - sy) < 10) continue;
      if (HORA.estrellas && i % 3) continue;   // de noche, menos nubes
      nube(x, y, 10 + Math.floor(r() * 12));
    }
    // colinas lejanas y cercanas
    for (x = 0; x < W; x++) {
      var h1 = Math.round(5 + Math.sin(x * 0.045) * 3 + Math.sin(x * 0.11 + 1) * 1.5);
      px(x, G - h1 - 3, tono("#8fd07c"), 1, h1 + 3);
      var h2 = Math.round(2 + Math.sin(x * 0.08 + 2) * 2 + Math.sin(x * 0.19) * 1);
      if (h2 > 0) px(x, G - h2, tono("#6cbf58"), 1, h2);
    }
    // árboles pequeños sobre las colinas
    for (i = 0; i < Math.ceil(W / 70); i++) {
      x = 4 + Math.floor(r() * (W - 8)); y = G - 7 - Math.floor(r() * 3);
      px(x + 1, y + 3, tono("#6b4425"), 1, 3); px(x, y, tono("#3f8f3f"), 3, 3); px(x + 1, y - 1, tono("#3f8f3f")); px(x, y, tono("#5fae4d"));
    }
    // pasto con matas y flores
    for (x = 0; x < W; x++) {
      px(x, G, tono(r() < 0.5 ? "#7ed957" : "#6cc24a")); px(x, G + 1, tono("#5bb04a")); px(x, G + 2, tono(r() < 0.5 ? "#4a9a3c" : "#5bb04a"));
      px(x, G + 3, tono("#3f8a35"), 1, 2); px(x, G + 5, r() < 0.55 ? tono("#3f8a35") : "#6b4425", 1, 1);
      if (r() < 0.3) px(x, G - 1, tono("#6cc24a"));
      if (r() < 0.08) px(x, G - 2, tono("#7ed957"));
      if (r() < 0.035) { px(x, G - 2, tono(["#ffffff", "#ffcf3f", "#f28fb8", "#b48cff"][Math.floor(r() * 4)])); px(x, G - 1, tono("#3f8a35")); }
    }

    // tierra por capas, como en el juego: cuanto más bajas en la página, más honda y rara la roca.
    // Cada capa es una franja que se repite a lo ancho; la última se repite hasta el fondo.
    var T = 128, BH = 100, tr = seeded("tierra-corgi");
    var PALS = [
      ["#9a6237", "#a36a3d", "#8f5a31", "#ad7446"],
      ["#87572f", "#95633a", "#784b27", "#8d5c33"],
      ["#6b6f7a", "#7a7e89", "#5b5f69", "#73777f"],
      ["#4a3f66", "#574a77", "#3d3356", "#514570"],
      ["#7a2a22", "#8e352b", "#64201a", "#83302a"],
      ["#2a2433", "#352e40", "#201b28", "#2f2939"]
    ];
    function band(k) {
      var c = pixelCanvas(T * PX, BH * PX), tp = c.px, pal = PALS[k], nx = PALS[k + 1];
      function wrap(a, b, col, w, h) {
        for (var yy = 0; yy < (h || 1); yy++) for (var xx = 0; xx < (w || 1); xx++) {
          var by = b + yy; if (by >= 0 && by < BH) tp((a + xx + T) % T, by, col);
        }
      }
      for (var yy = 0; yy < BH; yy += 2) for (var xx = 0; xx < T; xx += 2) {
        var q = tr();
        tp(xx, yy, pal[q < 0.55 ? 0 : q < 0.75 ? 1 : q < 0.92 ? 2 : 3], 2, 2);
        if (tr() < 0.25) tp(xx + (tr() < 0.5 ? 0 : 1), yy + (tr() < 0.5 ? 0 : 1), pal[Math.floor(tr() * 4)]);
      }
      [18, 52, 80].forEach(function (v0, vi) {
        for (var a = 0; a < T; a++) {
          var vy = v0 + Math.round(Math.sin(a * Math.PI * 2 / T + vi) * 2 + Math.sin(a * Math.PI * 4 / T + 1));
          wrap(a, vy, pal[2]); if (a % 3) wrap(a, vy + 1, pal[2]);
        }
      });
      var a, b2, m;
      function spots(n) { return Array.apply(null, Array(n)).map(function () { return [Math.floor(tr() * T), 3 + Math.floor(tr() * (BH - 12))]; }); }
      if (k <= 1) {
        spots(k ? 14 : 22).forEach(function (s2) {
          if (tr() < 0.5) wrap(s2[0], s2[1], k ? "#6e5440" : "#8a6a4f", 2, 1);
          else { wrap(s2[0], s2[1], "#7d838c", 3, 2); wrap(s2[0], s2[1], "#b9c1ca", 2, 1); }
        });
        spots(k ? 4 : 2).forEach(function (s2) {
          a = s2[0]; b2 = s2[1];
          wrap(a, b2, "#f1e7d0", 4, 1); wrap(a - 1, b2 - 1, "#f1e7d0"); wrap(a - 1, b2 + 1, "#f1e7d0"); wrap(a + 4, b2 - 1, "#f1e7d0"); wrap(a + 4, b2 + 1, "#f1e7d0");
        });
        if (!k) spots(3).forEach(function (s2) { for (m = 0; m < 5; m++) { wrap(s2[0], s2[1] + m, "#6b4425"); if (tr() < 0.4) s2[0] += tr() < 0.5 ? -1 : 1; } });
        if (k) spots(2).forEach(function (s2) { wrap(s2[0], s2[1], "#d9cbb0", 3, 1); wrap(s2[0], s2[1] + 1, "#d9cbb0"); wrap(s2[0] + 2, s2[1] + 1, "#d9cbb0"); wrap(s2[0], s2[1] + 2, "#d9cbb0", 3, 1); });
        spots(2).forEach(function (s2) { wrap(s2[0], s2[1], "#f6c12d", 2, 1); wrap(s2[0], s2[1], "#fff1a8"); });
      } else if (k === 2) {
        spots(10).forEach(function (s2) { for (m = 0; m < 4; m++) wrap(s2[0] + m, s2[1] + (m % 2), "#3f434c"); });
        spots(8).forEach(function (s2) { wrap(s2[0], s2[1], "#1f2126", 2, 2); wrap(s2[0] + 2, s2[1] + 1, "#1f2126"); });
        spots(5).forEach(function (s2) { wrap(s2[0], s2[1], "#d9e2ea", 2, 1); wrap(s2[0] + 1, s2[1] + 1, "#aab4bf", 2, 1); });
        spots(2).forEach(function (s2) { wrap(s2[0], s2[1], "#f6c12d", 2, 2); wrap(s2[0], s2[1], "#fff1a8"); });
      } else if (k === 3) {
        spots(9).forEach(function (s2) {
          var col = tr() < 0.5 ? ["#7fe3ff", "#d6f7ff", "#3ba6c9"] : ["#f28fd0", "#ffd9f1", "#b34f93"];
          wrap(s2[0] + 1, s2[1], col[0]); wrap(s2[0], s2[1] + 1, col[0], 3, 1); wrap(s2[0] + 1, s2[1] + 2, col[2]); wrap(s2[0] + 1, s2[1] + 1, col[1]);
        });
        spots(8).forEach(function (s2) { wrap(s2[0], s2[1], "#2f2847", 3, 1); });
      } else if (k === 4) {
        spots(10).forEach(function (s2) {
          if (tr() < 0.6) { wrap(s2[0], s2[1], "#ff8a2a", 4, 1); wrap(s2[0] + 1, s2[1] + 1, "#ff8a2a", 3, 1); wrap(s2[0] + 1, s2[1], "#ffe066", 2, 1); }
          else wrap(s2[0], s2[1], "#3a100c", 2, 1);
        });
      } else {
        spots(8).forEach(function (s2) { wrap(s2[0], s2[1], "#6f5aa8", 1, 3); wrap(s2[0] + 1, s2[1] + 1, "#a892e6"); wrap(s2[0] - 1, s2[1] + 2, "#17121d", 3, 1); });
        spots(6).forEach(function (s2) { wrap(s2[0], s2[1], "#ffe066", 1, 1); });
      }
      // borde ondulado hacia la capa siguiente
      if (nx) {
        for (a = 0; a < T; a++) {
          var e = BH - 6 + Math.round(Math.sin(a * Math.PI * 2 / T) * 2 + Math.sin(a * Math.PI * 4 / T + 1));
          for (m = e; m < BH; m++) { var q2 = tr(); tp(a, m, nx[q2 < 0.6 ? 0 : q2 < 0.85 ? 1 : 3]); }
          tp(a, e, nx[2]); tp(a, e - 1, pal[2]);
        }
      }
      return c.cv.toDataURL();
    }

    var y0 = SKY_H + GRASS_H, imgs = ["url(" + top.cv.toDataURL() + ")"], reps = ["no-repeat"], poss = ["top center"];
    for (i = 0; i < PALS.length; i++) {
      imgs.push("url(" + band(i) + ")");
      var last = i === PALS.length - 1;
      reps.push(last ? "repeat" : "repeat-x");
      poss.push("0 " + (y0 + i * BH * PX) + "px");
    }
    var b = document.body.style;
    b.backgroundImage = imgs.join(", ");
    b.backgroundRepeat = reps.join(", ");
    b.backgroundPosition = poss.join(", ");
    b.backgroundColor = PALS[PALS.length - 1][0];
  }

  var rz = null;
  window.addEventListener("resize", function () {
    clearTimeout(rz);
    rz = setTimeout(function () { paintBackdrop(); stickSide(); if (G && $("strata")) paintWorld(); }, 200);
  });

  aplicarHora();
  try { paintBackdrop(); } catch (e) { /* si falla, queda el fondo de styles.css */ }
  // si cambia el momento del día mientras juegas (por ejemplo, anochece), se repinta el cielo
  setInterval(function () {
    if (HORAS[momento()] === HORA) return;
    aplicarHora();
    try { paintBackdrop(); if (G && $("strata")) paintWorld(); } catch (e) { /* se queda el cielo anterior */ }
  }, 60000);
  window.CorgiCava = { home: home, start: start, state: function () { return G; } };
  home();
})();
