# Uso: cd geografia_fuente; python bajar_ciudades.py   (luego: python generar_geodb.py --armar)
# Las demás consultas están en consultas/*.rq y se bajan con: sh consultas/wdq.sh consultas/rios.rq wd/rios.json
# Reino Unido e India no caben en el tiempo límite: se sacan de una consulta global de ciudades (consultas ciudades_raw).
# Baja de Wikidata los lugares poblados de 100 mil habitantes o más, un país a la vez (una consulta grande se pasa del tiempo límite).
import json, subprocess, os, sys
paises = json.load(open("paises.json", encoding="utf-8"))
plantilla = open("consultas/ciudades_pais.rq", encoding="utf-8").read()
os.makedirs("wd/ciudades", exist_ok=True)
for p in paises:
    out = "wd/ciudades/%s.json" % p["id"]
    if os.path.exists(out) and os.path.getsize(out) > 100: continue
    open("consultas/_tmp.rq", "w", encoding="utf-8").write(plantilla.replace("ISO", p["id"]))
    r = subprocess.run(["sh", "consultas/wdq.sh", "consultas/_tmp.rq", out], capture_output=True, text=True)
    print(p["id"], r.stdout.strip(), flush=True)
