// Se carga después de todos los datos: cada respuesta escrita a mano acepta también sus nombres en inglés.
// Va al final para que esos nombres no interfieran al juntar respuestas repetidas (CC.completarFilas).
CC.order.forEach(function (id) {
  CC.cats[id].prompts.forEach(function (p) {
    var d = Object.getOwnPropertyDescriptor(p, "answers");
    if (d && d.get) return;   // las bases de cine, juegos y anime ya traen sus nombres en inglés
    CC.bilingue(p.answers);
  });
});
