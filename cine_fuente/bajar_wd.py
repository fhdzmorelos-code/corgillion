# Baja de Wikidata los títulos en español y las relaciones de cada película/serie de IMDb (1000+ votos).
# Uso: python bajar_wd.py   (desde cine_fuente). Guarda wd/nombres_N.json y wd/rel_N.json; salta los que ya existen.
import io, json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
TIPOS = {"movie", "tvSeries", "tvMiniSeries"}
ids = []
for l in io.open("imdb/basics.tsv", encoding="utf-8"):
    c = l.split("\t")
    if c[1] in TIPOS: ids.append(c[0])
LOTE = 2000
lotes = [ids[i:i + LOTE] for i in range(0, len(ids), LOTE)]

NOMBRES = """SELECT ?id ?item ?es ?en ?tit ?sl (GROUP_CONCAT(DISTINCT ?al; separator="|") AS ?als) WHERE {
 VALUES ?id { %s }
 ?item wdt:P345 ?id .
 OPTIONAL { ?item rdfs:label ?es FILTER(lang(?es)="es") }
 OPTIONAL { ?item rdfs:label ?en FILTER(lang(?en)="en") }
 OPTIONAL { ?item wdt:P1476 ?tit }
 OPTIONAL { ?item wikibase:sitelinks ?sl }
 OPTIONAL { ?item skos:altLabel|rdfs:label ?al FILTER(lang(?al) IN ("es","es-419","es-mx")) }
} GROUP BY ?id ?item ?es ?en ?tit ?sl"""

REL = """SELECT ?id ?p ?v WHERE {
 VALUES ?id { %s }
 ?item wdt:P345 ?id .
 { ?item wdt:P495/wdt:P298 ?v BIND("pais" AS ?p) } UNION
 { ?item wdt:P364 ?v BIND("idioma" AS ?p) } UNION
 { ?item wdt:P272 ?v BIND("productora" AS ?p) } UNION
 { ?item wdt:P750 ?v BIND("distribuidora" AS ?p) } UNION
 { ?item wdt:P449 ?v BIND("cadena" AS ?p) } UNION
 { ?item wdt:P179 ?v BIND("saga" AS ?p) } UNION
 { ?item wdt:P8345 ?v BIND("franquicia" AS ?p) } UNION
 { ?item wdt:P1434 ?v BIND("universo" AS ?p) } UNION
 { ?item wdt:P144 ?v BIND("basada" AS ?p) } UNION
 { ?item wdt:P166 ?v BIND("premio" AS ?p) } UNION
 { ?item wdt:P1411 ?v BIND("nominada" AS ?p) } UNION
 { ?item wdt:P57 ?v BIND("director" AS ?p) } UNION
 { ?item wdt:P161 ?v BIND("reparto" AS ?p) } UNION
 { ?item wdt:P136 ?v BIND("genero" AS ?p) } UNION
 { ?item wdt:P31 ?v BIND("clase" AS ?p) } UNION
 { ?item wdt:P180 ?v BIND("tema" AS ?p) } UNION
 { ?item wdt:P921 ?v BIND("tema" AS ?p) }
}"""

def correr(args):
    plantilla, i, nombre = args
    sal = "wd/%s_%02d.json" % (nombre, i)
    if os.path.exists(sal) and os.path.getsize(sal) > 1000: return sal + " ya estaba"
    q = plantilla % " ".join('"%s"' % x for x in lotes[i])
    tmp = "wd/_q_%s_%02d.rq" % (nombre, i)
    io.open(tmp, "w", encoding="utf-8").write(q)
    for intento in range(3):
        r = subprocess.run(["curl", "-sS", "https://query.wikidata.org/sparql", "--data-urlencode", "query@" + tmp,
            "--data-urlencode", "format=json", "-H", "Accept: application/sparql-results+json",
            "-A", "TriviaCineBuilder/1.0 (educational game data)", "-m", "300", "-o", sal, "-w", "%{http_code}"],
            capture_output=True, text=True)
        if r.stdout.strip() == "200":
            try: json.load(io.open(sal, encoding="utf-8")); os.remove(tmp); return sal + " ok"
            except Exception: pass
    return sal + " FALLO " + r.stdout + r.stderr[:200]

trabajos = [(NOMBRES, i, "nombres") for i in range(len(lotes))] + [(REL, i, "rel") for i in range(len(lotes))]
with ThreadPoolExecutor(3) as ex:
    for res in ex.map(correr, trabajos):
        print(res, flush=True)
