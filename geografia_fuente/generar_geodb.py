# Base de datos de lugares (ciudades, ríos, lagos, montañas, volcanes, islas) + consignas de Geografía POR REGLA.
#
#   python geografia_fuente/generar_geodb.py            -> usa geodb.json (ya armado) y regenera data/geografia_reglas.js
#   python geografia_fuente/generar_geodb.py --armar    -> rearma geodb.json desde lo bajado de Wikidata (carpeta wd/)
#   python geografia_fuente/generar_geodb.py --probar '{"tipo":"ciudad","pais":"JPN"}'   -> muestra cuántas respuestas da una regla
#
# Las reglas viven en geografia_fuente/reglas_geo.json: una lista de bloques
#   {"since": "AAAA-MM-DD" o null, "filas": [["Nombra una ciudad de Japón", {"tipo": "ciudad", "pais": "JPN"}], ...]}
# y "completar": [["consigna escrita a mano que ya existe", {regla}], ...] agrega las respuestas que le falten.
#
# Condiciones de una regla (todas deben cumplirse):
#   tipo: "ciudad" | "rio" | "lago" | "montana" (incluye volcanes) | "volcan" | "isla" | "pais" | "capital"  (o lista)
#   pais: ISO-3 o nombre en español, o lista ("MEX", ["ESP", "PRT"])            -> el lugar está (al menos en parte) en ese país
#   continente: "Europa" | "Asia" | "África" | "Norteamérica" | "Sudamérica" | "Oceanía" | "América" (o lista)
#   subregion: como en paises.json ("Caribbean", "Central America", "South-Eastern Asia"...) (o lista)
#   pais_cond: {condiciones de país} -> el país del lugar las cumple. Ej.: {"idioma": "Spanish"}
#   pob_min, pob_max: habitantes (ciudades y países)
#   medida_min, medida_max: largo en km (ríos), superficie en km² (lagos, islas), altura en m (montañas, volcanes)
#   capital: true -> solo capitales nacionales; false -> ninguna capital nacional (para "ciudad")
#   varios_paises: true -> el lugar está en dos países o más (ríos, lagos, montañas, islas)
#   empieza, termina, contiene, sin_letra: letra(s) o lista, sobre el nombre en español sin acentos
#   letras, letras_min, letras_max, palabras_min: sobre el nombre en español
#   fama_min: mínimo de idiomas de Wikipedia con artículo del lugar (quita lugares casi desconocidos)
#   excluir: lista de nombres que no cuentan
#   Solo países: frontera_con, fronteras_min, fronteras_max, idioma, sup_min, sup_max y las marcas
#     ue, otan, monarquia, urss, nuclear, mediterraneo, izquierda, ecuador, sin_mar, oriente_medio (true/false)
import io, json, math, os, re, sys, unicodedata

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
WD = os.path.join(AQUI, "wd")

# ---------- comparación de nombres (igual que norm() de data/core.js) ----------
STOP = set("el la los las un una the de del y and of oceano mar rio monte volcan desierto isla islas lago vitamina".split())


def toks(s):
    s = unicodedata.normalize("NFD", str(s).lower())
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = s.replace("+", " plus ").replace("#", " sharp ").replace("&", " y ")
    return [t for t in re.sub(r"[^a-z0-9]+", " ", s).split() if t]


def norm(s):
    t = toks(s)
    f = [x for x in t if x not in STOP]
    return "".join(f or t)


def plano(s):  # sin acentos ni signos, con espacios (para letras y palabras)
    return " ".join(toks(s))


paises = json.load(io.open(os.path.join(AQUI, "paises.json"), encoding="utf-8"))
P = {p["id"]: p for p in paises}
NOMBRE_A_ISO = {}
for p in paises:
    for n in p["nombres"]:
        NOMBRE_A_ISO.setdefault(norm(n), p["id"])
PRINCIPAL = {norm(p["nombres"][0]): p["id"] for p in paises}
HISPANOS = {p["id"] for p in paises if "Spanish" in p["idiomas"]}

CONT_Q = {"Q15": "África", "Q48": "Asia", "Q46": "Europa", "Q49": "Norteamérica", "Q18": "Sudamérica",
          "Q55643": "Oceanía", "Q538": "Oceanía", "Q3960": "Oceanía", "Q51": "Antártida"}
TIPOS = {"ciudad": "c", "rio": "r", "lago": "l", "montana": "m", "volcan": "v", "isla": "i"}


# ---------- armar geodb.json desde Wikidata ----------
def filas(path):
    try:
        d = json.load(io.open(path, encoding="utf-8"))
    except ValueError:
        print("ARCHIVO ROTO (vuélvelo a bajar):", os.path.basename(path))
        return
    for b in d["results"]["bindings"]:
        yield {k: v["value"] for k, v in b.items()}


def qid(u):
    return u.rsplit("/", 1)[-1]


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


METRO = re.compile(r"upazila|\bstate\b|\bkingdom\b|-ku$|m[ée]tropole|metr[oó]poli |comunidad urbana|city of |triciudad|tricity|departamento|partido de|barrio|metropolitan|conurbaci|greater |gran |urban area|aglomeraci|zona urbana|prefectura|prefecture|county|condado|provincia|province|municipio|municipality|distrito|district|regi[oó]n", re.I)
NO_ES = re.compile(r"arrecife|barrera|\breef\b|collado|\bcol\b|cumbre (sur|norte|este|oeste)|summit|embalse|reservoir|presa |\bdam\b", re.I)
# países que son una sola isla (o casi): sí valen como respuesta de "isla"
ISLA_PAIS = tuple("CUB JAM ISL IRL MDG LKA CYP BRB NRU SGP DMA LCA GRD MLT MUS BHR TWN".split())
# nombres en español que Wikidata no trae
EXTRA = {"Lemán": ["Lago de Ginebra", "Ginebra"], "Lago Mayor": ["Lago Maggiore"], "Lago de Constanza": ["Constanza", "Bodensee"]}
# barrios y distritos famosos que Wikidata cuenta como lugar poblado
NO_CIUDAD = {norm(x) for x in "Manhattan;Brooklyn;Queens;The Bronx;Bronx;Staten Island;Hempstead;Kowloon;Soweto".split(";")}
ALIAS_MALO = re.compile(r"[0-9()\[\],:]")
NO_CORTAR = set("ciudad san santa santo santiago puerto villa nueva nuevo la el los las valle bahia isla monte rio "
                "heroica general colonia cabo".split())


def alias_cortos(nombre):
    """'Acapulco de Juárez' -> 'Acapulco'; 'Heroica Puebla de Zaragoza' -> 'Puebla'."""
    out = []
    n = re.sub(r"^(Heroica|Heroico|H\.)\s+", "", nombre)
    if n != nombre:
        out.append(n)
    m = re.match(r"^(\S+(?:\s\S+)?) de ", n)
    if m and toks(m.group(1))[0] not in NO_CORTAR and len(m.group(1)) >= 4:
        out.append(m.group(1))
    return out


def nombres(es, en, alias, ciudad=False):
    principal = es or en
    lista = [principal] + (alias_cortos(principal) if ciudad else [])
    if en and norm(en) != norm(principal):
        lista.append(en)
    base = {w for x in lista for w in toks(x) if len(w) >= 4}
    for a in sorted(alias, key=len):
        if len(lista) >= 7:
            break
        w = toks(a)
        if not w:
            continue
        # los apodos ("La Perla Tapatía", "Alcalde de Macapá") no valen: solo alias cortos o que repitan una palabra del nombre
        if not (set(w) & base) and (len(w) > 2 or w[0] in ("ciudad", "capital", "alcalde")):
            continue
        if 3 <= len(a) <= 40 and not ALIAS_MALO.search(a) and not METRO.search(a) and norm(a) not in [norm(x) for x in lista]:
            lista.append(a)
    # "Lake Geneva" -> "Geneva", "Amazon River" -> "Amazon", "Mount Hood" -> "Hood"
    for x in list(lista):
        y = re.sub(r"^(Lake|Mount|Mt\.?|Isle of|Island of) |\s(River|Lake|Island|Volcano|Mountain|Peak)$", "", x)
        if y != x and len(y) >= 3:
            lista.append(y)
    lista += EXTRA.get(principal, [])
    vistos, out = set(), []
    for x in lista:
        x = x[0].upper() + x[1:]
        if norm(x) and norm(x) not in vistos:
            vistos.add(norm(x))
            out.append(x)
    return out


def armar():
    clases = {qid(r["t"]) for r in filas(os.path.join(WD, "clases.json"))}
    ciudad = {qid(r["t"]) for r in filas(os.path.join(WD, "clases_ciudad.json"))}
    excluir = {qid(r["t"]) for r in filas(os.path.join(WD, "clases_excluir.json"))} - ciudad
    lugares = []

    # ciudades: un archivo por país
    carpeta = os.path.join(WD, "ciudades")
    for f in sorted(os.listdir(carpeta)):
        iso = f[:3]
        if iso not in P:
            continue
        caps = {norm(x) for x in P[iso]["capital"]}
        it = {}
        for r in filas(os.path.join(carpeta, f)):
            x = it.setdefault(r["c"], {"pop": 0, "sl": 0, "t": set(), "es": None, "en": None, "al": set()})
            x["pop"] = max(x["pop"], num(r.get("pop")) or 0)
            x["sl"] = max(x["sl"], int(r["sl"]))
            x["t"].add(qid(r["t"]))
            x["es"] = x["es"] or r.get("es")
            x["en"] = x["en"] or r.get("en")
            if r.get("alias"):
                x["al"].add(r["alias"])
        for x in it.values():
            # vale si es ciudad, o si es un asentamiento que no sea barrio, suburbio, distrito ni área metropolitana
            if not (x["t"] & ciudad or (x["t"] & clases and not x["t"] & excluir)):
                continue
            if x["pop"] > 40e6 or x["sl"] < 10 or not (x["es"] or x["en"]):
                continue
            if METRO.search((x["es"] or "") + " " + (x["en"] or "")) or norm(x["en"] or x["es"]) in NO_CIUDAD:
                continue
            ns = nombres(x["es"], x["en"], x["al"], ciudad=True)
            if not ns:
                continue
            cap = any(norm(n) in caps for n in ns)
            lugares.append({"t": "c", "n": ns, "f": x["sl"], "p": [iso], "pob": int(x["pop"]), "cap": cap})

    # ríos, lagos, montañas, volcanes, islas
    TOPE = {"r": 7000, "l": 400000, "m": 8850, "v": 7000, "i": 2200000}
    for archivo, t in (("rios", "r"), ("lagos", "l"), ("montanas", "m"), ("volcanes", "v"), ("islas", "i")):
        it = {}
        for r in filas(os.path.join(WD, archivo + ".json")):
            x = it.setdefault(r["c"], {"sl": 0, "p": set(), "co": set(), "m": [], "es": None, "en": None, "al": set()})
            x["sl"] = max(x["sl"], int(r["sl"]))
            if r.get("iso") in P:
                x["p"].add(r["iso"])
            if r.get("cont") and qid(r["cont"]) in CONT_Q:
                x["co"].add(CONT_Q[qid(r["cont"])])
            m = num(r.get("m"))
            if m and 0 < m <= TOPE[t]:
                x["m"].append(m)
            x["es"] = x["es"] or r.get("es")
            x["en"] = x["en"] or r.get("en")
            if r.get("alias"):
                x["al"].add(r["alias"])
        for q, x in it.items():
            if not (x["es"] or x["en"]):
                continue
            tt = t
            if t == "m" and q in volcanes_q:
                continue  # ya está como volcán
            nom = (x["es"] or "") + " " + (x["en"] or "")
            if NO_ES.search(nom):
                continue
            if t == "i" and PRINCIPAL.get(norm(x["es"] or x["en"]), "-") not in ("-",) + ISLA_PAIS:
                continue  # el país (Japón, Indonesia...) no es una sola isla
            ns = nombres(x["es"], x["en"], x["al"])
            if not ns:
                continue
            lugares.append({"t": tt, "n": ns, "f": x["sl"], "p": sorted(x["p"]),
                            "co": sorted(x["co"]), "med": round(max(x["m"])) if x["m"] else None})
        if t == "v":
            pass

    # un mismo nombre en el mismo país y tipo: se queda el más famoso
    mejor = {}
    for l in lugares:
        k = (l["t"], norm(l["n"][0]), tuple(l["p"][:1]))
        if k not in mejor or l["f"] > mejor[k]["f"]:
            mejor[k] = l
    lugares = sorted(mejor.values(), key=lambda l: (l["t"], -l["f"]))
    json.dump(lugares, io.open(os.path.join(AQUI, "geodb.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    from collections import Counter
    print("geodb.json:", dict(Counter(l["t"] for l in lugares)))


volcanes_q = set()


def cargar_volcanes_q():
    p = os.path.join(WD, "volcanes.json")
    if os.path.exists(p):
        for r in filas(p):
            volcanes_q.add(r["c"])


# ---------- fama ----------
FAMOSOS = set("USA MEX ESP FRA ITA DEU JPN CHN BRA ARG CAN RUS GBR IND AUS EGY COL PER CHL CUB KOR PRT GRC TUR VEN NLD CHE "
              "BEL SWE NOR IRL ISR ZAF NGA MAR THA IDN PHL VNM KEN UKR POL".split())
CAPFAM = set("FRA GBR ESP ITA JPN USA MEX ARG DEU RUS CHN PER COL CHL CUB VEN CAN BRA PRT GRC EGY KOR IND THA NLD AUT BEL IRL "
             "NOR SWE DNK POL CZE HUN ECU URY PRY BOL GTM CRI PAN SLV HND NIC DOM UKR ISR TUR AUS CHE FIN".split())


def fama_pais(p):  # igual que generar.py
    pop = p["poblacion"] or 1000
    f = max(0, min(1, (math.log10(pop) - 5) / 4)) * 0.55
    if p["id"] in FAMOSOS: f += 0.25
    if "Spanish" in p["idiomas"]: f += 0.10
    if p["continentes"][0] in ("Norteamérica", "Sudamérica", "Europa"): f += 0.08
    return min(1, f)


def fama_lugar(l):
    """Idiomas de Wikipedia con artículo, con un empujón a lo que conoce un jugador mexicano."""
    b = 1.0
    if "MEX" in l["p"]: b = 3.0
    elif set(l["p"]) & HISPANOS: b = 1.8
    elif "USA" in l["p"]: b = 1.5
    return max(0, min(1, (math.log(max(1, l["f"]) * b) - math.log(12)) / (math.log(200) - math.log(12))))


# ---------- reglas ----------
def lista(v):
    return v if isinstance(v, list) else [v]


def isos(v):
    out = []
    for x in lista(v):
        k = x if x in P else NOMBRE_A_ISO.get(norm(x))
        if not k:
            raise ValueError("país desconocido: %s" % x)
        out.append(k)
    return out


def conts(v):
    out = []
    for c in lista(v):
        out += ["Norteamérica", "Sudamérica"] if norm(c) == "america" else [c]
    return out


MARCAS = "ue otan monarquia urss nuclear mediterraneo izquierda ecuador sin_mar oriente_medio".split()


def cumple_pais(p, s):
    for k, v in s.items():
        if k == "continente" and not set(conts(v)) & set(p["continentes"]): return False
        if k == "subregion" and p["subregion"] not in lista(v): return False
        if k == "pais" and p["id"] not in isos(v): return False
        if k == "idioma" and not set(lista(v)) & set(p["idiomas"]): return False
        if k == "frontera_con" and not set(isos(v)) & set(p["fronteras"]): return False
        if k == "fronteras_min" and len(p["fronteras"]) < v: return False
        if k == "fronteras_max" and len(p["fronteras"]) > v: return False
        if k == "pob_min" and (p["poblacion"] or 0) < v: return False
        if k == "pob_max" and (p["poblacion"] or 0) > v: return False
        if k == "sup_min" and (p["superficie"] or 0) < v: return False
        if k == "sup_max" and (p["superficie"] or 0) > v: return False
        if k in MARCAS and bool(p[k]) != bool(v): return False
    return True


def cumple_nombre(nombre, s):
    t = plano(nombre)
    pegado = t.replace(" ", "")
    for k, v in s.items():
        if k == "empieza" and not any(pegado.startswith(plano(x).replace(" ", "")) for x in lista(v)): return False
        if k == "termina" and not any(pegado.endswith(plano(x).replace(" ", "")) for x in lista(v)): return False
        if k == "contiene" and not any(plano(x).replace(" ", "") in pegado for x in lista(v)): return False
        if k == "sin_letra" and any(plano(x) in pegado for x in lista(v)): return False
        if k == "letras" and len(pegado) != v: return False
        if k == "letras_min" and len(pegado) < v: return False
        if k == "letras_max" and len(pegado) > v: return False
        if k == "palabras_min" and len(t.split()) < v: return False
        if k == "excluir" and norm(nombre) in [norm(x) for x in lista(v)]: return False
    return True


def candidatos(s, lugares):
    """[(texto con alias, fama 0..1)] de lo que cumple la regla."""
    tipos = lista(s.get("tipo", "ciudad"))
    out = []
    if "pais" in tipos or "capital" in tipos:
        for p in paises:
            if not cumple_pais(p, s):
                continue
            if "pais" in tipos and cumple_nombre(p["nombres"][0], s):
                out.append(("/".join(p["nombres"]), fama_pais(p)))
            if "capital" in tipos and cumple_nombre(p["capital"][0], s):
                out.append(("/".join(p["capital"]), fama_pais(p) * 0.6 + (0.35 if p["id"] in CAPFAM else 0)))
    letras = set(TIPOS[t] for t in tipos if t in TIPOS)
    if "m" in letras:
        letras.add("v")
    if letras:
        pc = s.get("pais_cond")
        quiero = set(isos(s["pais"])) if "pais" in s else None
        cs = set(conts(s["continente"])) if "continente" in s else None
        for l in lugares:
            if l["t"] not in letras: continue
            if quiero is not None and not set(l["p"]) & quiero: continue
            lc = set(l.get("co") or []) | {c for i in l["p"] for c in P[i]["continentes"]}
            if cs is not None and not lc & cs: continue
            if "subregion" in s and not {P[i]["subregion"] for i in l["p"]} & set(lista(s["subregion"])): continue
            if pc and not any(cumple_pais(P[i], pc) for i in l["p"]): continue
            if "pob_min" in s and l.get("pob", 0) < s["pob_min"]: continue
            if "pob_max" in s and l.get("pob", 0) > s["pob_max"]: continue
            if "medida_min" in s and (l.get("med") or 0) < s["medida_min"]: continue
            if "medida_max" in s and (l.get("med") is None or l["med"] > s["medida_max"]): continue
            if "capital" in s and bool(l.get("cap")) != bool(s["capital"]): continue
            if s.get("varios_paises") and len(l["p"]) < 2: continue
            if "fama_min" in s and l["f"] < s["fama_min"]: continue
            if not cumple_nombre(l["n"][0], s): continue
            out.append(("/".join(x.replace(";", ",").replace("/", "-") for x in l["n"]), fama_lugar(l)))
    return out


CORTES, PCT = [0.15, 0.30, 0.45, 0.60, 0.75], [0.12, 0.35, 0.60, 0.80, 0.93]
MIN, MAX = 10, 450


def niveles(items):
    items = sorted(items, key=lambda x: -x[1])
    out, vistos = [[] for _ in range(6)], set()
    items2 = []
    for t, f in items:
        ks = {norm(a) for a in t.split("/")}
        if ks & vistos:
            continue
        vistos |= ks
        items2.append((t, f))
    for i, (t, f) in enumerate(items2):
        o = 1 - f
        a = next((j for j, c in enumerate(CORTES) if o < c), 5)
        r = next((j for j, c in enumerate(PCT) if i / len(items2) < c), 5)
        out[0 if i == 0 else round((a + r) / 2)].append(t)
    return [";".join(x) for x in out], len(items2)


def js(s):
    return json.dumps(s, ensure_ascii=False)


def generar():
    lugares = json.load(io.open(os.path.join(AQUI, "geodb.json"), encoding="utf-8"))
    reglas = json.load(io.open(os.path.join(AQUI, "reglas_geo.json"), encoding="utf-8"))
    partes = ["// GENERADO por geografia_fuente/generar_geodb.py a partir de geografia_fuente/reglas_geo.json y la base geodb.json",
              "// (Wikidata + paises.json). No lo edites a mano: cambia las reglas y vuelve a correr el generador.", ""]
    total, malas = 0, 0
    for bloque in reglas["bloques"]:
        meta = js({"since": bloque["since"]}) if bloque.get("since") else "null"
        rows = []
        for q, s in bloque["filas"]:
            niv, n = niveles(candidatos(s, lugares))
            if n < MIN or n > MAX:
                print("FUERA DE RANGO (%d respuestas): %s" % (n, q)); malas += 1
                continue
            rows.append("  " + js([q] + niv))
        if rows:
            partes.append('CC.add("geografia", %s, [\n%s\n]);\n' % (meta, ",\n".join(rows)))
            total += len(rows)
    comp = []
    for q, s in reglas.get("completar", []):
        niv, n = niveles(candidatos(s, lugares))
        comp.append("  " + js([q] + niv))
    if comp:
        partes.append("// Completa consignas escritas a mano con lo que falte de la base de datos (no cambia lo ya escrito).")
        partes.append('CC.completarFilas("geografia", [\n%s\n]);\n' % ",\n".join(comp))
    io.open(os.path.join(RAIZ, "data", "geografia_reglas.js"), "w", encoding="utf-8").write("\n".join(partes))
    print("data/geografia_reglas.js: %d consignas por regla, %d completadas, %d fuera de rango" % (total, len(comp), malas))
    return malas


if __name__ == "__main__":
    if "--armar" in sys.argv:
        cargar_volcanes_q()
        armar()
    if "--probar" in sys.argv:
        s = json.loads(sys.argv[sys.argv.index("--probar") + 1])
        lug = json.load(io.open(os.path.join(AQUI, "geodb.json"), encoding="utf-8"))
        niv, n = niveles(candidatos(s, lug))
        sys.stdout.reconfigure(encoding="utf-8")
        print(n, "respuestas")
        for i, x in enumerate(niv):
            print(i, x[:300])
        sys.exit(0)
    sys.exit(1 if generar() else 0)
