# Busca en wd/etiquetas.json y cuenta en cuántos títulos aparece cada elemento por relación.
# Uso: python buscar.py "texto1" "texto2" ...   (texto puede llevar relacion:  "productora:pixar")
import io, json, sys, collections
E = json.load(io.open("wd/etiquetas.json", encoding="utf-8"))
T = json.load(io.open("cinedb.json", encoding="utf-8"))
c = collections.Counter()
for t in T:
    for p, vs in t["rel"].items():
        for v in vs: c[(p, v)] += 1
for arg in sys.argv[1:]:
    rel, _, txt = arg.rpartition(":"); txt = txt.lower()
    print("==", arg)
    res = [(n, p, v) for (p, v), n in c.items() if (not rel or p == rel) and v in E and txt in ((E[v]["es"] or "") + " | " + (E[v]["en"] or "")).lower()]
    for n, p, v in sorted(res, reverse=True)[:8]:
        print(" ", n, p, v, E[v]["es"], "|", E[v]["en"])
