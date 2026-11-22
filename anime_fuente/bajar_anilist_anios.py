# AniList solo deja paginar 5,000 resultados por consulta. Este script baja el resto del catálogo año por año,
# solo los anime menos populares que el último de al/anime_100.json. Uso (desde anime_fuente): python bajar_anilist_anios.py
# Guarda al/anime_AAAA_NNN.json y salta las páginas que ya existen.
import io, json, os, subprocess, time

Q = """query($p:Int,$a:String,$m:Int){Page(page:$p,perPage:50){pageInfo{hasNextPage}
 media(type:ANIME,isAdult:false,sort:POPULARITY_DESC,startDate_like:$a,popularity_lesser:$m){
 id idMal title{romaji english} synonyms format episodes seasonYear startDate{year} popularity averageScore genres
 tags{name rank isAdult} studios(isMain:true){nodes{name}} countryOfOrigin}}}"""
TOPE_POP = json.load(io.open("al/anime_100.json", encoding="utf-8"))["data"]["Page"]["media"][-1]["popularity"] + 1
print("popularidad menor a", TOPE_POP, flush=True)


def pedir(p, anio, sal):
    tmp = "al/_q_anios.json"
    io.open(tmp, "w", encoding="utf-8").write(json.dumps({"query": Q, "variables": {"p": p, "a": "%d%%" % anio, "m": TOPE_POP}}))
    for intento in range(6):
        r = subprocess.run(["curl", "-sS", "-m", "60", "-X", "POST", "https://graphql.anilist.co", "-H", "Content-Type: application/json",
                            "-H", "Accept: application/json", "-A", "TriviaAnimeBuilder/1.0 (educational game data)",
                            "--data-binary", "@" + tmp, "-o", sal + ".tmp", "-w", "%{http_code}"], capture_output=True, text=True)
        if r.stdout.strip() == "200":
            os.replace(sal + ".tmp", sal)
            return True
        print(anio, p, "http", r.stdout, r.stderr[:120], flush=True)
        time.sleep(30 if r.stdout.strip() == "429" else 8)
    if os.path.exists(sal + ".tmp"):
        os.remove(sal + ".tmp")
    return False


for anio in range(2027, 1959, -1):
    p = 1
    while p <= 100:
        sal = "al/anime_%d_%03d.json" % (anio, p)
        if not os.path.exists(sal):
            if not pedir(p, anio, sal):
                print("no se pudo", anio, p, flush=True)
                break
            time.sleep(2.3)
        d = json.load(io.open(sal, encoding="utf-8"))["data"]["Page"]
        if not d["pageInfo"]["hasNextPage"]:
            break
        p += 1
    print(anio, "paginas", p, flush=True)
print("listo")
