"""Completa consignas existentes con listas de Wikidata (ver specs.py) y escribe data/ampliar_wd.js.

  python -X utf8 wd_ampliar.py            genera el archivo
  python -X utf8 wd_ampliar.py --probar   muestra cuántas respuestas da cada consigna y algunos ejemplos

Las respuestas nuevas llevan su nombre en español (o en inglés si es una persona sin etiqueta en español),
sus otros nombres en español y su nombre en inglés como alias. El nivel sale de en cuántas Wikipedias
aparece, comparado con el resto de la lista. Las respuestas que la consigna ya tenía conservan su nivel.
"""
import io, json, os, re, sys

from sparql import consulta
from specs import SPECS

AQUI = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(AQUI, "..", "data", "ampliar_wd.js")
MAXIMO = 250   # respuestas nuevas por consigna, como mucho (las más conocidas)

PLANTILLA = """SELECT ?item ?es ?en ?sl ?taxon (GROUP_CONCAT(DISTINCT ?alt; separator="|") AS ?alts) WHERE {
  %s
  OPTIONAL { ?item wdt:P225 ?taxon }
  ?item wikibase:sitelinks ?sl . FILTER(?sl >= %d)
  OPTIONAL { ?item rdfs:label ?es FILTER(lang(?es) = "es") }
  OPTIONAL { ?item rdfs:label ?en FILTER(lang(?en) = "en") }
  OPTIONAL { ?item skos:altLabel ?alt FILTER(lang(?alt) = "es") }
} GROUP BY ?item ?es ?en ?sl ?taxon"""
EXCLUIR = {"micrófono", "alto", "planta aromática", "pseudofruto", "johann wolfgang von goethe", "rabindranath tagore",
           "matsuo bashō", "felix baumgartner", "mezcla de especias", "aceite de guindilla", "north rhine", "región de edmonton capital"}
CLUB = re.compile(r"(?i)\s*\b(F\.?\s?C\.?|A\.?\s?F\.?\s?C\.?|C\.?\s?F\.?|Football Club|Fútbol Club|Futebol Clube|Foot Ball Club|Club de Fútbol)\b\.?")


def club(s):
    return re.sub(r"\s+", " ", CLUB.sub(" ", s or "")).strip(" .,")


def limpio(s):
    s = re.sub(r"\s*\([^)]*\)$", "", (s or "").strip())   # "Mercurio (planeta)" -> "Mercurio"
    return s.replace(";", ",").replace("/", "-").replace('"', "'").strip()


def respuestas(where, minimo, tipo):
    filas = consulta(PLANTILLA % (where, minimo))
    vistas, lista = set(), []
    for f in filas:
        es, en = limpio(f.get("es")), limpio(f.get("en"))
        alts = [limpio(a) for a in (f.get("alts") or "").split("|") if a]
        if tipo == "club":
            es, en, alts = club(es), club(en), [club(a) for a in alts]
        if f.get("taxon") and es == f["taxon"] and tipo != "taxon":
            # el nombre en español es el científico ("Ocimum basilicum"): se usa el nombre común si lo hay
            es = ""
        if es.lower() in EXCLUIR or en.lower() in EXCLUIR:
            continue
        # personas: el nombre en inglés suele ser el de uso común ("Javier Hernández" y no "Javier Hernández Balcázar")
        if tipo == "persona":
            nombre = en or es
        elif tipo == "persona_es":
            nombre = es or en
        elif tipo == "club":
            # el nombre más corto: "Flamengo" y no "Clube de Regatas do Flamengo"
            base = en or es
            palabras = set(w.lower() for w in re.findall(r"\w{4,}", base + " " + es))
            # solo nombres que compartan una palabra con el nombre oficial: fuera apodos ("The Reds") y siglas ("CARP")
            alts = [c for c in alts if len(c) >= 5 and not c.isupper() and not c[:1].isdigit()
                    and palabras & set(w.lower() for w in re.findall(r"\w{4,}", c))]
            cands = [c for c in [en, es] + alts if c]
            nombre = base if len(base) <= 22 else (min(cands, key=len) if cands else "")
        else:
            nombre = es
        if not nombre or re.match(r"^Q\d+$", nombre) or len(nombre) > 45:
            continue
        clave = nombre.lower()
        if clave in vistas:
            continue
        vistas.add(clave)
        alias = [nombre]
        pal_nombre = set(re.findall(r"\w+", (es + " " + nombre).lower()))
        for a in [es] + alts[:3] + [en]:
            a = limpio(a)
            pal = set(re.findall(r"\w+", a.lower()))
            # fuera alias genéricos ("Peso" en "peso colombiano") y siglas cortas que chocarían con otras respuestas
            if not a or len(a) > 45 or len(re.sub(r"\W", "", a)) < 3 or a.lower() in [x.lower() for x in alias]:
                continue
            if pal and pal < pal_nombre and a.lower() != en.lower():
                continue
            alias.append(a)
        lista.append((int(f["sl"]), alias))
    lista.sort(key=lambda x: -x[0])
    return lista[:MAXIMO]


def niveles(lista):
    # 0-15 % más conocidas: Hueso; 15-35 %: Fósil; 35-65 %: Tesoro; el resto: Hueso de Oro
    n = len(lista)
    out = [[] for _ in range(6)]
    for i, (sl, alias) in enumerate(lista):
        r = i / max(n, 1)
        nivel = 2 if r < 0.15 else 3 if r < 0.35 else 4 if r < 0.65 else 5
        out[nivel].append("/".join(alias))
    return [";".join(x) for x in out]


def main():
    probar = "--probar" in sys.argv
    filas = []
    for spec in SPECS:
        q, where, minimo, tipo = spec
        try:
            lista = respuestas(where, minimo, tipo)
        except RuntimeError as e:
            print("FALLÓ", q, e)
            continue
        if probar:
            print("%4d  %s" % (len(lista), q))
            print("      ", ", ".join(a[0] for _, a in lista[:10]), " ... ", ", ".join(a[0] for _, a in lista[-5:]))
            continue
        if len(lista) >= 5:
            filas.append([q] + niveles(lista))
    if probar:
        return
    js = ("// Respuestas de Wikidata para consignas que ya existen (lo genera ampliar_fuente/wd_ampliar.py; no editar a mano).\n"
          "// Solo agregan lo que falta: si una respuesta ya estaba, sus otros nombres (también en inglés) pasan a ser alias.\n"
          "(function (filas) {\n"
          "  [\"clasica\", \"deportes\", \"geografia\", \"pokemon\"].forEach(function (c) { CC.completarFilas(c, filas); });\n"
          "})(" + json.dumps(filas, ensure_ascii=False, indent=0) + ");\n")
    io.open(SALIDA, "w", encoding="utf-8", newline="\n").write(js)
    print(len(filas), "consignas en", os.path.normpath(SALIDA))


if __name__ == "__main__":
    main()
