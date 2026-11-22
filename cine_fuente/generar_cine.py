# Genera las consignas de cine y series por REGLA a partir de cinedb.json (IMDb 1000+ votos + Wikidata).
#
#   python generar_cine.py                 -> escribe data/cine_nombres.js y data/cine_reglas.js
#   python generar_cine.py --probar '<json>' -> dice cuántas respuestas da una regla y muestra ejemplos por nivel
#
# Las reglas están en reglas_cine.json: {"bloques": [{"since": null|"AAAA-MM-DD", "filas": [[texto, regla], ...]}],
#                                        "completar": [[texto de una consigna escrita a mano, regla], ...]}
# Claves de una regla (todas opcionales, se cumplen todas a la vez):
#   tipo: "pelicula" | "serie" (incluye miniseries) | "miniserie" | "todo"      (por defecto "pelicula")
#   persona: "director" | "reparto"   -> las respuestas son personas que dirigieron / actuaron en títulos que cumplen la regla
#   genero: "Comedy" o ["Romance","Comedy"] (géneros de IMDb, deben estar TODOS); genero_alguno: [...]; sin_genero: [...]
#     (Action Adventure Animation Biography Comedy Crime Documentary Drama Family Fantasy Film-Noir History Horror Music
#      Musical Mystery Romance Sci-Fi Sport Thriller War Western Reality-TV Talk-Show Game-Show News)
#   anio_min / anio_max: año de estreno (en series, el primero)        calif_min / calif_max: calificación de IMDb
#   votos_min: votos en IMDb             duracion_min / duracion_max: minutos      temporadas_min / episodios_min
#   pais: "MEX" o lista ISO-3 (país de origen, Wikidata)   idioma: "es" o lista (es en ja ko fr it de hi pt zh ru sv da)
#   director: "Christopher Nolan" o lista (nombres de IMDb)
#   reparto / productora / distribuidora / cadena / universo / franquicia / saga / wd_genero / tema / premio / nominada:
#     QID de Wikidata o lista (cualquiera). premio: "oscar" = cualquier Óscar. Busca QIDs con: python buscar.py "productora:pixar"
#   sin_productora: lista de QID que NO deben estar.        basada: true (adaptación de otra obra)
#   nombre: empieza, contiene_numero (true), palabras_max, palabras_min, contiene (palabra)
#   fama_min (0-100), excluir: lista de ids tt... o nombres
import io, json, math, re, sys, unicodedata

STOP = set("el la los las un una the de del y and of oceano mar rio monte volcan desierto isla islas lago vitamina".split())
def toks(s):
    s = unicodedata.normalize("NFD", str(s).lower())
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = s.replace("+", " plus ").replace("#", " sharp ").replace("&", " y ")
    return [t for t in re.sub(r"[^a-z0-9]+", " ", s).split() if t]
def norm(s):
    t = toks(s); f = [x for x in t if x not in STOP]
    return "".join(f or t)

IDIOMA = {"es": "Q1321", "en": "Q1860", "ja": "Q5287", "ko": "Q9176", "fr": "Q150", "it": "Q652", "de": "Q188",
          "hi": "Q1568", "pt": "Q5146", "zh": "Q7850", "ru": "Q7737", "sv": "Q9027", "da": "Q9035", "tr": "Q256"}
HISPANOS = set("MEX ESP ARG COL CHL PER VEN CUB URY ECU BOL PRY GTM CRI PAN DOM PRI SLV HND NIC".split())
MAXN = 5                     # nombres por título como máximo
MIN, MAX = 15, 40000

# ---------- nombres ----------
PAREN = re.compile(r"\s*\((?:[^)]*(?:pel[ií]cula|film|serie|miniserie|series|TV|telenovela|programa|anime)[^)]*|\d{4})\)\s*$", re.I)
def limpio(s):
    if not s: return None
    s = PAREN.sub("", s).strip().replace(";", ",").replace("/", " ")
    s = re.sub(r"\s+", " ", s)
    return s or None
def latino(s):
    return all(ord(ch) < 0x250 or ch in "–—’‘“”…·¡¿ºª" for ch in s)

def nombres(t):
    # primero el título con que se conoce en México (IMDb), luego Wikidata, luego otros países, luego inglés y original
    # (el inglés y el original siempre entran antes que los demás títulos alternos)
    mx = t.get("mx", [])
    cand = [*mx[:1], t.get("es"), t.get("en"), t.get("pt"), t.get("ot"), *mx[1:], *t.get("als", []), *t.get("akas", []), t.get("tit")]
    out, vistos = [], set()
    for c in cand:
        c = limpio(c)
        if not c or not latino(c) or len(c) > 80: continue
        k = norm(c)
        if not k or k in vistos: continue
        vistos.add(k); out.append(c)
    return out[:MAXN]

def fama(t):
    b = 1.0
    pais = set(t["rel"].get("pais", []))
    if "MEX" in pais: b = 4.0
    elif pais & HISPANOS or IDIOMA["es"] in t["rel"].get("idioma", []): b = 2.0
    return max(0.0, min(1.0, (math.log(max(1, t["v"] * b)) - math.log(1000)) / (math.log(1500000) - math.log(1000))))

# ---------- base ----------
def cargar():
    T = json.load(io.open("cinedb.json", encoding="utf-8"))
    for t in T:
        t["ns"] = nombres(t)
        t["f"] = fama(t)
    T = [t for t in T if t["ns"]]
    T.sort(key=lambda t: (-t["f"], -t["v"], t["id"]))
    for i, t in enumerate(T): t["i"] = i
    # personas: directores (nombres de IMDb) y reparto (nombres de Wikidata)
    dn = {}
    for l in io.open("imdb/directores.tsv", encoding="utf-8"):
        c = l.rstrip("\r\n").split("\t")
        if c[0] != "nconst": dn[c[0]] = limpio(c[1])
    E = json.load(io.open("wd/etiquetas.json", encoding="utf-8"))
    P = {}
    def persona(clave, nom):
        if clave not in P: P[clave] = {"k": clave, "n": nom, "v": 0.0}
        return P[clave]
    for t in T:
        for d in t["dir"]:
            if dn.get(d): persona("d" + d, dn[d])
        for q in t["rel"].get("reparto", []):
            e = E.get(q)
            nom = limpio(e and (e["es"] or e["en"]))
            if nom and latino(nom): persona("r" + q, nom)
    return T, P, dn, E

T, P, DN, E = cargar()
DIRNOM = {}
for k, n in DN.items():
    if n: DIRNOM.setdefault(norm(n), []).append(k)
OSCAR = {q for q, e in E.items() if (e.get("en") or "").startswith("Academy Award for") or (e.get("es") or "").startswith("Óscar a")}

def lista(x): return x if isinstance(x, list) else [x]

def filtro(r):
    tipo = r.get("tipo", "pelicula")
    ks = {"pelicula": {0}, "serie": {1, 2}, "miniserie": {2}, "todo": {0, 1, 2}}[tipo]
    def ok(t):
        if t["k"] not in ks: return False
        g = set(t["g"]); rel = t["rel"]
        if "genero" in r and not set(lista(r["genero"])) <= g: return False
        if "genero_alguno" in r and not set(lista(r["genero_alguno"])) & g: return False
        if "sin_genero" in r and set(lista(r["sin_genero"])) & g: return False
        y = t["y"] or 0
        if "anio_min" in r and y < r["anio_min"]: return False
        if "anio_max" in r and (not y or y > r["anio_max"]): return False
        if "calif_min" in r and t["r"] < r["calif_min"]: return False
        if "calif_max" in r and t["r"] > r["calif_max"]: return False
        if "votos_min" in r and t["v"] < r["votos_min"]: return False
        if "duracion_min" in r and (t["m"] or 0) < r["duracion_min"]: return False
        if "duracion_max" in r and (not t["m"] or t["m"] > r["duracion_max"]): return False
        if "temporadas_min" in r and t["s"] < r["temporadas_min"]: return False
        if "episodios_min" in r and t["ep"] < r["episodios_min"]: return False
        if "pais" in r and not set(lista(r["pais"])) & set(rel.get("pais", [])): return False
        if "idioma" in r and not {IDIOMA.get(x, x) for x in lista(r["idioma"])} & set(rel.get("idioma", [])): return False
        if "director" in r:
            quiero = {k for n in lista(r["director"]) for k in DIRNOM.get(norm(n), [])}
            if not quiero & set(t["dir"]): return False
        for clave in ("reparto", "productora", "distribuidora", "cadena", "universo", "franquicia", "saga", "wd_genero", "tema", "nominada"):
            campo = "genero" if clave == "wd_genero" else clave      # wd_genero = género según Wikidata (P136)
            if clave in r and not set(lista(r[clave])) & set(rel.get(campo, [])): return False
        if "premio" in r:
            quiero = OSCAR if r["premio"] == "oscar" else set(lista(r["premio"]))
            if not quiero & set(rel.get("premio", [])): return False
        if "sin_productora" in r and set(lista(r["sin_productora"])) & set(rel.get("productora", []) + rel.get("distribuidora", [])): return False
        if r.get("basada") and not rel.get("basada"): return False
        # filtros de nombre: basta con que uno de sus nombres (español, inglés u original) cumpla
        ns = t["ns"]; n0 = ns[0]
        if "empieza" in r and not any(norm(n).startswith(r["empieza"]) for n in ns): return False
        if r.get("contiene_numero") and not any(re.search(r"\d", n) for n in ns): return False
        if "palabras_max" in r and not any(len(toks(n)) <= r["palabras_max"] for n in ns): return False
        if "palabras_min" in r and not any(len(toks(n)) >= r["palabras_min"] for n in ns): return False
        if "contiene" in r and not any(norm(c) in toks(n) for n in ns for c in lista(r["contiene"])): return False
        if "fama_min" in r and t["f"] * 100 < r["fama_min"]: return False
        if "excluir" in r and (t["id"] in r["excluir"] or norm(n0) in {norm(x) for x in r["excluir"]}): return False
        return True
    return ok

CORTES, PCT = [0.15, 0.30, 0.45, 0.60, 0.75], [0.12, 0.35, 0.60, 0.80, 0.93]

def respuestas(r):
    ok = filtro(r)
    tit = [t for t in T if ok(t)]
    if r.get("persona"):
        # personas: fama = suma de votos de sus títulos que cumplen la regla
        suma = {}
        for t in tit:
            claves = ["d" + d for d in t["dir"]] if r["persona"] == "director" else ["r" + q for q in t["rel"].get("reparto", [])]
            for k in claves:
                if k in P: suma[k] = suma.get(k, 0) + t["v"] * (1 + 3 * (t["f"] > 0.5))
        items = sorted(suma, key=lambda k: -suma[k])
        out, vistos = [], set()
        for k in items:
            n = norm(P[k]["n"])
            if n in vistos: continue
            vistos.add(n)
            # la rareza sale de toda su carrera (votos de todos sus títulos), no solo de los que cumplen la regla
            f = max(0.0, min(1.0, (math.log(max(1, P[k]["v"])) - math.log(5000)) / (math.log(20000000) - math.log(5000))))
            out.append((P[k]["i"], 1 - f))
        return "p", out
    out, vistos = [], set()
    for t in tit:
        n = norm(t["ns"][0])
        if n in vistos: continue
        vistos.add(n)
        out.append((t["i"], 1 - t["f"]))
    return "t", out

def niveles(items):
    nv = [[] for _ in range(6)]
    for i, (idx, o) in enumerate(items):
        a = next((j for j, c in enumerate(CORTES) if o < c), 5)
        p = next((j for j, c in enumerate(PCT) if i / len(items) < c), 5)
        nv[0 if i == 0 else (a + p + 1) // 2].append(idx)   # redondeo hacia arriba en .5, como Math.round
    return nv

def b36(n):
    s = ""
    while True:
        n, d = divmod(n, 36); s = "0123456789abcdefghijklmnopqrstuvwxyz"[d] + s
        if not n: return s
def codificar(ids):
    ids = sorted(ids); prev, out = 0, []
    for x in ids: out.append(b36(x - prev)); prev = x
    return ",".join(out)

def mostrar(nombre_lista, idx): return nombre_lista[idx]

# índice de personas (orden por fama global, para que el archivo sea estable)
for k, p in P.items(): p["v"] = 0
for t in T:
    for d in t["dir"]:
        if "d" + d in P: P["d" + d]["v"] += t["v"]
    for q in t["rel"].get("reparto", []):
        if "r" + q in P: P["r" + q]["v"] += t["v"]
PL = sorted(P.values(), key=lambda p: (-p["v"], p["k"]))
for i, p in enumerate(PL): p["i"] = i

def texto_titulo(t):
    ns = list(t["ns"])
    if t["y"]: ns[0] = "%s (%d)" % (ns[0], t["y"])
    return "/".join(ns)
NT = [texto_titulo(t) for t in T]
NP = [p["n"] for p in PL]

def fila(texto, regla):
    tipo, items = respuestas(regla)
    nv = niveles(items) if items else [[]] * 6
    return [texto, tipo] + [codificar(l) for l in nv], len(items), nv, tipo

if len(sys.argv) > 2 and sys.argv[1] == "--probar":
    r = json.loads(sys.argv[2])
    f, n, nv, tipo = fila("prueba", r)
    src = NT if tipo == "t" else NP
    print(n, "respuestas", "(fuera de rango)" if n < MIN or n > MAX else "")
    for j, l in enumerate(nv):
        print(" nivel %d (%d): %s" % (j, len(l), "; ".join(src[x].split("/")[0] for x in l[:8])))
    sys.exit()

R = json.load(io.open("reglas_cine.json", encoding="utf-8"))
fuera = 0
salida = {"bloques": [], "completar": []}
for b in R["bloques"]:
    filas = []
    for texto, regla in b["filas"]:
        f, n, _, _ = fila(texto, regla)
        if n < MIN or n > MAX: print("FUERA DE RANGO (%d): %s" % (n, texto)); fuera += 1; continue
        print("%6d  %s" % (n, texto)); filas.append(f)
    salida["bloques"].append({"since": b.get("since"), "filas": filas})
for texto, regla in R.get("completar", []):
    f, n, _, _ = fila(texto, regla)
    print("%6d  (completa) %s" % (n, texto)); salida["completar"].append(f)

def js_lista(xs): return "[\n" + ",\n".join(json.dumps(x, ensure_ascii=False) for x in xs) + "\n]"
with io.open("../data/cine_nombres.js", "w", encoding="utf-8") as fo:
    fo.write("// Generado por cine_fuente/generar_cine.py: títulos (IMDb 1000+ votos, nombres de Wikidata) y personas.\n")
    fo.write("// Datos de IMDb (https://www.imdb.com), uso personal y no comercial. Ordenados de más a menos conocidos.\n")
    fo.write("var CC_CINE = { t: " + js_lista(NT) + ",\np: " + js_lista(NP) + " };\n")
with io.open("../data/cine_reglas.js", "w", encoding="utf-8") as fo:
    fo.write("// Generado por cine_fuente/generar_cine.py desde cine_fuente/reglas_cine.json. No editar a mano.\n")
    fo.write("// Cada fila: [consigna, 't' (títulos) o 'p' (personas), nivel0..nivel5]; cada nivel son índices en base 36 (diferencias).\n")
    fo.write("var CC_CINE_REGLAS = " + json.dumps(salida, ensure_ascii=False, separators=(",", ":")) + ";\n")
print(fuera, "fuera de rango")
