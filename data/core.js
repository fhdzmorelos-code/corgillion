// Registro de categorías y comparación de respuestas.
// Cada consigna es: ["texto", nivel0, nivel1, nivel2, nivel3, nivel4, nivel5]
// Cada nivel es una lista separada por ";" y los alias de una respuesta van con "/".
// Nivel 0 = la respuesta más obvia (Tierrita), nivel 5 = la más rara (Hueso de Oro).
(function (root) {
  "use strict";

  var STOP = {};
  ("el la los las un una the de del y and of oceano mar rio monte volcan desierto " +
    "isla islas lago vitamina").split(" ").forEach(function (w) { STOP[w] = 1; });

  function toks(s) {
    return String(s).toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/\+/g, " plus ").replace(/#/g, " sharp ").replace(/&/g, " y ")
      .replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  }

  function norm(s) {
    var t = toks(s), f = t.filter(function (x) { return !STOP[x]; });
    return (f.length ? f : t).join("");
  }

  function digits(s) { return s.replace(/[^0-9]/g, ""); }
  function romano(s) { var m = s.match(/(?:iii|ii|iv|viii|vii|vi|ix|xiii|xii|xi)$/); return m ? m[0] : ""; }

  // Distancia de Damerau-Levenshtein (cuenta letras intercambiadas como un solo error).
  function dist(a, b) {
    var m = a.length, n = b.length, i, j, d = [];
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 0; j <= n; j++) { d[0][j] = j; }
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        var c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[m][n];
  }

  var cats = {}, order = [];

  // Convierte una fila ["consigna", n0..n5] en la lista de respuestas con sus claves.
  function build(row) {
      var answers = [];
      for (var t = 0; t < 6; t++) {
        String(row[t + 1] || "").split(";").forEach(function (item) {
          item = item.trim();
          if (!item) return;
          var al = item.split("/").map(function (x) { return x.trim(); }).filter(Boolean);
          var keys = [], tk = {};
          al.forEach(function (x) {
            var k = norm(x);
            if (k && keys.indexOf(k) < 0) keys.push(k);
            // "Tiempos violentos (1994)" también vale sin el año
            var sin = /\s\(\d{4}\)$/.test(x) ? norm(x.replace(/\s\(\d{4}\)$/, "")) : "";
            if (sin && keys.indexOf(sin) < 0) keys.push(sin);
            toks(x).forEach(function (w) {
              if (w.length >= 4 && !STOP[w] && !/^\d+$/.test(w)) tk[w] = 1;
            });
          });
          answers.push({ name: al[0], keys: keys, toks: Object.keys(tk), tier: t });
        });
      }
      return answers;
  }

  function add(id, meta, rows) {
    var prompts = rows.map(function (row, pi) {
      var answers = build(row);
      // since: fecha (AAAA-MM-DD) desde la que la consigna existe en el juego; sin fecha, siempre
      return { id: id + ":" + row[0], cat: id, q: row[0], answers: answers, since: (meta && meta.since) || null };
    });
    if (cats[id]) {
      cats[id].prompts = cats[id].prompts.concat(prompts);
      // si la categoría la creó antes un bloque diario (sin nombre), aquí recibe su nombre, color y descripción
      if (meta && meta.name) { var extra = Object.assign({}, meta); delete extra.since; Object.assign(cats[id], extra); }
      return;
    }
    var info = Object.assign({}, meta);
    delete info.since;
    cats[id] = Object.assign({ id: id, prompts: prompts }, info);
    order.push(id);
  }

  // Diccionario inglés -> español: "cow=vaca;turkey=pavo|turquía".
  var EN = {};
  function english(str) {
    str.split(";").forEach(function (pair) {
      var i = pair.indexOf("=");
      if (i > 0) EN[norm(pair.slice(0, i))] = pair.slice(i + 1).split("|");
    });
  }

  // Devuelve {a, fixed, en} o null. Si no hay coincidencia, prueba traduciendo del inglés.
  function match(p, raw) {
    var m = find(p, raw), n = norm(raw), opts = EN[n] || EN[n.replace(/s$/, "")];
    if (m || !opts) return m;
    for (var i = 0; i < opts.length; i++) {
      m = find(p, opts[i]);
      if (m) { m.en = true; m.fixed = false; return m; }
    }
    return null;
  }

  // Primero coincidencia exacta; si no, la más cercana del banco.
  function find(p, raw) {
    var n = norm(raw), i, j, a;
    if (!n) return null;
    for (i = 0; i < p.answers.length; i++) {
      if (p.answers[i].keys.indexOf(n) >= 0) return { a: p.answers[i], fixed: false };
    }
    var max = n.length < 4 ? 0 : n.length < 6 ? 1 : n.length < 10 ? 2 : 3;
    // en consignas con miles de respuestas casi cualquier error de dedo cae en otro título: se tolera un error menos
    var grande = p.answers.length > 1500;
    if (grande && max) { max--; }
    var best = null, bd = 99, nd = digits(n);
    if (max) {
      for (i = 0; i < p.answers.length; i++) {
        a = p.answers[i];
        for (j = 0; j < a.keys.length; j++) {
          var k = a.keys[j];
          // una respuesta de 3 letras o menos se escribe exacta: "león" no puede convertirse en "Leo"
          if (k.length < 4 || digits(k) !== nd || Math.abs(k.length - n.length) > max) continue;
          // en listas enormes: nada de caer en títulos raros ni confundir "Street Fighter II" con "VI"
          if (grande && (a.tier > 2 || romano(k) !== romano(n))) continue;
          var d = dist(n, k);
          if (d <= max && (d < bd || (d === bd && a.tier < best.tier))) { bd = d; best = a; }
        }
      }
    }
    if (best) return { a: best, fixed: true };

    // Una sola palabra de la respuesta ("chihiro" -> "El viaje de Chihiro"), si no es ambigua.
    var hits;
    // En consignas enormes solo se buscan entre las respuestas conocidas (niveles 0 y 1):
    // "tarantino" -> Quentin Tarantino, pero "titanic" no cae en un título raro que contenga esa palabra.
    if (n.length >= 4 && !/^\d+$/.test(n)) {
      var tmax = n.length >= 7 ? 1 : 0;
      hits = p.answers.filter(function (x) {
        return (!grande || x.tier <= 1) && x.toks.some(function (t) {
          return t === n || (tmax && Math.abs(t.length - n.length) <= 1 && dist(t, n) <= tmax);
        });
      });
      if (hits.length === 1) return { a: hits[0], fixed: true };
    }
    // Inicio de la respuesta ("breath of the" -> "Breath of the Wild"), si no es ambiguo.
    if (n.length >= 5) {
      hits = p.answers.filter(function (x) {
        return x.keys.some(function (k2) { return k2.indexOf(n) === 0 && digits(k2) === nd; });
      });
      if (hits.length === 1) return { a: hits[0], fixed: true };
    }
    return null;
  }

  // Qué tanto se parece lo escrito a una clave (0 = nada). Más estricto que match: aquí nadie pudo revisar antes de enviar.
  function similitud(n, k) {
    if (n === k) return 1;
    if (n[0] !== k[0] || digits(n) !== digits(k)) return 0;
    var largo = Math.max(n.length, k.length);
    // palabra a medio escribir: "narut" -> "naruto", pero no "breat" -> "breathwild"
    if (k.indexOf(n) === 0) return n.length / largo >= 0.6 ? n.length / largo : 0;
    if (largo - Math.min(n.length, k.length) > largo * 0.2) return 0;
    // error de dedo: al menos 80% igual ("pera" no se vuelve "Perú")
    var s = 1 - dist(n, k) / largo;
    return s >= 0.8 ? s : 0;
  }

  // Para lo que quedó escrito al acabarse el tiempo: la respuesta exacta o, si no, la más parecida, solo si se parece de verdad.
  function matchFinal(p, raw) {
    var m = match(p, raw), n = norm(raw), grande = p.answers.length > 1500, mejor = null, ms = 0, hits = [], hs = 0;
    if (m && !m.fixed) return m;
    if (n.length < 4) return null;
    // Un apellido o palabra que comparten varias respuestas ("uzumaki") no dice cuál era.
    if (p.answers.filter(function (a) { return (!grande || a.tier <= 1) && a.toks.indexOf(n) >= 0; }).length > 1) return null;
    p.answers.forEach(function (a) {
      if (grande && a.tier > 2) return;
      a.keys.forEach(function (k) {
        if (grande && romano(k) !== romano(n)) return;
        var s = similitud(n, k);
        if (s > ms || (s && s === ms && a.tier < mejor.tier)) { ms = s; mejor = a; }
      });
    });
    if (mejor) return { a: mejor, fixed: true };
    // Una sola palabra de la respuesta ("tarantin" -> Quentin Tarantino), solo si no es ambigua.
    p.answers.forEach(function (a) {
      if (grande && a.tier > 1) return;
      var s = a.toks.reduce(function (x, t) { return Math.max(x, similitud(n, t)); }, 0);
      if (s > hs) { hs = s; hits = [a]; } else if (s && s === hs) { hits.push(a); }
    });
    return hits.length === 1 ? { a: hits[0], fixed: true } : null;
  }

  root.CC = { add: add, build: build, cats: cats, order: order, match: match, matchFinal: matchFinal, norm: norm, english: english, EN: EN };
})(typeof window !== "undefined" ? window : globalThis);
