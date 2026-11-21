# Vuelve a pedir a Wikidata los nombres de los títulos que llegaron sin etiqueta (lotes chicos). Guarda wd/nombres_extra_N.json.
import io, json, glob, subprocess
falt = {}
for f in sorted(glob.glob("wd/nombres_[0-9]*.json")):
    for b in json.load(io.open(f, encoding="utf-8"))["results"]["bindings"]:
        if "es" not in b and "en" not in b: falt[b["item"]["value"].rsplit("/", 1)[1]] = b["id"]["value"]
print(len(falt), "sin etiqueta")
Q = """SELECT ?item ?id ?l ?lang WHERE { VALUES ?item { %s } ?item wdt:P345 ?id .
 { ?item rdfs:label ?l } UNION { ?item skos:altLabel ?l }
 BIND(lang(?l) AS ?lang) FILTER(?lang IN ("es","es-419","es-mx","en")) }"""
qs = sorted(falt)
for i in range(0, len(qs), 150):
    io.open("wd/_q_extra.rq", "w", encoding="utf-8").write(Q % " ".join("wd:" + q for q in qs[i:i + 150]))
    sal = "wd/nombres_extra_%03d.json" % (i // 150)
    r = subprocess.run(["curl", "-sS", "https://query.wikidata.org/sparql", "--data-urlencode", "query@wd/_q_extra.rq",
        "--data-urlencode", "format=json", "-H", "Accept: application/sparql-results+json",
        "-A", "TriviaCineBuilder/1.0 (educational game data)", "-m", "200", "-o", sal, "-w", "%{http_code}"], capture_output=True, text=True)
    print(sal, r.stdout, flush=True)
