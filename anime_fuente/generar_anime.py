# Genera las consignas de anime por REGLA con los datos de AniList (solo entradas con id de MyAnimeList) y nombres en español de Wikidata.
#   python generar_anime.py                    -> escribe data/anime_nombres.js y data/anime_reglas.js
#   python generar_anime.py --probar '<json>'  -> dice cuántas respuestas da una regla y muestra ejemplos por nivel
# Reglas en reglas_anime.json: {"bloques": [{"since": null|"AAAA-MM-DD", "filas": [[texto, regla], ...]}], "completar": [...]}
# Claves de una regla (se cumplen todas):
#   formato: "serie" (TV), "pelicula", "ova", "ona", "especial" o lista    genero: "Romance" o lista (deben estar TODOS)
#     (Action Adventure Comedy Drama Ecchi Fantasy Horror Mahou Shoujo Mecha Music Mystery Psychological Romance Sci-Fi
#      Slice of Life Sports Supernatural Thriller)
#   etiqueta: "Shounen", "Isekai", "Seinen", "Shoujo", "School"... (etiquetas de AniList, cualquiera de la lista)
#   estudio: "MAPPA" o lista    pais: "JP", "CN", "KR"    anio_min / anio_max    episodios_min    calif_min (0-100)
#   titulo: texto o lista (el anime debe llevarlo en alguno de sus nombres, p. ej. "Naruto")
#   empieza, contiene_numero, palabras_max, fama_min (0-100), excluir
#   persona: "principal" (protagonistas) o "cualquiera" -> las respuestas son personajes de los anime que cumplen la regla
import glob, io, json, math, os, re, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from bases_comun import norm, toks, lista, unicos, generar, probar

MAXN, MIN, MAX = 5, 15, 30000
FORMATOS = {"serie": {"TV", "TV_SHORT"}, "pelicula": {"MOVIE"}, "ova": {"OVA"}, "ona": {"ONA"}, "especial": {"SPECIAL"}}
# Nombres con que se conocen en México y que las fuentes no traen (clave: título romaji exacto)
MEXICO = {
    "Shingeki no Kyojin": ["Ataque a los Titanes", "Attack on Titan"],
    "Kimetsu no Yaiba": ["Guardianes de la Noche", "Demon Slayer"],
    "Saint Seiya": ["Los Caballeros del Zodiaco", "Caballeros del Zodiaco"],
    "Captain Tsubasa": ["Supercampeones", "Super Campeones"],
    "Cardcaptor Sakura": ["Sakura Card Captor", "Sakura Cazadora de Cartas"],
    "Kimi no Na wa.": ["Tu nombre", "Your Name"],
    "Koe no Katachi": ["Una voz silenciosa", "A Silent Voice"],
    "Sen to Chihiro no Kamikakushi": ["El viaje de Chihiro"],
    "Tonari no Totoro": ["Mi vecino Totoro"],
    "Hotaru no Haka": ["La tumba de las luciérnagas"],
    "Mononoke Hime": ["La princesa Mononoke"],
    "Hauru no Ugoku Shiro": ["El castillo ambulante"],
    "Boku no Hero Academia": ["My Hero Academia", "Mi academia de héroes"],
    "Bishoujo Senshi Sailor Moon": ["Sailor Moon"],
    "Yuu☆Yuu☆Hakusho": ["Yu Yu Hakusho"],
    "Hagane no Renkinjutsushi: FULLMETAL ALCHEMIST": ["Fullmetal Alchemist: Brotherhood"],
}


def limpio(s):
    if not s:
        return None
    s = re.sub(r"\s*\((?:[^)]*(?:anime|serie|película|film)[^)]*|\d{4})\)\s*$", "", s.strip(), flags=re.I)
    s = re.sub(r"\s+", " ", s.replace(";", ",").replace("/", " ")).strip()
    # Wikipedia nombra "Anexo:Primera temporada de X": no sirve como título
    if s.startswith("Anexo:") or re.search(r"\btemporada\b", s, re.I):
        return None
    return s or None


def sin_vocal_larga(s):
    """Gojou -> Gojo, Gokuu -> Goku, Tanjirou -> Tanjiro: como se escriben normalmente."""
    return re.sub(r"uu", "u", re.sub(r"o[ou]", "o", s))


ES = {}
for b in json.load(io.open("al/nombres_es.json", encoding="utf-8"))["results"]["bindings"]:
    ES.setdefault(b["mal"]["value"], {}).setdefault(b["t"]["value"], []).append(b["l"]["value"])

A, vistos = [], set()
for f in sorted(glob.glob("al/anime_*.json")):
    for m in json.load(io.open(f, encoding="utf-8"))["data"]["Page"]["media"]:
        anio = (m.get("startDate") or {}).get("year") or m.get("seasonYear")
        if not m.get("idMal") or m["format"] == "MUSIC" or m["id"] in vistos or (anio and anio > 2026):
            continue
        vistos.add(m["id"])
        e = ES.get(str(m["idMal"]), {})
        t = m["title"]
        cortos = [x for x in e.get("a", []) + (m.get("synonyms") or []) if len(norm(x)) >= 5]
        cand = MEXICO.get(t["romaji"], []) + e.get("l", []) + [t.get("english"), t.get("romaji")] + e.get("w", []) + cortos
        m["ns"] = unicos(cand, limpio, MAXN)
        m["y"] = (m.get("startDate") or {}).get("year") or m.get("seasonYear")
        m["et"] = {x["name"] for x in m.get("tags") or [] if x["rank"] >= 75}
        m["es"] = {x["name"] for x in m["studios"]["nodes"]}
        m["f"] = max(0.0, min(1.0, (math.log(max(1, m["popularity"])) - math.log(500)) / (math.log(600000) - math.log(500))))
        if m["ns"]:
            A.append(m)
A.sort(key=lambda m: (-m["popularity"], m["id"]))
for i, m in enumerate(A):
    m["i"] = i
PORID = {m["id"]: m for m in A}
NT = ["/".join([("%s (%d)" % (m["ns"][0], m["y"])) if m["y"] else m["ns"][0]] + m["ns"][1:]) for m in A]

P = []
for f in sorted(glob.glob("al/pers_*.json")):
    for c in json.load(io.open(f, encoding="utf-8"))["data"]["Page"]["characters"]:
        full = c["name"]["full"] or ""
        partes = full.split()
        rev = " ".join(reversed(partes)) if len(partes) == 2 else None
        cortos = [sin_vocal_larga(full)] + ([sin_vocal_larga(rev)] if rev else [])
        ns = unicos([full, rev] + cortos + [x for x in (c["name"].get("alternative") or []) if x and len(norm(x)) >= 4], limpio, 6)
        media = [(e["node"]["id"], e["characterRole"]) for e in c["media"]["edges"] if e["node"]["id"] in PORID]
        if ns and media:
            P.append({"ns": ns, "fav": c["favourites"], "media": media})
P.sort(key=lambda c: -c["fav"])
# Un apodo de una palabra no vale si es el nombre de un personaje más famoso ("Eren" no puede caer en otra persona)
tomados = set()
for i, c in enumerate(P):
    c["i"] = i
    propios = set(toks(c["ns"][0])) | set(toks(sin_vocal_larga(c["ns"][0])))
    c["ns"] = [n for k, n in enumerate(c["ns"]) if k == 0 or len(toks(n)) > 1 or toks(n)[0] in propios or toks(n)[0] not in tomados]
    tomados |= propios
NP = ["/".join(c["ns"]) for c in P]


def filtro(r):
    forms = set().union(*[FORMATOS[x] for x in lista(r["formato"])]) if "formato" in r else None
    tit = {norm(x) for x in lista(r["titulo"])} if "titulo" in r else None

    def ok(m):
        if forms and m["format"] not in forms:
            return False
        if "genero" in r and not set(lista(r["genero"])) <= set(m["genres"]):
            return False
        if "etiqueta" in r and not set(lista(r["etiqueta"])) & m["et"]:
            return False
        if "estudio" in r and not set(lista(r["estudio"])) & m["es"]:
            return False
        if "pais" in r and m["countryOfOrigin"] not in lista(r["pais"]):
            return False
        y = m["y"] or 0
        if "anio_min" in r and y < r["anio_min"]:
            return False
        if "anio_max" in r and (not y or y > r["anio_max"]):
            return False
        if "episodios_min" in r and (m["episodes"] or 0) < r["episodios_min"]:
            return False
        if "calif_min" in r and (m["averageScore"] or 0) < r["calif_min"]:
            return False
        ns = m["ns"]
        if tit and not any(x in norm(n) for n in ns for x in tit):
            return False
        if "empieza" in r and not any(norm(n).startswith(r["empieza"]) for n in ns):
            return False
        if r.get("contiene_numero") and not any(re.search(r"\d", n) for n in ns):
            return False
        if "palabras_max" in r and not any(len(toks(n)) <= r["palabras_max"] for n in ns):
            return False
        if "fama_min" in r and m["f"] * 100 < r["fama_min"]:
            return False
        if "excluir" in r and norm(ns[0]) in {norm(x) for x in r["excluir"]}:
            return False
        return True
    return ok


def respuestas(r):
    ok = filtro(r)
    vistos, out = set(), []
    if r.get("persona"):
        validos = {m["id"] for m in A if ok(m)}
        for c in P:
            if not any(i in validos and (r["persona"] == "cualquiera" or rol == "MAIN") for i, rol in c["media"]):
                continue
            k = norm(c["ns"][0])
            if k in vistos:
                continue
            vistos.add(k)
            f = max(0.0, min(1.0, (math.log(max(1, c["fav"])) - math.log(50)) / (math.log(60000) - math.log(50))))
            out.append((c["i"], 1 - f))
        return "p", out
    for m in A:
        if not ok(m):
            continue
        k = norm(m["ns"][0])
        if k in vistos:
            continue
        vistos.add(k)
        out.append((m["i"], 1 - m["f"]))
    return "t", out


if len(sys.argv) > 2 and sys.argv[1] == "--probar":
    probar(json.loads(sys.argv[2]), respuestas, NT, NP, MIN, MAX)
    sys.exit()
print(len(A), "anime;", len(P), "personajes")
generar("reglas_anime.json", respuestas, NT, NP, "CC_ANIME", "../data/anime_nombres.js", "../data/anime_reglas.js",
        MIN, MAX, "anime_fuente/generar_anime.py (AniList y Wikidata)")
