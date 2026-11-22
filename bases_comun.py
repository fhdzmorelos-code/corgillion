# Piezas compartidas por los generadores de bases (juegos_fuente, anime_fuente): nombres, niveles de rareza y formato de salida.
import io, json, re, unicodedata

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


def latino(s):
    return all(ord(ch) < 0x250 or ch in "–—’‘“”…·¡¿ºª★☆" for ch in s)


def lista(x):
    return x if isinstance(x, list) else [x]


def unicos(cand, limpio, maximo):
    out, vistos = [], set()
    for c in cand:
        c = limpio(c)
        if not c or not latino(c) or len(c) > 80:
            continue
        k = norm(c)
        if not k or k in vistos:
            continue
        vistos.add(k)
        out.append(c)
    return out[:maximo]


CORTES, PCT = [0.15, 0.30, 0.45, 0.60, 0.75], [0.12, 0.35, 0.60, 0.80, 0.93]


def niveles(items):
    """items: [(índice, oscuridad)] de más a menos conocido. Devuelve 6 listas de índices."""
    nv = [[] for _ in range(6)]
    for i, (idx, o) in enumerate(items):
        a = next((j for j, c in enumerate(CORTES) if o < c), 5)
        p = next((j for j, c in enumerate(PCT) if i / len(items) < c), 5)
        nv[0 if i == 0 else (a + p + 1) // 2].append(idx)
    return nv


def b36(n):
    s = ""
    while True:
        n, d = divmod(n, 36)
        s = "0123456789abcdefghijklmnopqrstuvwxyz"[d] + s
        if not n:
            return s


def codificar(ids):
    prev, out = 0, []
    for x in sorted(ids):
        out.append(b36(x - prev))
        prev = x
    return ",".join(out)


def generar(archivo_reglas, respuestas, NT, NP, var, salida_nombres, salida_reglas, MIN, MAX, fuente):
    """Evalúa las reglas y escribe los dos archivos de datos del juego."""
    def fila(texto, regla):
        tipo, items = respuestas(regla)
        nv = niveles(items) if items else [[] for _ in range(6)]
        return [texto, tipo] + [codificar(l) for l in nv], len(items)

    R = json.load(io.open(archivo_reglas, encoding="utf-8"))
    fuera, sal = 0, {"bloques": [], "completar": []}
    for b in R["bloques"]:
        filas = []
        for texto, regla in b["filas"]:
            f, n = fila(texto, regla)
            if n < MIN or n > MAX:
                print("FUERA DE RANGO (%d): %s" % (n, texto))
                fuera += 1
                continue
            print("%6d  %s" % (n, texto))
            filas.append(f)
        sal["bloques"].append({"since": b.get("since"), "filas": filas})
    for texto, regla in R.get("completar", []):
        f, n = fila(texto, regla)
        print("%6d  (completa) %s" % (n, texto))
        sal["completar"].append(f)
    js = lambda xs: "[\n" + ",\n".join(json.dumps(x, ensure_ascii=False) for x in xs) + "\n]"
    with io.open(salida_nombres, "w", encoding="utf-8") as fo:
        fo.write("// Generado: " + fuente + ". Ordenados de más a menos conocidos.\n")
        fo.write("var " + var + " = { t: " + js(NT) + ",\np: " + js(NP) + " };\n")
    with io.open(salida_reglas, "w", encoding="utf-8") as fo:
        fo.write("// Generado desde " + archivo_reglas + ". No editar a mano.\n")
        fo.write("var " + var + "_REGLAS = " + json.dumps(sal, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(fuera, "fuera de rango")


def probar(regla, respuestas, NT, NP, MIN, MAX):
    tipo, items = respuestas(regla)
    src = NT if tipo == "t" else NP
    print(len(items), "respuestas", "(fuera de rango)" if len(items) < MIN or len(items) > MAX else "")
    if items:
        for j, l in enumerate(niveles(items)):
            print(" nivel %d (%d): %s" % (j, len(l), "; ".join(src[x].split("/")[0] for x in sorted(l)[:8])))
