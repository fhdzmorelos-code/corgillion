# Uso: python buscar.py "plataforma:" "genero:battle" ... muestra elementos por relación y cuántos juegos tienen cada uno.
import io, json, sys, collections
E = json.load(io.open("wd/etiquetas.json", encoding="utf-8")); J = json.load(io.open("juegosdb.json", encoding="utf-8"))
c = collections.Counter((p, v) for j in J for p, vs in j["rel"].items() for v in vs)
for arg in sys.argv[1:]:
    rel, _, txt = arg.partition(":"); txt = txt.lower(); print("==", arg)
    res = [(n, v) for (p, v), n in c.items() if p == rel and v in E and txt in (" | ".join(E[v].values())).lower()]
    for n, v in sorted(res, reverse=True)[:int(40 if not txt else 10)]:
        print(" ", n, v, E[v].get("es"), "|", E[v].get("en"))
