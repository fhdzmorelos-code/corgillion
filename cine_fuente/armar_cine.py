# Junta IMDb (votos, géneros, años, temporadas) con Wikidata (títulos en español y relaciones)
# en cine_fuente/cinedb.json. Uso: python armar_cine.py   (desde cine_fuente)
# Después baja los nombres de las relaciones más frecuentes (personas, estudios, cadenas, sagas...) a wd/etiquetas.json.
import io, json, glob, collections, subprocess, os

NULO = chr(92) + "N"
TIPO = {"movie": 0, "tvSeries": 1, "tvMiniSeries": 2}

votos = {}
for l in io.open("imdb/votos.tsv", encoding="utf-8"):
    c = l.rstrip("\r\n").split("\t")
    if c[0] != "tconst": votos[c[0]] = (float(c[1]), int(c[2]))

temp = {}
for l in io.open("imdb/temporadas.tsv", encoding="utf-8"):
    c = l.rstrip("\r\n").split("\t")
    temp[c[0]] = (int(c[1]), int(c[2]))

dirs = {}
for l in io.open("imdb/crew.tsv", encoding="utf-8"):
    c = l.rstrip("\r\n").split("\t")
    if c[0] != "tconst" and c[1] != NULO: dirs[c[0]] = c[1].split(",")

T = {}
for l in io.open("imdb/basics.tsv", encoding="utf-8"):
    c = l.rstrip("\r\n").split("\t")
    if c[1] not in TIPO: continue
    num = lambda x: int(x) if x != NULO and x.isdigit() else None
    r, v = votos[c[0]]
    s, ep = temp.get(c[0], (0, 0))
    T[c[0]] = {"id": c[0], "k": TIPO[c[1]], "pt": c[2], "ot": c[3], "y": num(c[5]), "e": num(c[6]), "m": num(c[7]),
               "g": [] if c[8] == NULO else c[8].split(","), "r": r, "v": v, "s": s, "ep": ep,
               "dir": dirs.get(c[0], []), "rel": {}}

def filas(pat):
    for f in sorted(glob.glob(pat)):
        try:
            for b in json.load(io.open(f, encoding="utf-8"))["results"]["bindings"]:
                yield b
        except Exception as ex:
            print("ARCHIVO ROTO", f, ex)

val = lambda b, k: b[k]["value"] if k in b else None
for b in filas("wd/nombres_[0-9]*.json"):
    t = T.get(val(b, "id"))
    if not t: continue
    q = val(b, "item").rsplit("/", 1)[1]
    sl = int(val(b, "sl") or 0)
    # un id de IMDb puede estar en dos elementos de Wikidata: se queda el más enlazado
    if t.get("q") and t.get("sl", 0) >= sl: continue
    t.update({"q": q, "es": val(b, "es"), "en": val(b, "en"), "tit": val(b, "tit"), "sl": sl,
              "als": [x for x in (val(b, "als") or "").split("|") if x]})

# títulos que Wikidata devolvió sin etiqueta: se completan con wd/nombres_extra_*.json (rebajar_nombres.py)
for b in filas("wd/nombres_extra_*.json"):
    t = T.get(val(b, "id"))
    if not t: continue
    l, lang = val(b, "l"), val(b, "lang")
    if lang == "en":
        if not t.get("en"): t["en"] = l
    else:
        if not t.get("es"): t["es"] = l
        elif l not in t.setdefault("als", []): t["als"].append(l)

# y si aún falta, el título de su artículo en Wikipedia (wd/sitelinks.json, bajar_sitelinks.py)
SL = json.load(io.open("wd/sitelinks.json", encoding="utf-8")) if os.path.exists("wd/sitelinks.json") else {}
for t in T.values():
    s = SL.get(t.get("q"))
    if not s: continue
    if s.get("es") and not t.get("es"): t["es"] = s["es"]
    if s.get("en") and not t.get("en"): t["en"] = s["en"]

# títulos con que se estrenó en México y otros países hispanohablantes (IMDb title.akas filtrado: imdb/akas_es.tsv)
if os.path.exists("imdb/akas_es.tsv"):
    for l in io.open("imdb/akas_es.tsv", encoding="utf-8"):
        c = l.rstrip("\r\n").split("\t")
        t = T.get(c[0])
        if not t or c[5] in ("working", "festival") or "literal" in c[6] or c[4] in ("ca", "eu", "gl"): continue   # sin catalán, euskera ni gallego
        campo = "mx" if c[3] == "MX" else "akas"
        if c[2] not in t.setdefault(campo, []): t[campo].append(c[2])

q2t = {t["q"]: t for t in T.values() if t.get("q")}
id2t = T
for b in filas("wd/rel_*.json"):
    t = id2t.get(val(b, "id"))
    if not t: continue
    v = val(b, "v")
    v = v.rsplit("/", 1)[1] if v.startswith("http") else v
    lst = t["rel"].setdefault(val(b, "p"), [])
    if v not in lst: lst.append(v)

json.dump(list(T.values()), io.open("cinedb.json", "w", encoding="utf-8"), ensure_ascii=False)
con = sum(1 for t in T.values() if t.get("q"))
print(len(T), "títulos;", con, "con Wikidata;", sum(1 for t in T.values() if t.get("es")), "con título en español")

# ---- nombres de las relaciones frecuentes ----
MINIMO = {"reparto": 4, "director": 2, "productora": 3, "distribuidora": 5, "cadena": 3, "saga": 2, "franquicia": 2,
          "universo": 2, "premio": 3, "nominada": 3, "genero": 5, "idioma": 3, "clase": 3, "tema": 5, "basada": 1}
cuenta = collections.Counter()
for t in T.values():
    for p, vs in t["rel"].items():
        if p in MINIMO:
            for v in vs: cuenta[(p, v)] += 1
quiero = sorted({v for (p, v), n in cuenta.items() if n >= MINIMO[p] and v.startswith("Q")})
print(len(quiero), "elementos por nombrar")
previas = json.load(io.open("wd/etiquetas.json", encoding="utf-8")) if os.path.exists("wd/etiquetas.json") else {}
faltan = [q for q in quiero if q not in previas]
CONSULTA = """SELECT ?x ?es ?en ?cl WHERE { VALUES ?x { %s }
 OPTIONAL { ?x rdfs:label ?es FILTER(lang(?es)="es") } OPTIONAL { ?x rdfs:label ?en FILTER(lang(?en)="en") }
 OPTIONAL { ?x wdt:P31 ?cl } }"""
for i in range(0, len(faltan), 3000):
    lote = faltan[i:i + 3000]
    io.open("wd/_q_etq.rq", "w", encoding="utf-8").write(CONSULTA % " ".join("wd:" + q for q in lote))
    r = subprocess.run(["curl", "-sS", "https://query.wikidata.org/sparql", "--data-urlencode", "query@wd/_q_etq.rq",
        "--data-urlencode", "format=json", "-H", "Accept: application/sparql-results+json",
        "-A", "TriviaCineBuilder/1.0 (educational game data)", "-m", "300", "-o", "wd/_etq.json", "-w", "%{http_code}"],
        capture_output=True, text=True)
    if r.stdout.strip() != "200":
        print("fallo etiquetas", r.stdout, r.stderr[:200]); continue
    for b in json.load(io.open("wd/_etq.json", encoding="utf-8"))["results"]["bindings"]:
        q = val(b, "x").rsplit("/", 1)[1]
        d = previas.setdefault(q, {"es": val(b, "es"), "en": val(b, "en"), "cl": []})
        cl = val(b, "cl")
        if cl and cl.rsplit("/", 1)[1] not in d["cl"]: d["cl"].append(cl.rsplit("/", 1)[1])
    print("etiquetas", i + len(lote), "/", len(faltan))
json.dump(previas, io.open("wd/etiquetas.json", "w", encoding="utf-8"), ensure_ascii=False)
