# Para títulos conocidos sin nombre en español en Wikidata, toma el título de su artículo en Wikipedia en español.
# Guarda wd/sitelinks.json {QID: {"es": título eswiki, "en": título enwiki}}.
import io, json, os, subprocess, urllib.parse, time
T = json.load(io.open("cinedb.json", encoding="utf-8"))
quiero = [t["q"] for t in T if t.get("q") and (not t.get("es") or not t.get("en")) and t["v"] >= 5000]
prev = json.load(io.open("wd/sitelinks.json", encoding="utf-8")) if os.path.exists("wd/sitelinks.json") else {}
quiero = [q for q in quiero if q not in prev]
print(len(quiero), "por pedir")
for i in range(0, len(quiero), 50):
    ids = "|".join(quiero[i:i + 50])
    url = "https://www.wikidata.org/w/api.php?action=wbgetentities&props=sitelinks&sitefilter=eswiki|enwiki&format=json&ids=" + urllib.parse.quote(ids)
    r = subprocess.run(["curl", "-sS", url, "-A", "TriviaCineBuilder/1.0 (educational game data)", "-m", "60"], capture_output=True, text=True, encoding="utf-8")
    try:
        for q, e in json.loads(r.stdout)["entities"].items():
            sl = e.get("sitelinks", {})
            prev[q] = {"es": sl.get("eswiki", {}).get("title"), "en": sl.get("enwiki", {}).get("title")}
    except Exception as ex:
        print("fallo", i, ex); time.sleep(20)
    time.sleep(1.5)
json.dump(prev, io.open("wd/sitelinks.json", "w", encoding="utf-8"), ensure_ascii=False)
print(sum(1 for v in prev.values() if v["es"]), "con artículo en español")
