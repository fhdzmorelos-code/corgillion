"""Consulta SPARQL a Wikidata con curl (el Python de esta máquina no valida certificados) y caché en disco."""
import hashlib, io, json, os, subprocess, time, urllib.parse

AQUI = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(AQUI, "cache")
UA = "CorgillionTrivia/1.0 (juego de trivia; listas de respuestas)"


def consulta(q, usar_cache=True):
    os.makedirs(CACHE, exist_ok=True)
    ruta = os.path.join(CACHE, hashlib.sha1(q.encode("utf-8")).hexdigest()[:16] + ".json")
    if usar_cache and os.path.exists(ruta):
        return json.load(io.open(ruta, encoding="utf-8"))
    url = "https://query.wikidata.org/sparql?format=json&query=" + urllib.parse.quote(q)
    for intento in range(4):
        r = subprocess.run(["curl", "-s", "-m", "120", "-A", UA, url], capture_output=True, timeout=150)
        txt = r.stdout.decode("utf-8", "replace")
        try:
            filas = json.loads(txt)["results"]["bindings"]
        except Exception:
            time.sleep(20 * (intento + 1))
            continue
        filas = [{k: v["value"] for k, v in f.items()} for f in filas]
        json.dump(filas, io.open(ruta, "w", encoding="utf-8"), ensure_ascii=False)
        time.sleep(1.5)
        return filas
    raise RuntimeError("Wikidata no respondió: " + q[:120])
