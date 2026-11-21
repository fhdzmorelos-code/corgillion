// Consignas de cine y series por REGLA (generadas por cine_fuente/generar_cine.py).
// data/cine_nombres.js trae los títulos y personas; data/cine_reglas.js trae, por consigna, qué índices valen y en qué nivel.
// Las respuestas de cada consigna se arman solo la primera vez que se juega (hay consignas con más de 20 mil respuestas).
// Debe cargarse DESPUÉS de data/core.js, de las consignas escritas a mano y de los dos archivos de datos.
(function (root) {
  "use strict";
  var CC = root.CC, N = root.CC_CINE, R = root.CC_CINE_REGLAS, CAT = "clasica";
  if (!CC || !N || !R) { return; }

  function indices(s) {
    var out = [], x = 0;
    if (!s) { return out; }
    s.split(",").forEach(function (d) { x += parseInt(d, 36); out.push(x); });
    return out;
  }

  function fila(f) {
    var src = f[1] === "p" ? N.p : N.t;
    return [f[0]].concat(f.slice(2).map(function (s) {
      return indices(s).map(function (i) { return src[i]; }).join(";");
    }));
  }

  // answers se calcula al primer uso; si la consigna ya tenía respuestas escritas a mano, se conservan y se suman las nuevas
  function perezosa(pr, f, base) {
    var cache = null;
    Object.defineProperty(pr, "answers", {
      configurable: true, enumerable: true,
      get: function () {
        if (cache) { return cache; }
        var nuevas = CC.build(fila(f));
        if (!base) { cache = nuevas; return cache; }
        var claves = {};
        base.forEach(function (a) { a.keys.forEach(function (k) { claves[k] = 1; }); });
        cache = base.concat(nuevas.filter(function (a) { return !a.keys.some(function (k) { return claves[k]; }); }));
        return cache;
      },
      set: function (v) { cache = v; }
    });
  }

  R.bloques.forEach(function (b) {
    var meta = b.since ? { since: b.since } : null;
    CC.add(CAT, meta, []);
    var c = CC.cats[CAT];
    b.filas.forEach(function (f) {
      var pr = { id: CAT + ":" + f[0], cat: CAT, q: f[0], since: b.since || null };
      perezosa(pr, f, null);
      c.prompts.push(pr);
    });
  });

  var c = CC.cats[CAT];
  (R.completar || []).forEach(function (f) {
    if (!c) { return; }
    c.prompts.forEach(function (pr) {
      if (pr.q === f[0]) { perezosa(pr, f, pr.answers); }
    });
  });
})(typeof window !== "undefined" ? window : globalThis);
