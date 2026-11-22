# Genera las consignas de videojuegos por REGLA a partir de juegosdb.json (Wikidata: juegos con artículo en 2+ Wikipedias).
#   python generar_juegos.py                    -> escribe data/juegos_nombres.js y data/juegos_reglas.js
#   python generar_juegos.py --probar '<json>'  -> dice cuántas respuestas da una regla y muestra ejemplos por nivel
# Reglas en reglas_juegos.json: {"bloques": [{"since": null|"AAAA-MM-DD", "filas": [[texto, regla], ...]}], "completar": [...]}
# Claves de una regla (se cumplen todas):
#   plataforma, genero, sin_genero, editora, desarrolladora, empresa (editora o desarrolladora), saga, franquicia, modo:
#     QID de Wikidata o lista (cualquiera). Búscalos con: python buscar.py "plataforma:wii" "editora:capcom"
#     Consolas sin nombre en la base: PS1 Q10677, PS2 Q10680, PS5 Q63184502, Xbox Q132020, 360 Q48263, One Q13361286,
#     Switch Q19610114, Switch 2 Q122761124, GBA Q188642, Saturn Q200912, Dreamcast Q184198, iOS Q48493.
#     Empresas: Sega Q122741, Ubisoft Q188273, Activision Q200491, Rockstar Q94912.
#   anio_min / anio_max (primer lanzamiento), pais (ISO-3), empieza, contiene_numero, palabras_max, palabras_min,
#   fama_min (0-100), excluir
import io, json, math, os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from bases_comun import norm, toks, lista, unicos, generar, probar

MAXN, MIN, MAX = 4, 15, 30000
EROTICOS = {"Q1046788"}  # eroge: fuera de la base
PAREN = re.compile(r"\s*\((?:[^)]*(?:video ?game|videojuego|juego|game|serie|saga|franchise)[^)]*|\d{4})\)\s*$", re.I)


def limpio(s):
    if not s or s.startswith("Anexo:"):
        return None
    return re.sub(r"\s+", " ", PAREN.sub("", s).strip().replace(";", ",").replace("/", " ")) or None


def nombres(j):
    n = j["nom"]
    claves = ("l:es-mx", "l:es-419", "l:es", "w:es", "l:en", "w:en", "a:es-mx", "a:es-419", "a:es", "a:en")
    return unicos([x for k in claves for x in n.get(k, [])], limpio, MAXN)


# Un juego de "pelea en 3D" también es de "pelea", pero la jerarquía de Wikidata es demasiado amplia (Diablo saldría como pelea):
# un género solo hereda la familia si su nombre lleva la palabra de esa familia.
FAMILIAS = {"Q846224": "fight", "Q828322": "platform", "Q744038": "role-playing", "Q860750": "racing", "Q54767": "puzzle",
            "Q472055": "strategy", "Q1610017": "simulat", "Q185029": "first-person shooter", "Q11338014": "horror", "Q868217": "sport"}
SUP = json.load(io.open("wd/generos_sup.json", encoding="utf-8"))
ETQ = json.load(io.open("wd/etiquetas.json", encoding="utf-8"))
J = json.load(io.open("juegosdb.json", encoding="utf-8"))
for j in J:
    extra = set()
    for g in j["rel"].get("genero", []):
        nombre = (ETQ.get(g, {}).get("en") or "").lower()
        extra |= {t for t in SUP.get(g, []) if t in FAMILIAS and FAMILIAS[t] in nombre}
        if "Q1046788" in SUP.get(g, []):
            extra.add("Q1046788")
    if extra:
        j["rel"]["genero"] = sorted(set(j["rel"]["genero"]) | extra)
J = [j for j in J if not EROTICOS & set(j["rel"].get("genero", []))]
for j in J:
    j["ns"] = nombres(j)
    anios = [int(a) for a in j["rel"].get("anio", []) if a.isdigit() and 1950 <= int(a) <= 2030]
    j["y"] = min(anios) if anios else None
    j["f"] = max(0.0, min(1.0, (math.log(max(1, j["sl"])) - math.log(2)) / (math.log(45) - math.log(2))))
J = [j for j in J if j["ns"]]
J.sort(key=lambda j: (-j["sl"], j["q"]))
for i, j in enumerate(J):
    j["i"] = i
NT = ["/".join([("%s (%d)" % (j["ns"][0], j["y"])) if j["y"] else j["ns"][0]] + j["ns"][1:]) for j in J]


def filtro(r):
    def ok(j):
        rel = j["rel"]
        for c in ("plataforma", "genero", "editora", "desarrolladora", "saga", "franquicia", "modo", "pais"):
            if c in r and not set(lista(r[c])) & set(rel.get(c, [])):
                return False
        if "empresa" in r and not set(lista(r["empresa"])) & set(rel.get("editora", []) + rel.get("desarrolladora", [])):
            return False
        if "sin_genero" in r and set(lista(r["sin_genero"])) & set(rel.get("genero", [])):
            return False
        if "anio_min" in r and (j["y"] or 0) < r["anio_min"]:
            return False
        if "anio_max" in r and (not j["y"] or j["y"] > r["anio_max"]):
            return False
        ns = j["ns"]
        if "empieza" in r and not any(norm(n).startswith(r["empieza"]) for n in ns):
            return False
        if r.get("contiene_numero") and not any(re.search(r"\d", n) for n in ns):
            return False
        if "palabras_max" in r and not any(len(toks(n)) <= r["palabras_max"] for n in ns):
            return False
        if "palabras_min" in r and not any(len(toks(n)) >= r["palabras_min"] for n in ns):
            return False
        if "fama_min" in r and j["f"] * 100 < r["fama_min"]:
            return False
        if "excluir" in r and (j["q"] in r["excluir"] or norm(ns[0]) in {norm(x) for x in r["excluir"]}):
            return False
        return True
    return ok


def respuestas(r):
    ok, out, vistos = filtro(r), [], set()
    for j in J:
        if not ok(j):
            continue
        k = norm(j["ns"][0])
        if k in vistos:
            continue
        vistos.add(k)
        out.append((j["i"], 1 - j["f"]))
    return "t", out


if len(sys.argv) > 2 and sys.argv[1] == "--probar":
    probar(json.loads(sys.argv[2]), respuestas, NT, [], MIN, MAX)
    sys.exit()
generar("reglas_juegos.json", respuestas, NT, [], "CC_JUEGOS", "../data/juegos_nombres.js", "../data/juegos_reglas.js",
        MIN, MAX, "juegos_fuente/generar_juegos.py (Wikidata, CC0)")
