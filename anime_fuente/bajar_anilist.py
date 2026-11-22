# Baja de AniList (API pública) los anime y los personajes más populares. Trae el id de MyAnimeList de cada anime.
# Uso (desde anime_fuente):  python bajar_anilist.py anime   |   python bajar_anilist.py personajes
# Guarda al/anime_NNN.json y al/pers_NNN.json; salta las páginas que ya existen.
import io, json, os, subprocess, sys, time

ANIME = """query($p:Int){Page(page:$p,perPage:50){pageInfo{hasNextPage} media(type:ANIME,isAdult:false,sort:POPULARITY_DESC){
 id idMal title{romaji english} synonyms format episodes seasonYear startDate{year} popularity averageScore genres
 tags{name rank isAdult} studios(isMain:true){nodes{name}} countryOfOrigin}}}"""
PERS = """query($p:Int){Page(page:$p,perPage:25){pageInfo{hasNextPage} characters(sort:FAVOURITES_DESC){
 id name{full alternative} favourites media(perPage:8,sort:POPULARITY_DESC,type:ANIME){edges{characterRole node{id}}}}}}"""
TIPO = sys.argv[1]
CONSULTA, PREF, TOPE = (ANIME, "anime", 500) if TIPO == "anime" else (PERS, "pers", 320)
os.makedirs("al", exist_ok=True)


def pedir(p, sal):
    io.open("al/_q.json", "w", encoding="utf-8").write(json.dumps({"query": CONSULTA, "variables": {"p": p}}))
    for intento in range(6):
        r = subprocess.run(["curl", "-sS", "-m", "60", "-X", "POST", "https://graphql.anilist.co", "-H", "Content-Type: application/json",
                            "-H", "Accept: application/json", "-A", "TriviaAnimeBuilder/1.0 (educational game data)",
                            "--data-binary", "@al/_q.json", "-o", sal, "-w", "%{http_code}"], capture_output=True, text=True)
        if r.stdout.strip() == "200":
            return True
        print("pagina", p, "http", r.stdout, r.stderr[:120], flush=True)
        time.sleep(30 if r.stdout.strip() == "429" else 8)
    if os.path.exists(sal):
        os.remove(sal)
    return False


p = 1
while p <= TOPE:
    sal = "al/%s_%03d.json" % (PREF, p)
    if not os.path.exists(sal):
        if not pedir(p, sal):
            print("no se pudo la pagina", p)
            break
        time.sleep(2.3)
    d = json.load(io.open(sal, encoding="utf-8"))["data"]["Page"]
    if p % 25 == 0:
        print(p, flush=True)
    if not d["pageInfo"]["hasNextPage"]:
        print("fin en pagina", p)
        break
    p += 1
print("listo", p)
