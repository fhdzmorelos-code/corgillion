# Junta los archivos de Wikidata en juegosdb.json y baja los nombres de las relaciones frecuentes a wd/etiquetas.json.
# Uso: python armar_juegos.py (desde juegos_fuente)
import io, json, glob, collections, subprocess, os
def filas(pat):
    for f in sorted(glob.glob(pat)):
        try:
            for b in json.load(io.open(f, encoding="utf-8"))["results"]["bindings"]: yield b
        except Exception as ex: print("ARCHIVO ROTO", f, ex)
J = {}
for b in json.load(io.open("wd/lista.json", encoding="utf-8"))["results"]["bindings"]:
    q = b["item"]["value"].rsplit("/", 1)[1]
    J[q] = {"q": q, "sl": max(int(b["sl"]["value"]), J.get(q, {}).get("sl", 0)), "nom": {}, "rel": {}}
for b in filas("wd/nombres_*.json"):
    j = J.get(b["item"]["value"].rsplit("/", 1)[1])
    if j: j["nom"].setdefault(b["t"]["value"], []).append(b["l"]["value"])
for b in filas("wd/rel_*.json"):
    j = J.get(b["item"]["value"].rsplit("/", 1)[1])
    if not j or "v" not in b: continue
    v = b["v"]["value"]; v = v.rsplit("/", 1)[1] if v.startswith("http") else v
    l = j["rel"].setdefault(b["p"]["value"], [])
    if v not in l: l.append(v)
json.dump(list(J.values()), io.open("juegosdb.json", "w", encoding="utf-8"), ensure_ascii=False)
print(len(J), "juegos;", sum(1 for j in J.values() if j["nom"]), "con nombre;", sum(1 for j in J.values() if j["rel"].get("anio")), "con año")
cuenta = collections.Counter(v for j in J.values() for p, vs in j["rel"].items() if p not in ("anio", "pais") for v in vs)
quiero = [q for q, n in cuenta.items() if n >= 2 and q.startswith("Q")]
E = json.load(io.open("wd/etiquetas.json", encoding="utf-8")) if os.path.exists("wd/etiquetas.json") else {}
faltan = [q for q in quiero if q not in E]
print(len(faltan), "por nombrar")
C = 'SELECT ?x ?l WHERE { VALUES ?x { %s } ?x rdfs:label ?l FILTER(lang(?l) IN ("es","en")) }'
for i in range(0, len(faltan), 3000):
    io.open("wd/_q_etq.rq", "w", encoding="utf-8").write(C % " ".join("wd:" + q for q in faltan[i:i + 3000]))
    r = subprocess.run(["curl", "-sS", "https://query.wikidata.org/sparql", "--data-urlencode", "query@wd/_q_etq.rq", "--data-urlencode", "format=json",
        "-H", "Accept: application/sparql-results+json", "-A", "TriviaJuegosBuilder/1.0 (educational game data)", "-m", "200", "-o", "wd/_etq.json", "-w", "%{http_code}"],
        capture_output=True, text=True)
    if r.stdout.strip() != "200": print("fallo", r.stdout); continue
    for b in json.load(io.open("wd/_etq.json", encoding="utf-8"))["results"]["bindings"]:
        d = E.setdefault(b["x"]["value"].rsplit("/", 1)[1], {})
        d[b["l"]["xml:lang"]] = b["l"]["value"]
json.dump(E, io.open("wd/etiquetas.json", "w", encoding="utf-8"), ensure_ascii=False)
