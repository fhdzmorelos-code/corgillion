// Cliente de la tabla de posiciones y del candado del diario (Supabase).
// Todo pasa por funciones del servidor (RPC); ver supabase/esquema.sql.
(function (root) {
  "use strict";

  var cfg = root.CORGI_ONLINE || {};
  var enabled = !!(cfg.url && cfg.key);

  function rpc(name, args) {
    var headers = { "Content-Type": "application/json", apikey: cfg.key };
    // las claves antiguas son un JWT y también van como Authorization; las nuevas solo como apikey
    if (/^eyJ/.test(cfg.key)) headers.Authorization = "Bearer " + cfg.key;
    return fetch(cfg.url.replace(/\/+$/, "") + "/rest/v1/rpc/" + name, {
      method: "POST", headers: headers, body: JSON.stringify(args || {})
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error((j && (j.message || j.hint)) || ("Error " + r.status));
        return j;
      });
    });
  }

  function creds(p) { return { p_apodo: p.apodo, p_pin: p.pin }; }
  function merge(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }

  root.Online = {
    enabled: enabled,
    fecha: function () { return rpc("fecha_servidor").then(function (f) { return String(f).slice(0, 10); }); },
    entrar: function (p) { return rpc("entrar", creds(p)); },
    iniciar: function (p, cat) { return rpc("iniciar_diario", merge(creds(p), { p_categoria: cat })); },
    terminar: function (p, cat, puntos, respuestas) {
      return rpc("terminar_diario", merge(creds(p), { p_categoria: cat, p_puntos: puntos, p_respuestas: respuestas }));
    },
    record: function (p, cat, modo, puntos) {
      return rpc("subir_record", merge(creds(p), { p_categoria: cat, p_modo: modo, p_puntos: puntos }));
    },
    tablaDiaria: function (cat) { return rpc("tabla_diaria", { p_categoria: cat }); },
    tablaRecords: function (cat, modo) { return rpc("tabla_records", { p_categoria: cat, p_modo: modo }); }
  };
})(typeof window !== "undefined" ? window : globalThis);
