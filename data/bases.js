// Consignas por REGLA de las bases grandes: cine y series, videojuegos y anime.
// Cada base trae dos archivos generados: *_nombres.js (títulos y personas) y *_reglas.js (por consigna, qué índices valen y en qué nivel).
// Las respuestas de cada consigna se arman solo la primera vez que se juega (hay consignas con más de 20 mil respuestas).
// Debe cargarse DESPUÉS de data/core.js, de las consignas escritas a mano y de los archivos de datos.
(function (root) {
  "use strict";
  var CC = root.CC, CAT = "clasica";
  if (!CC) { return; }

  function indices(s) {
    var out = [], x = 0;
    if (!s) { return out; }
    s.split(",").forEach(function (d) { x += parseInt(d, 36); out.push(x); });
    return out;
  }

  function fila(N, f) {
    var src = f[1] === "p" ? N.p : N.t;
    return [f[0]].concat(f.slice(2).map(function (s) {
      return indices(s).map(function (i) { return src[i]; }).join(";");
    }));
  }

  // answers se calcula al primer uso; si la consigna ya tenía respuestas, se conservan y se suman las nuevas
  function perezosa(pr, N, f, previas) {
    var cache = null;
    Object.defineProperty(pr, "answers", {
      configurable: true, enumerable: true,
      get: function () {
        if (cache) { return cache; }
        var nuevas = CC.build(fila(N, f));
        if (!previas) { cache = nuevas; return cache; }
        var base = typeof previas === "function" ? previas() : previas, claves = {};
        base.forEach(function (a) { a.keys.forEach(function (k) { claves[k] = 1; }); });
        cache = base.concat(nuevas.filter(function (a) { return !a.keys.some(function (k) { return claves[k]; }); }));
        return cache;
      },
      set: function (v) { cache = v; }
    });
  }

  ["CC_CINE", "CC_JUEGOS", "CC_ANIME"].forEach(function (nombre) {
    var N = root[nombre], R = root[nombre + "_REGLAS"];
    if (!N || !R) { return; }
    R.bloques.forEach(function (b) {
      CC.add(CAT, b.since ? { since: b.since } : null, []);
      b.filas.forEach(function (f) {
        var pr = { id: CAT + ":" + f[0], cat: CAT, q: f[0], since: b.since || null };
        perezosa(pr, N, f, null);
        CC.cats[CAT].prompts.push(pr);
      });
    });
    (R.completar || []).forEach(function (f) {
      CC.cats[CAT].prompts.forEach(function (pr) {
        if (pr.q !== f[0]) { return; }
        // sin leer pr.answers aquí: si otra base ya la completó, se armaría antes de tiempo
        var d = Object.getOwnPropertyDescriptor(pr, "answers");
        perezosa(pr, N, f, d.get ? function () { return d.get.call(pr); } : d.value);
      });
    });
  });
})(typeof window !== "undefined" ? window : globalThis);
