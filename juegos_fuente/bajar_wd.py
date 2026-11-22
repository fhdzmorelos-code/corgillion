# Baja de Wikidata nombres y relaciones de los videojuegos de wd/lista.json. Uso: python bajar_wd.py (desde juegos_fuente).
import io, json, os, subprocess
from concurrent.futures import ThreadPoolExecutor
qs = sorted({b["item"]["value"].rsplit("/", 1)[1] for b in json.load(io.open("wd/lista.json", encoding="utf-8"))["results"]["bindings"]})
LOTE = 1500
lotes = [qs[i:i + LOTE] for i in range(0, len(qs), LOTE)]
NOMBRES = """SELECT ?item ?l ?t WHERE { VALUES ?item { %s }
 { ?item rdfs:label ?l BIND(CONCAT("l:", lang(?l)) AS ?t) FILTER(lang(?l) IN ("es","es-419","es-mx","en")) } UNION
 { ?item skos:altLabel ?l BIND(CONCAT("a:", lang(?l)) AS ?t) FILTER(lang(?l) IN ("es","es-419","es-mx","en")) } UNION
 { ?w schema:about ?item ; schema:isPartOf <https://es.wikipedia.org/> ; schema:name ?l BIND("w:es" AS ?t) } UNION
 { ?w schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?l BIND("w:en" AS ?t) }
}"""
REL = """SELECT ?item ?p ?v WHERE { VALUES ?item { %s }
 { ?item wdt:P400 ?v BIND("plataforma" AS ?p) } UNION { ?item wdt:P136 ?v BIND("genero" AS ?p) } UNION
 { ?item wdt:P178 ?v BIND("desarrolladora" AS ?p) } UNION { ?item wdt:P123 ?v BIND("editora" AS ?p) } UNION
 { ?item wdt:P179 ?v BIND("saga" AS ?p) } UNION { ?item wdt:P8345 ?v BIND("franquicia" AS ?p) } UNION
 { ?item wdt:P404 ?v BIND("modo" AS ?p) } UNION { ?item wdt:P166 ?v BIND("premio" AS ?p) } UNION
 { ?item wdt:P495/wdt:P298 ?v BIND("pais" AS ?p) } UNION { ?item wdt:P577 ?f BIND(STR(YEAR(?f)) AS ?v) BIND("anio" AS ?p) }
}"""
def correr(args):
    plantilla, i, nombre = args
    sal = "wd/%s_%02d.json" % (nombre, i)
    if os.path.exists(sal) and os.path.getsize(sal) > 1000: return sal + " ya estaba"
    tmp = "wd/_q_%s_%02d.rq" % (nombre, i)
    io.open(tmp, "w", encoding="utf-8").write(plantilla % " ".join("wd:" + q for q in lotes[i]))
    for _ in range(4):
        r = subprocess.run(["curl", "-sS", "https://query.wikidata.org/sparql", "--data-urlencode", "query@" + tmp,
            "--data-urlencode", "format=json", "-H", "Accept: application/sparql-results+json",
            "-A", "TriviaJuegosBuilder/1.0 (educational game data)", "-m", "280", "-o", sal, "-w", "%{http_code}"], capture_output=True, text=True)
        if r.stdout.strip() == "200":
            try: json.load(io.open(sal, encoding="utf-8")); os.remove(tmp); return sal + " ok"
            except Exception: pass
    if os.path.exists(sal): os.remove(sal)
    return sal + " FALLO " + r.stdout
print(len(qs), "juegos en", len(lotes), "lotes", flush=True)
with ThreadPoolExecutor(3) as ex:
    for res in ex.map(correr, [(NOMBRES, i, "nombres") for i in range(len(lotes))] + [(REL, i, "rel") for i in range(len(lotes))]):
        if "ok" not in res: print(res, flush=True)
print("listo")
