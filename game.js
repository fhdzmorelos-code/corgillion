(function () {
  "use strict";

  var GAME_NAME = "CORGILLION";
  var CC = window.CC, Corgi = window.Corgi;
  var app = document.getElementById("app");

  var TIERS = [
    { n: "Tierrita", p: 10, s: 2, say: "Solo tierrita…" },
    { n: "Piedrita", p: 20, s: 3, say: "Una piedrita." },
    { n: "Hueso", p: 35, s: 5, say: "¡Un hueso!" },
    { n: "Fósil", p: 60, s: 8, say: "¡Un fósil!" },
    { n: "Tesoro", p: 80, s: 11, say: "¡Un tesoro!" },
    { n: "Hueso de Oro", p: 100, s: 15, say: "¡¡HUESO DE ORO!!" }
  ];
  // Ícono pixelado de cada categoría (ver Corgi.icon).
  var CAT_ICON = { clasica: "trofeo", pokemon: "pokeball", deportes: "balon" };
  function catIcon(id, size) { return CAT_ICON[id] ? Corgi.icon(CAT_ICON[id], size) : ""; }
  var QTIME = 25, RUN = 7, CLOCK = 45, FULL = 7000, SKIP_PEN = 5;
  var PX = 4, GROUND = 300, PXM = 0.26, DOG = 72;

  var MODES = {
    diario: { n: "Diario", d: "7 consignas, las mismas para todos hoy. Un solo intento.", finite: true },
    clasico: { n: "Libre", d: "7 consignas al azar que cambian en cada intento.", finite: true },
    sinfinal: { n: "Sin final", d: "Consignas sin parar. Cava hasta que te retires.", finite: false },
    contra: { n: "Contrarreloj", d: "0:45 en el reloj. Lo raro suma hasta +15 s; pasar resta 5 s.", finite: false }
  };

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- guardado ----------
  var KEY = "corgicava.v2";
  var save = { corgi: 0, best: {}, daily: {} };
  try { Object.assign(save, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* sin guardado */ }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* sin guardado */ } }
  SFX.setOn(save.sound !== false);

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
  function meters(pts) { return Math.round(pts * 10).toLocaleString("es-MX") + " m"; }
  function bestOf(cat, mode) { return (save.best[cat] || {})[mode] || 0; }
  function chip(t) {
    return t < 0 ? '<span class="chip t-x">Nada</span>'
      : '<span class="chip t-' + t + '">' + Corgi.item(t, 18) + TIERS[t].n + "</span>";
  }
  function show(html) {
    app.innerHTML = html;
    app.classList.remove("enter"); void app.offsetWidth; app.classList.add("enter");
    window.scrollTo(0, 0);
  }

  // ---------- inicio ----------
  var G = null, timer = null;

  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  function home() {
    stopTimer(); G = null;
    var v = Corgi.variants[save.corgi], t = today();
    var picks = Corgi.variants.map(function (x, i) {
      return '<button class="pick' + (i === save.corgi ? " on" : "") + '" data-corgi="' + i +
        '" title="' + esc(x.desc) + '">' + Corgi.svg(i, 48) + "<span>" + esc(x.name) + "</span></button>";
    }).join("");
    var cats = CC.order.map(function (id) {
      var c = CC.cats[id], d = save.daily[id];
      var modes = Object.keys(MODES).map(function (m) {
        var extra;
        if (m === "diario") {
          if (d && d.date === t && d.done) extra = "Hoy: " + meters(d.score);
          else if (d && d.date === t) extra = "En curso";
          else if (Online.enabled && !save.player) extra = "Pide entrar";
          else extra = "Nuevo hoy";
        } else {
          extra = bestOf(id, m) ? "Récord " + meters(bestOf(id, m)) : "Sin récord";
        }
        return '<button class="mode" data-cat="' + id + '" data-mode="' + m + '">' +
          '<span class="mode-n">' + MODES[m].n + '</span><span class="mode-d">' + MODES[m].d +
          '</span><span class="mode-x">' + extra + "</span></button>";
      }).join("");
      return '<section class="panel catbox" style="--c:' + c.color + '"><div class="cat-head"><h2>' + catIcon(id, 28) + "<span>" + esc(c.name) + "</span>" +
        "</h2><p>" + esc(c.desc) + '</p></div><div class="modegrid">' + modes + "</div></section>";
    }).join("");
    var legend = TIERS.map(function (x, i) {
      return "<tr><td>" + chip(i) + "</td><td>" + x.p + " pts</td><td>" + x.p * 10 + " m</td><td>+" + x.s + " s</td></tr>";
    }).join("");

    show(
      '<header class="logo"><h1>' + Corgi.item(2, 44, "logo-deco") + "<span>" + GAME_NAME + "</span>" + Corgi.item(5, 44, "logo-deco flip") + "</h1><p>Cuanto más rara tu respuesta, más hondo cava tu corgi.</p></header>" +
      '<main class="home"><div class="col">' +
      '<section class="panel kennel"><h2>Tu corgi</h2>' +
      '<div class="bubble">¡Guau! Soy ' + esc(v.name) + ". ¿Cavamos?</div>" +
      '<div class="stage">' + Corgi.svg(save.corgi, 192, "idle") + '<div class="mound"></div></div>' +
      '<p class="vdesc">' + esc(v.desc) + '</p><div class="picks">' + picks + "</div></section>" + whoPanel() +
      '<section class="panel how"><h2>Cómo se juega</h2>' +
      "<p>Cada consigna pide nombrar algo y tiene muchas respuestas válidas. Las obvias valen poco; las que casi nadie diría, mucho. " +
      "Si escribes con erratas, el corgi toma la respuesta más parecida de su lista. También entiende respuestas en inglés.</p>" +
      "<table><tr><th>Hallazgo</th><th>Puntos</th><th>Cava</th><th>Reloj</th></tr>" + legend + "</table></section>" +
      '</div><div class="col">' + cats + "</div></main>"
    );
    flush();
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
    var sky = ["#2f86f0", "#3f97f7", "#55a9fc", "#6db9ff", "#88c9ff", "#a6d9ff"];
    for (y = 0; y < G0; y++) px(0, y, sky[Math.min(5, Math.floor(y / (G0 / 6)))], W, 1);
    x = W - 60; px(x, 34, "#fff3a0", 8, 8); px(x + 2, 32, "#fff3a0", 4, 12); px(x - 2, 36, "#fff3a0", 12, 4);
    for (i = 0; i < Math.ceil(W / 40); i++) {
      x = Math.floor(r() * W); y = 30 + Math.floor(r() * 30); n = 8 + Math.floor(r() * 10);
      px(x, y, "#ffffff", n, 2); px(x + 2, y - 1, "#ffffff", n - 5, 1); px(x + 1, y + 2, "#e6f5ff", n - 3, 1);
    }
    // colinas y arbolitos en el horizonte
    for (x = 0; x < W; x++) {
      var hh1 = Math.round(5 + Math.sin(x * 0.045) * 3 + Math.sin(x * 0.11 + 1) * 1.5);
      px(x, G0 - hh1 - 3, "#8fd07c", 1, hh1 + 3);
      var hh2 = Math.round(2 + Math.sin(x * 0.08 + 2) * 2 + Math.sin(x * 0.19) * 1);
      if (hh2 > 0) px(x, G0 - hh2, "#6cbf58", 1, hh2);
    }
    for (i = 0; i < Math.ceil(W / 60); i++) {
      x = 4 + Math.floor(r() * (W - 8)); y = G0 - 8 - Math.floor(r() * 3);
      px(x + 1, y + 3, "#6b4425", 1, 3); px(x, y, "#3f8f3f", 3, 3); px(x + 1, y - 1, "#3f8f3f"); px(x, y, "#5fae4d");
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
      px(x, G0, r() < 0.5 ? "#6cc24a" : "#5bb04a"); px(x, G0 + 1, "#4a9a3c"); px(x, G0 + 2, r() < 0.6 ? "#3f8a35" : "#5d3b1e");
      if (r() < 0.25) px(x, G0 - 1, "#6cc24a");
      if (r() < 0.04) { px(x, G0 - 2, ["#ffffff", "#ffcf3f", "#f28fb8"][Math.floor(r() * 3)]); px(x, G0 - 1, "#3f8a35"); }
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
      deck = shuffle(p);
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
      '<header class="hud"><button class="btn ghost" data-go="quit">' + (fin ? "Salir" : "Retirarse") + "</button>" +
      '<div class="trailbox"><div class="hud-title" style="--c:' + c.color + '">' + catIcon(G.cat, 16) + esc(c.name) + " · " + MODES[G.mode].n +
      '</div><div class="trail" id="trail"></div></div>' +
      '<div class="depth"><b id="dnum">0 m</b><span id="dpts">0 pts</span></div></header>' +
      '<section class="ask"><div class="timer"><div class="timer-fill" id="tfill"></div><span class="timer-txt" id="ttxt"></span></div>' +
      '<div class="q" id="q"></div><div id="zone"></div></section>'
    );
    paintWorld();
    G.results.forEach(function (r, i) { if (r.tier >= 0) relic(r.tier, cumul(i + 1), i); });
    drawShaft(); drawDepth(G.score); ask();
  }

  function dot(r, fresh) {
    return '<i class="dot done ' + (fresh ? "fresh " : "") + (r.tier < 0 ? "t-x" : "t-" + r.tier) + '" title="' +
      esc((r.ans || "Sin respuesta") + " — " + (r.tier < 0 ? "nada" : TIERS[r.tier].n) + " — " + r.q) + '">' +
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

  function ask() {
    var p = G.deck[G.idx];
    G.phase = "ask"; G.qLeft = QTIME; G.last = performance.now(); G.lastTick = 0;
    drawTrail();
    var q = $("q");
    q.textContent = p.q;
    q.classList.remove("in"); void q.offsetWidth; q.classList.add("in");
    $("zone").innerHTML =
      '<form id="form" autocomplete="off"><input id="ans" type="text" maxlength="60" spellcheck="false" ' +
      'placeholder="Escribe tu respuesta" aria-label="Tu respuesta">' +
      '<button class="btn" type="submit">Cavar</button></form>' +
      '<div class="fb" id="fb">Piensa en algo que casi nadie diría.</div>' +
      '<button class="btn ghost small" data-go="skip">Pasar esta consigna' + (G.mode === "contra" ? " (-" + SKIP_PEN + " s)" : "") + "</button>";
    $("ans").focus();
    $("digger").className = "digger";
    drawTimer();
  }

  function tick() {
    if (!G || G.phase !== "ask") return;
    var now = performance.now(), dt = (now - G.last) / 1000;
    G.last = now;
    if (G.mode === "contra") {
      G.clock -= dt;
      if (G.clock <= 0) { G.clock = 0; drawTimer(); return finish(); }
    } else {
      G.qLeft -= dt;
      if (G.qLeft <= 0) { G.qLeft = 0; drawTimer(); return resolve(null, "Se acabó el tiempo"); }
    }
    var left = G.mode === "contra" ? G.clock : G.qLeft, lim = G.mode === "contra" ? 10 : 5, sec = Math.ceil(left);
    if (left <= lim && sec !== G.lastTick) { G.lastTick = sec; SFX.tick(); }
    drawTimer();
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
      fb.textContent = "«" + raw + "» no está en mi lista. Prueba otra.";
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
    G.results.push(r); G.score += r.pts;
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
      $("zone").innerHTML = '<div class="digging">' + esc(raw) + "…</div>";
      return setTimeout(function () { if (G === g) reveal(r); }, reduce ? 0 : 550);
    }
    // 1) el corgi se clava y cava  2) baja por el túnel  3) sale con lo que encontró
    $("zone").innerHTML = '<div class="digging"><span>Cavando</span><i></i><i></i><i></i></div>';
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
      found.innerHTML = Corgi.item(tier, 60) + "<b>" + t.say + "</b>" + (tier >= 3 ? "<s></s><s></s><s></s><s></s>" : "");
      relic(tier, G.score, G.results.length - 1);
      reveal(r);
    }, reduce ? 0 : 1100);
  }

  function reveal(r) {
    var m = r.tier >= 0, t = TIERS[r.tier];
    G.phase = "reveal";
    var last = MODES[G.mode].finite && G.idx + 1 >= G.deck.length;
    var head = m
      ? '<div class="rv-ans">' + esc(r.ans) + "</div>" +
        (r.typed ? '<div class="rv-fix">Escribiste «' + esc(r.typed) + "»; lo tomé como «" + esc(r.ans) + "».</div>" : "") +
        (r.en ? '<div class="rv-fix">«' + esc(r.en) + "» en español es «" + esc(r.ans) + "».</div>" : "") +
        '<div class="rv-row">' + chip(r.tier) + '<span class="rv-pts">+' + r.pts + " pts · baja " + r.pts * 10 + " m" +
        (G.mode === "contra" ? " · +" + t.s + " s" : "") + "</span></div>"
      : '<div class="rv-ans miss">' + esc(r.why) + '</div><div class="rv-row">' + chip(-1) +
        '<span class="rv-pts">+0 pts' + (r.pen ? " · -" + r.pen + " s" : "") + "</span></div>";
    $("zone").innerHTML =
      '<div class="reveal ' + (m ? "t-" + r.tier : "t-x") + '">' + head + "</div>" +
      '<button class="btn" id="next" data-go="next">' + (last ? "Ver resultado" : "Siguiente") + "</button>";
    $("next").focus();
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
      G.deck = G.deck.concat(shuffle(pool(G.cat)));
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
    var c = CC.cats[o.cat];
    return GAME_NAME + " - " + c.name + " - " + MODES[o.mode].n + (o.mode === "diario" ? " " + (o.fecha || today()) : "") + "\n" +
      o.results.map(function (r, i) { return (i + 1) + ". " + (r.tier < 0 ? "nada" : TIERS[r.tier].n); }).join("\n") + "\n" +
      "Cavé " + meters(o.score) + " (" + o.score + " pts)";
  }

  var shown = null;
  function results(o) {
    stopTimer(); shown = o;
    var c = CC.cats[o.cat], fin = MODES[o.mode].finite;
    var hits = o.results.filter(function (r) { return r.tier >= 0; }).length;
    var avg = hits ? o.score / hits : 0;
    if (!o.stored) SFX.done(hits > 0, !!o.record);
    var say = !hits ? "Hoy no encontré nada… ¡otra vez!"
      : avg >= 75 ? "¡GUAU! ¡Puro tesoro enterrado!"
      : avg >= 45 ? "¡Buen hoyo! Olí cosas muy raras."
      : "Cavé un poco. La próxima, algo más raro.";
    var rows = o.results.map(function (r, i) {
      return '<tr style="--i:' + i + '"><td>' + esc(r.q) + "</td><td>" + esc(r.ans || "—") + "</td><td>" +
        chip(r.tier) + "</td><td>+" + r.pts + "</td></tr>";
    }).join("");
    var haul = o.results.filter(function (r) { return r.tier >= 0; }).map(function (r, i) {
      return '<span style="--i:' + i + '">' + Corgi.item(r.tier, 40) + "</span>";
    }).join("");
    show(
      '<header class="bar"><button class="btn ghost" data-go="home">Inicio</button>' +
      '<h1 style="--c:' + c.color + '">' + catIcon(o.cat, 22) + esc(c.name) + " · " + MODES[o.mode].n + "</h1><span></span></header>" +
      '<main class="results">' +
      '<section class="panel score"><div class="stage">' + Corgi.svg(save.corgi, 168, hits ? "happy" : "sadloop") +
      '<div class="mound"></div></div><div><div class="bubble">' + say + "</div>" +
      '<div class="big" id="big">0 m</div><div class="haul">' + haul + "</div>" +
      '<div class="sub">' + o.score + " pts · " + hits + " de " + o.results.length + " consignas" +
      (fin ? " · máximo " + meters(700) : "") + (o.record ? ' · <b class="rec">NUEVO RÉCORD</b>' : "") + "</div>" +
      (o.mode === "diario" ? '<div class="sub">Vuelve mañana por un diario nuevo.</div>' : "") +
      '<div class="acts">' +
      (o.mode !== "diario" ? '<button class="btn" data-go="again">Jugar de nuevo</button>' : "") +
      '<button class="btn alt" data-go="share">Copiar resultado</button></div></div></section>' +
      '<section class="panel"><h2>Tu excavación</h2>' +
      (rows ? '<table class="rt"><tr><th>Consigna</th><th>Tu respuesta</th><th>Hallazgo</th><th>Pts</th></tr>' + rows + "</table>" : "<p>No respondiste ninguna consigna.</p>") +
      "</section></main>"
    );
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
    function ok() { btn.textContent = "Copiado"; }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); ok(); } catch (e) { btn.textContent = "No se pudo copiar"; }
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
      '<header class="bar"><button class="btn ghost" data-go="home">Inicio</button>' +
      '<h1 style="--c:#f6c12d">' + esc(title) + "</h1><span></span></header>" +
      '<main class="login"><section class="panel">' + inner + "</section></main>"
    );
  }
  function wait(text) { panelPage("Un momento", '<p class="big-note">' + esc(text) + "</p>"); }
  function problem(text, retry) {
    retryFn = retry;
    panelPage("Sin conexión", "<p>" + esc(text) + '</p><div class="acts"><button class="btn" data-go="retry">Reintentar</button>' +
      '<button class="btn ghost" data-go="home">Volver</button></div>');
  }

  function whoPanel() {
    if (!Online.enabled) return "";
    return '<section class="panel who"><h2>Jugador</h2>' + (save.player
      ? '<p class="whoami">Juegas como <b>' + esc(save.player.apodo) + '</b></p><div class="acts">' +
        '<button class="btn" data-go="board">Tabla de posiciones</button>' +
        '<button class="btn ghost small" data-go="logout">Cambiar</button></div>'
      : "<p>Entra con un apodo y un PIN para jugar el diario y aparecer en la tabla.</p><div class=\"acts\">" +
        '<button class="btn" data-go="login">Entrar</button><button class="btn ghost" data-go="board">Ver tabla</button></div>') +
      "</section>";
  }

  function loginScreen(after, note) {
    loginAfter = after;
    panelPage("Jugador",
      "<h2>Tu apodo y tu PIN</h2>" +
      "<p>Si el apodo es nuevo, se crea con ese PIN. Si ya existe, tienes que poner el mismo PIN. " +
      "El PIN sirve para que nadie más use tu nombre; no lo compartas.</p>" +
      '<form id="loginform" class="lform" autocomplete="off">' +
      '<label>Apodo<input id="lnick" type="text" maxlength="20" spellcheck="false" placeholder="2 a 20 caracteres"></label>' +
      '<label>PIN<input id="lpin" type="password" maxlength="12" placeholder="4 a 12 caracteres"></label>' +
      '<button class="btn" type="submit">Entrar</button></form>' +
      '<div class="fb' + (note ? " bad" : "") + '" id="lerr">' + esc(note || "") + "</div>");
    var n = $("lnick"); if (n) n.focus();
  }

  var LOGIN_ERR = {
    apodo: "El apodo debe tener de 2 a 20 caracteres: letras, números, punto, guion o guion bajo.",
    pin_formato: "El PIN debe tener entre 4 y 12 caracteres.",
    apodo_parecido: "Ya existe un apodo igual pero con otras mayúsculas o minúsculas. Escríbelo tal cual.",
    pin: "Ese apodo ya existe y el PIN no coincide."
  };

  function doLogin() {
    var nick = $("lnick").value.trim(), pin = $("lpin").value, err = $("lerr");
    if (!nick || !pin) { err.className = "fb bad"; err.textContent = "Escribe tu apodo y tu PIN."; return; }
    err.className = "fb"; err.textContent = "Entrando…";
    Online.entrar({ apodo: nick, pin: pin }).then(function (r) {
      if (!r.ok) { err.className = "fb bad"; err.textContent = LOGIN_ERR[r.error] || "No se pudo entrar."; return; }
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
      err.className = "fb bad"; err.textContent = "No pude conectar con el servidor. Revisa tu conexión.";
    });
  }

  // Empezar una partida. El diario, con conexión, pasa antes por el servidor, que lleva la cuenta de quién ya lo jugó.
  function begin(cat, mode) {
    if (mode !== "diario" || !Online.enabled) return start(cat, mode);
    if (!save.player) return loginScreen(function () { begin(cat, mode); }, "Para jugar el diario necesitas entrar.");
    var again = function () { begin(cat, mode); };
    wait("Consultando el diario de hoy…");
    Online.fecha().then(function (fecha) {
      var d = save.daily[cat];
      if (d && d.date === fecha) return start(cat, "diario", fecha);
      return Online.iniciar(save.player, cat).then(function (r) {
        if (r.ok) return start(cat, "diario", String(r.fecha || fecha).slice(0, 10));
        if (r.error === "pin") { save.player = null; persist(); return loginScreen(again, "El PIN ya no coincide. Entra otra vez."); }
        if (r.error === "ya_jugado") return playedScreen(cat, r);
        return problem("No se pudo empezar el diario (" + r.error + ").", again);
      });
    }).catch(function () {
      problem("No hay conexión con el servidor. El diario la necesita para llevar la cuenta de quién ya lo jugó.", again);
    });
  }

  function playedScreen(cat, r) {
    panelPage("Diario de hoy",
      "<h2>Ya jugaste este diario</h2><p>" + (r.terminado
        ? "Tu resultado de hoy en " + esc(CC.cats[cat].name) + " fue de <b>" + meters(r.puntos || 0) + "</b>."
        : "Ya empezaste el diario de hoy en " + esc(CC.cats[cat].name) + " (quizá en otro dispositivo) y cuenta como jugado.") +
      "</p><p>Vuelve mañana por uno nuevo. Mientras tanto puedes jugar los otros modos.</p>" +
      '<div class="acts"><button class="btn" data-go="board">Ver la tabla</button>' +
      '<button class="btn ghost" data-go="home">Inicio</button></div>');
  }

  var BOARD_MODES = [["diario", "Hoy"], ["clasico", "Libre"], ["sinfinal", "Sin final"], ["contra", "Contrarreloj"]];
  function board() {
    var tok = ++boardTok, v = boardView, me = save.player && save.player.apodo;
    var cats = CC.order.map(function (id) {
      return '<button class="tab' + (id === v.cat ? " on" : "") + '" data-bcat="' + id + '">' + esc(CC.cats[id].name) + "</button>";
    }).join("");
    var modes = BOARD_MODES.map(function (m) {
      return '<button class="tab' + (m[0] === v.modo ? " on" : "") + '" data-bmode="' + m[0] + '">' + m[1] + "</button>";
    }).join("");
    show(
      '<header class="bar"><button class="btn ghost" data-go="home">Inicio</button>' +
      '<h1 style="--c:#f6c12d">Tabla de posiciones</h1><span></span></header>' +
      '<main class="login"><section class="panel"><div class="tabs">' + cats + '</div><div class="tabs">' + modes +
      '</div><div id="boardbody" class="boardbody"><p>Cargando…</p></div></section></main>'
    );
    if (!Online.enabled) { $("boardbody").innerHTML = "<p>La tabla en línea todavía no está conectada.</p>"; return; }
    var req = v.modo === "diario" ? Online.tablaDiaria(v.cat) : Online.tablaRecords(v.cat, v.modo);
    req.then(function (rows) {
      if (tok !== boardTok || !$("boardbody")) return;
      if (!rows.length) {
        $("boardbody").innerHTML = "<p>" + (v.modo === "diario" ? "Nadie ha terminado el diario de hoy todavía." : "Todavía no hay récords aquí.") + "</p>";
        return;
      }
      $("boardbody").innerHTML = '<table class="rank"><tr><th>#</th><th>Jugador</th><th>Profundidad</th><th>Puntos</th></tr>' +
        rows.map(function (r, i) {
          return '<tr class="' + (r.apodo === me ? "me" : "") + '" style="--i:' + i + '"><td>' + (i + 1) + "</td><td>" + esc(r.apodo) +
            "</td><td>" + meters(r.puntos) + "</td><td>" + r.puntos + "</td></tr>";
        }).join("") + "</table>";
    }).catch(function () {
      if (tok === boardTok && $("boardbody")) $("boardbody").innerHTML = "<p>No pude cargar la tabla. Revisa tu conexión.</p>";
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

  var muteBtn = $("mute");
  function paintMute() { muteBtn.textContent = "Sonido: " + (save.sound !== false ? "sí" : "no"); }
  muteBtn.addEventListener("click", function () {
    save.sound = save.sound === false;
    SFX.setOn(save.sound);
    persist(); paintMute(); SFX.click();
  });
  paintMute();


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
    var bands = ["#2a7ee8", "#3a90f3", "#4ba1fa", "#5fb2ff", "#76c2ff", "#91d1ff", "#afdfff"];
    for (y = 0; y < G; y++) px(0, y, bands[Math.min(bands.length - 1, Math.floor(y / (G / bands.length)))], W, 1);
    // sol con rayos
    var sx = W - 30, sy = 9;
    px(sx - 3, sy - 1, "#ffe066", 6, 8); px(sx - 4, sy, "#ffe066", 8, 6); px(sx - 2, sy, "#fff6b0", 3, 2);
    [[-7, 2, 2, 1], [5, 2, 2, 1], [0, -4, 1, 2], [0, 8, 1, 2], [-6, -3, 1, 1], [5, -3, 1, 1], [-6, 7, 1, 1], [5, 7, 1, 1]]
      .forEach(function (a) { px(sx + a[0], sy + a[1], "#ffd23f", a[2], a[3]); });
    // nubes
    function nube(a, b, w) {
      px(a + 2, b, "#ffffff", w - 4, 1); px(a + 1, b + 1, "#ffffff", w - 2, 1); px(a, b + 2, "#ffffff", w, 2);
      px(a + 3, b - 1, "#ffffff", Math.max(2, Math.floor(w / 3)), 1); px(a, b + 4, "#d7ecff", w, 1); px(a + 1, b + 5, "#bcdcf7", w - 2, 1);
    }
    for (i = 0; i < Math.ceil(W / 45); i++) {
      x = Math.floor(r() * (W - 20)); y = 4 + Math.floor(r() * 16);
      if (Math.abs(x - sx) < 16 && y < 18) continue;
      nube(x, y, 10 + Math.floor(r() * 12));
    }
    // colinas lejanas y cercanas
    for (x = 0; x < W; x++) {
      var h1 = Math.round(5 + Math.sin(x * 0.045) * 3 + Math.sin(x * 0.11 + 1) * 1.5);
      px(x, G - h1 - 3, "#8fd07c", 1, h1 + 3);
      var h2 = Math.round(2 + Math.sin(x * 0.08 + 2) * 2 + Math.sin(x * 0.19) * 1);
      if (h2 > 0) px(x, G - h2, "#6cbf58", 1, h2);
    }
    // árboles pequeños sobre las colinas
    for (i = 0; i < Math.ceil(W / 70); i++) {
      x = 4 + Math.floor(r() * (W - 8)); y = G - 7 - Math.floor(r() * 3);
      px(x + 1, y + 3, "#6b4425", 1, 3); px(x, y, "#3f8f3f", 3, 3); px(x + 1, y - 1, "#3f8f3f"); px(x, y, "#5fae4d");
    }
    // pasto con matas y flores
    for (x = 0; x < W; x++) {
      px(x, G, r() < 0.5 ? "#7ed957" : "#6cc24a"); px(x, G + 1, "#5bb04a"); px(x, G + 2, r() < 0.5 ? "#4a9a3c" : "#5bb04a");
      px(x, G + 3, "#3f8a35", 1, 2); px(x, G + 5, r() < 0.55 ? "#3f8a35" : "#6b4425", 1, 1);
      if (r() < 0.3) px(x, G - 1, "#6cc24a");
      if (r() < 0.08) px(x, G - 2, "#7ed957");
      if (r() < 0.035) { px(x, G - 2, ["#ffffff", "#ffcf3f", "#f28fb8", "#b48cff"][Math.floor(r() * 4)]); px(x, G - 1, "#3f8a35"); }
    }

    // tierra: una loseta que se repite sin costuras
    var T = 128, tile = pixelCanvas(T * PX, T * PX), tp = tile.px, tr = seeded("tierra-corgi");
    var tierra = ["#9a6237", "#a36a3d", "#8f5a31", "#ad7446"];
    for (y = 0; y < T; y += 2) for (x = 0; x < T; x += 2) {
      var q = tr();
      tp(x, y, tierra[q < 0.55 ? 0 : q < 0.75 ? 1 : q < 0.92 ? 2 : 3], 2, 2);
      if (tr() < 0.25) tp(x + (tr() < 0.5 ? 0 : 1), y + (tr() < 0.5 ? 0 : 1), tierra[Math.floor(tr() * 4)]);
    }
    function wrap(a, b, col, w, h) { for (var yy = 0; yy < (h || 1); yy++) for (var xx = 0; xx < (w || 1); xx++) tp((a + xx + T) % T, (b + yy + T) % T, col); }
    // vetas onduladas (periódicas para no cortar la loseta)
    [[17, "#86522b"], [58, "#7c4a27"], [99, "#86522b"]].forEach(function (v) {
      for (x = 0; x < T; x++) {
        var yy = v[0] + Math.round(Math.sin(x * Math.PI * 2 / T) * 2 + Math.sin(x * Math.PI * 4 / T + 1));
        wrap(x, yy, v[1]); if (x % 3) wrap(x, yy + 1, v[1]);
      }
    });
    // piedritas, huesitos y raíces
    for (i = 0; i < 26; i++) {
      x = Math.floor(tr() * T); y = Math.floor(tr() * T);
      if (tr() < 0.5) { wrap(x, y, "#8a6a4f", 2, 1); continue; }
      wrap(x, y, "#7d838c", 3, 2); wrap(x, y, "#b9c1ca", 2, 1); wrap(x + 1, y + 2, "#5d3b1e", 2, 1);
    }
    for (i = 0; i < 3; i++) {
      x = Math.floor(tr() * T); y = Math.floor(tr() * T);
      wrap(x, y, "#f1e7d0", 4, 1); wrap(x - 1, y - 1, "#f1e7d0"); wrap(x - 1, y + 1, "#f1e7d0"); wrap(x + 4, y - 1, "#f1e7d0"); wrap(x + 4, y + 1, "#f1e7d0");
    }
    for (i = 0; i < 3; i++) {
      x = Math.floor(tr() * T); y = Math.floor(tr() * T); n = 3 + Math.floor(tr() * 4);
      for (var k = 0; k < n; k++) { wrap(x, y + k, "#6b4425"); if (tr() < 0.4) x += tr() < 0.5 ? -1 : 1; }
    }
    for (i = 0; i < 3; i++) { x = Math.floor(tr() * T); y = Math.floor(tr() * T); wrap(x, y, "#f6c12d", 2, 1); wrap(x, y, "#fff1a8"); }

    var b = document.body.style;
    b.backgroundImage = "url(" + top.cv.toDataURL() + "), url(" + tile.cv.toDataURL() + ")";
    b.backgroundRepeat = "no-repeat, repeat";
    b.backgroundPosition = "top center, 0 " + (SKY_H + GRASS_H) + "px";
    b.backgroundColor = "#9a6237";
  }

  var rz = null;
  window.addEventListener("resize", function () {
    clearTimeout(rz);
    rz = setTimeout(function () { paintBackdrop(); if (G && $("strata")) paintWorld(); }, 200);
  });

  try { paintBackdrop(); } catch (e) { /* si falla, queda el fondo de styles.css */ }
  window.CorgiCava = { home: home, start: start, state: function () { return G; } };
  home();
})();
