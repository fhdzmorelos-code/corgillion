"""Genera la base de datos de países (paises.json) y las consignas de la categoría Geografía.

Fuentes: mledoze/countries (nombres, capitales, regiones, fronteras, idiomas, superficie) y
Banco Mundial (población 2023). Las listas especiales (monarquías, UE, etc.) están escritas a mano abajo.

Uso:  python geografia_fuente/generar.py   (desde la carpeta del proyecto; necesita mledoze.json y wb.json en geografia_fuente/)
"""
import io, json, math, os, re, sys, unicodedata
sys.stdout.reconfigure(encoding="utf-8")
AQUI = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(AQUI)

m = json.load(io.open(os.path.join(AQUI, "mledoze.json"), encoding="utf-8"))
wb = {r["countryiso3code"]: r["value"] for r in json.load(io.open(os.path.join(AQUI, "wb.json"), encoding="utf-8"))[1] if r["value"]}
wb["UNK"] = wb.get("XKX"); wb["VAT"] = 800; wb["TWN"] = 23400000
sel = [c for c in m if c.get("unMember") or c["cca3"] in ("VAT", "PSE", "UNK", "TWN")]

# ---------- nombres en español (el primero se muestra; el resto son alias) ----------
NOMBRE = {
    "IRN": "Irán", "BHR": "Baréin/Bahréin/Bahrein", "BWA": "Botsuana/Botswana", "SLE": "Sierra Leona/Sierra Leone",
    "DJI": "Yibuti/Djibouti", "COD": "República Democrática del Congo/RD Congo/Congo-Kinsasa/Congo Kinshasa",
    "COG": "República del Congo/Congo/Congo-Brazzaville", "GRD": "Granada/Grenada", "SAU": "Arabia Saudita/Arabia Saudí",
    "CZE": "Chequia/República Checa", "MMR": "Myanmar/Birmania", "SWZ": "Esuatini/Suazilandia/Eswatini",
    "USA": "Estados Unidos/EUA/EEUU/EE. UU./USA/Estados Unidos de América", "GBR": "Reino Unido/Gran Bretaña/UK",
    "NLD": "Países Bajos/Holanda", "TLS": "Timor Oriental/Timor-Leste", "MKD": "Macedonia del Norte/Macedonia",
    "VAT": "Vaticano/Ciudad del Vaticano/Santa Sede", "KGZ": "Kirguistán/Kirguizistán", "MDA": "Moldavia/Moldova",
    "BLR": "Bielorrusia/Belarús", "GNB": "Guinea-Bisáu/Guinea-Bissau", "QAT": "Catar/Qatar", "KEN": "Kenia/Kenya",
    "RWA": "Ruanda/Rwanda", "ZWE": "Zimbabue/Zimbabwe", "MWI": "Malaui/Malawi", "LSO": "Lesoto/Lesotho", "FJI": "Fiyi/Fiji",
    "KWT": "Kuwait/Kuwáit", "BRN": "Brunéi/Brunei", "MLI": "Malí/Mali", "ARE": "Emiratos Árabes Unidos/Emiratos Árabes/EAU",
    "BIH": "Bosnia y Herzegovina/Bosnia", "CAF": "República Centroafricana/Centroáfrica", "DOM": "República Dominicana/Dominicana",
    "PNG": "Papúa Nueva Guinea", "TTO": "Trinidad y Tobago", "KNA": "San Cristóbal y Nieves", "VCT": "San Vicente y las Granadinas/San Vicente y Granadinas",
    "STP": "Santo Tomé y Príncipe", "ATG": "Antigua y Barbuda", "UNK": "Kosovo", "PSE": "Palestina", "TWN": "Taiwán/Taiwan",
    "KOR": "Corea del Sur", "PRK": "Corea del Norte", "SUR": "Surinam/Suriname", "BEN": "Benín/Benin", "TCD": "Chad",
    "GUY": "Guyana", "BTN": "Bután/Bhutan", "NER": "Níger/Niger", "OMN": "Omán/Oman", "TKM": "Turkmenistán",
    "CPV": "Cabo Verde", "SGP": "Singapur", "PHL": "Filipinas", "CIV": "Costa de Marfil", "GNQ": "Guinea Ecuatorial",
    "SSD": "Sudán del Sur", "FSM": "Micronesia/Estados Federados de Micronesia", "MHL": "Islas Marshall", "SLB": "Islas Salomón",
    "LIE": "Liechtenstein", "AZE": "Azerbaiyán", "UKR": "Ucrania", "KAZ": "Kazajistán/Kazajstán",
}
# ---------- capitales en español (si difieren de la fuente); varias con "/" son alias ----------
CAPITAL = {
    "ARE": "Abu Dabi/Abu Dhabi", "ARM": "Ereván/Yerevan", "ATG": "Saint John/Saint John's", "AUT": "Viena", "AZE": "Bakú/Baku",
    "BEL": "Bruselas", "BFA": "Uagadugú/Ouagadougou", "BGD": "Daca/Dhaka", "BGR": "Sofía", "BRA": "Brasilia",
    "BTN": "Timbu/Thimphu", "CHE": "Berna", "CHN": "Pekín/Beijing", "CIV": "Yamusukro/Yamoussoukro", "CMR": "Yaundé",
    "CUB": "La Habana/Habana", "CZE": "Praga", "DEU": "Berlín", "DJI": "Yibuti/Djibouti", "DNK": "Copenhague",
    "DZA": "Argel", "EGY": "El Cairo/Cairo", "ETH": "Adís Abeba/Addis Abeba", "FRA": "París", "GBR": "Londres",
    "GEO": "Tiflis/Tbilisi", "GNQ": "Malabo/Ciudad de la Paz", "GRC": "Atenas", "GRD": "Saint George/Saint George's",
    "GTM": "Ciudad de Guatemala/Guatemala", "HTI": "Puerto Príncipe", "IDN": "Yakarta", "IND": "Nueva Delhi/Delhi",
    "IRL": "Dublín", "IRN": "Teherán", "IRQ": "Bagdad", "ISL": "Reikiavik/Reykjavik", "ISR": "Jerusalén", "ITA": "Roma",
    "JOR": "Amán", "JPN": "Tokio", "KGZ": "Biskek/Bishkek", "KHM": "Nom Pen/Phnom Penh", "KIR": "Tarawa/Tarawa Sur",
    "KOR": "Seúl", "KWT": "Ciudad de Kuwait/Kuwait", "LAO": "Vientián/Vientiane", "LBN": "Beirut", "LBY": "Trípoli",
    "LUX": "Luxemburgo/Ciudad de Luxemburgo", "MCO": "Mónaco", "MDA": "Chisináu/Chisinau/Kishinev", "MEX": "Ciudad de México/CDMX/DF",
    "MKD": "Skopie/Skopje", "MMR": "Naipyidó/Naypyidaw", "MNG": "Ulán Bator/Ulan Bator", "MRT": "Nuakchot/Nouakchott",
    "NGA": "Abuya/Abuja", "NLD": "Ámsterdam", "NPL": "Katmandú", "OMN": "Mascate", "PAN": "Ciudad de Panamá/Panamá",
    "POL": "Varsovia", "PRK": "Pionyang/Pyongyang", "PRT": "Lisboa", "PSE": "Ramala/Ramallah", "ROU": "Bucarest",
    "RUS": "Moscú", "SAU": "Riad", "SDN": "Jartum", "SGP": "Singapur", "SMR": "San Marino/Ciudad de San Marino",
    "SOM": "Mogadiscio", "SRB": "Belgrado", "STP": "Santo Tomé", "SVN": "Liubliana/Ljubljana", "SWE": "Estocolmo",
    "SWZ": "Mbabane/Lobamba", "SYR": "Damasco", "TCD": "Yamena/N'Djamena", "TJK": "Dusambé/Dushanbe", "TKM": "Asjabad/Ashgabat",
    "TTO": "Puerto España", "TUN": "Túnez", "TWN": "Taipéi/Taipei", "UKR": "Kiev/Kyiv", "USA": "Washington/Washington D.C.",
    "UZB": "Taskent/Tashkent", "VAT": "Ciudad del Vaticano", "VNM": "Hanói/Hanoi", "YEM": "Saná/Sanaa", "BOL": "Sucre",
    "LKA": "Colombo/Sri Jayawardenepura Kotte/Kotte", "BDI": "Gitega", "KAZ": "Astaná/Astana", "AUS": "Canberra",
}
CAP_EXTRA = {"BOL": ["La Paz"], "ZAF": ["Ciudad del Cabo", "Bloemfontein"]}  # países con más de una capital

RAW_REGION = {"Africa": "Africa", "Americas": "Americas", "Asia": "Asia", "Europe": "Europe", "Oceania": "Oceania"}
CONT_EXTRA = {"TUR": ["Europa"], "KAZ": ["Europa"], "RUS": ["Asia"], "GEO": ["Europa"], "AZE": ["Europa"], "ARM": ["Europa"],
              "CYP": ["Asia"], "EGY": ["Asia"]}
CONT = {"Africa": "África", "Asia": "Asia", "Europe": "Europa", "Oceania": "Oceanía"}

S = lambda s: set(s.split())
MONARQUIA = S("AND ARE BHR BEL BTN BRN KHM DNK SWZ JPN JOR KWT LSO LIE LUX MYS MCO MAR NLD NOR OMN QAT SAU ESP SWE THA TON GBR VAT "
              "ATG AUS BHS BLZ CAN GRD JAM NZL PNG KNA LCA VCT SLB TUV")
UE = S("AUT BEL BGR HRV CYP CZE DNK EST FIN FRA DEU GRC HUN IRL ITA LVA LTU LUX MLT NLD POL PRT ROU SVK SVN ESP SWE")
URSS = S("ARM AZE BLR EST GEO KAZ KGZ LVA LTU MDA RUS TJK TKM UKR UZB")
NUCLEAR = S("USA RUS GBR FRA CHN IND PAK PRK ISR")
MEDIT = S("ESP FRA MCO ITA MLT SVN HRV BIH MNE ALB GRC TUR CYP SYR LBN ISR PSE EGY LBY TUN DZA MAR")
OTAN = S("ALB BEL BGR CAN HRV CZE DNK EST FIN FRA DEU GRC HUN ISL ITA LVA LTU LUX MNE NLD MKD NOR POL PRT ROU SVK SVN ESP SWE TUR GBR USA")
IZQUIERDA = S("AUS NZL GBR IRL MLT CYP IND PAK BGD LKA NPL BTN MDV JPN THA MYS SGP IDN BRN TLS PNG FJI SLB TON TUV KIR NRU WSM "
              "ZAF BWA NAM LSO SWZ MOZ ZMB ZWE MWI TZA KEN UGA MUS SYC JAM BHS BRB TTO GUY SUR ATG DMA GRD KNA LCA VCT")
ECUADOR = S("ECU COL BRA STP GAB COG COD UGA KEN SOM MDV IDN KIR")
CAP_NO_MAYOR = S("AUS CAN BRA USA TUR CHE NZL NGA PAK KAZ MMR TZA CIV MAR ECU BOL ZAF CHN VNM BEN MLT BLZ ARE CMR PHL LKA GNQ LIE")
ORIENTE_MEDIO = S("BHR CYP EGY IRN IRQ ISR JOR KWT LBN OMN PSE QAT SAU SYR TUR ARE YEM")
FAMOSOS = S("USA MEX ESP FRA ITA DEU JPN CHN BRA ARG CAN RUS GBR IND AUS EGY COL PER CHL CUB KOR PRT GRC TUR VEN NLD CHE "
            "BEL SWE NOR IRL ISR ZAF NGA MAR THA IDN PHL VNM KEN UKR POL")
CAPFAM = S("FRA GBR ESP ITA JPN USA MEX ARG DEU RUS CHN PER COL CHL CUB VEN CAN BRA PRT GRC EGY KOR IND THA NLD AUT BEL IRL "
           "NOR SWE DNK POL CZE HUN ECU URY PRY BOL GTM CRI PAN SLV HND NIC DOM UKR ISR TUR AUS CHE FIN")


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(ch for ch in s if unicodedata.category(ch) != "Mn"))


paises = []
for c in sel:
    k = c["cca3"]
    es = NOMBRE.get(k, c["translations"]["spa"]["common"]).split("/")
    en = c["name"]["common"]
    if norm(en) not in [norm(x) for x in es]:
        es.append(en)
    cap = CAPITAL.get(k, (c["capital"] or [""])[0]).split("/")
    if c["capital"] and norm(c["capital"][0]) not in [norm(x) for x in cap]:
        cap.append(c["capital"][0])
    reg, sub = c["region"], c["subregion"]
    cont = []
    if reg == "Americas":
        cont = ["Sudamérica"] if sub == "South America" else ["Norteamérica"]
    else:
        cont = [CONT[reg]]
    cont += CONT_EXTRA.get(k, [])
    lat = c["latlng"][0]
    paises.append({
        "id": k, "nombres": es, "capital": cap, "capitales_extra": CAP_EXTRA.get(k, []), "continentes": cont, "subregion": sub,
        "fronteras": c.get("borders", []), "idiomas": sorted(c.get("languages", {}).values()),
        "superficie": c.get("area"), "poblacion": wb.get(k), "sin_mar": bool(c.get("landlocked")),
        "monarquia": k in MONARQUIA, "ue": k in UE, "urss": k in URSS, "nuclear": k in NUCLEAR, "mediterraneo": k in MEDIT,
        "otan": k in OTAN, "izquierda": k in IZQUIERDA, "ecuador": k in ECUADOR,
        "capital_sur": (lat < 0 and k != "GAB") or k == "KEN", "capital_no_mayor": k in CAP_NO_MAYOR,
        "oriente_medio": k in ORIENTE_MEDIO,
    })
P = {p["id"]: p for p in paises}
for p in paises:
    p["fronteras"] = [b for b in p["fronteras"] if b in P]
json.dump(paises, io.open(os.path.join(AQUI, "paises.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)


# ---------- fama y niveles ----------
def fama(p):
    pop = p["poblacion"] or 1000
    f = max(0, min(1, (math.log10(pop) - 5) / 4)) * 0.55
    if p["id"] in FAMOSOS: f += 0.25
    if "Spanish" in p["idiomas"]: f += 0.10
    if p["continentes"][0] in ("Norteamérica", "Sudamérica", "Europa"): f += 0.08
    return min(1, f)


def fama_cap(p):
    return fama(p) * 0.6 + (0.35 if p["id"] in CAPFAM else 0)


CORTES, PCT = [0.30, 0.42, 0.54, 0.66, 0.78], [0.12, 0.35, 0.60, 0.80, 0.93]


def niveles(items):
    """items: [(texto_con_alias, fama)] -> 6 cadenas."""
    items = sorted(items, key=lambda x: -x[1])
    out = [[] for _ in range(6)]
    for i, (t, f) in enumerate(items):
        o = 1 - f
        a = next((j for j, c in enumerate(CORTES) if o < c), 5)
        r = next((j for j, c in enumerate(PCT) if i / len(items) < c), 5)
        out[0 if i == 0 else round((a + r) / 2)].append(t)
    return [";".join(x) for x in out]


nom = lambda p: "/".join(p["nombres"])
prim = lambda p: norm(p["nombres"][0])


def paises_que(f):
    return [(nom(p), fama(p)) for p in paises if f(p)]


def capitales_que(f):
    out = []
    for p in paises:
        if f(p):
            out.append(("/".join(p["capital"]), fama_cap(p)))
            for x in p["capitales_extra"]:
                out.append((x, fama_cap(p) - 0.1))
    return out


def paises_cont(c):
    """Países de un continente; los transcontinentales (p. ej. Egipto en Asia) cuentan como respuesta rara."""
    return [(nom(p), fama(p) - (0 if p["continentes"][0] == c else 0.35)) for p in paises if c in p["continentes"]]


limita = lambda *ids: (lambda p: any(i in p["fronteras"] for i in ids))
en_cont = lambda c: (lambda p: c in p["continentes"])
habla = lambda l: (lambda p: l in p["idiomas"])
vocales = set("aeiou")

CONSIGNAS = [
    # continentes y regiones
    ("Nombra un país de Asia", paises_cont("Asia")),
    ("Nombra un país de Europa", paises_cont("Europa")),
    ("Nombra un país de África", paises_cont("África")),
    ("Nombra un país de Sudamérica", paises_cont("Sudamérica")),
    ("Nombra un país de Norteamérica, Centroamérica o el Caribe", paises_que(en_cont("Norteamérica"))),
    ("Nombra un país de Oceanía", paises_que(en_cont("Oceanía"))),
    ("Nombra un país de Medio Oriente", paises_que(lambda p: p["oriente_medio"])),
    ("Nombra un país de Europa del Este", paises_que(lambda p: p["id"] in S("BLR BGR CZE HUN MDA POL ROU RUS SVK UKR"))),
    ("Nombra un país de los Balcanes", paises_que(lambda p: p["id"] in S("ALB BIH BGR HRV GRC UNK MNE MKD SRB SVN ROU"))),
    ("Nombra un país del Sudeste Asiático", paises_que(lambda p: p["subregion"] == "South-Eastern Asia")),
    ("Nombra un país de África Occidental", paises_que(lambda p: p["subregion"] == "Western Africa")),
    ("Nombra un país de África Oriental", paises_que(lambda p: p["subregion"] == "Eastern Africa")),
    ("Nombra un país del Caribe", paises_que(lambda p: p["subregion"] == "Caribbean")),
    ("Nombra un país del norte de Europa (nórdicos, bálticos o islas británicas)", paises_que(lambda p: p["subregion"] == "Northern Europe")),
    # capitales
    ("Nombra la capital de un país de Asia", capitales_que(en_cont("Asia"))),
    ("Nombra la capital de un país de África", capitales_que(en_cont("África"))),
    ("Nombra la capital de un país de Europa", capitales_que(en_cont("Europa"))),
    ("Nombra la capital de un país de Sudamérica", capitales_que(en_cont("Sudamérica"))),
    ("Nombra la capital de un país de Norteamérica, Centroamérica o el Caribe", capitales_que(en_cont("Norteamérica"))),
    ("Nombra la capital de un país de Oceanía", capitales_que(en_cont("Oceanía"))),
    ("Nombra una capital nacional al sur del ecuador", capitales_que(lambda p: p["capital_sur"])),
    ("Nombra una capital que no sea la ciudad más grande de su país", capitales_que(lambda p: p["capital_no_mayor"])),
    ("Nombra la capital de un país que empiece con A, B o C", capitales_que(lambda p: prim(p)[:1] in "abc")),
    ("Nombra la capital de un país de la Unión Europea", capitales_que(lambda p: p["ue"])),
    # fronteras
    ("Nombra un país que tenga frontera terrestre con Alemania", paises_que(limita("DEU"))),
    ("Nombra un país que tenga frontera terrestre con China", paises_que(limita("CHN"))),
    ("Nombra un país que tenga frontera terrestre con Rusia", paises_que(limita("RUS"))),
    ("Nombra un país que tenga frontera terrestre con Francia", paises_que(limita("FRA"))),
    ("Nombra un país que tenga frontera con Irak o con Irán", paises_que(limita("IRQ", "IRN"))),
    ("Nombra un país que tenga frontera con Austria o con Grecia", paises_que(limita("AUT", "GRC"))),
    ("Nombra un país que tenga frontera terrestre con al menos cinco países", paises_que(lambda p: len(p["fronteras"]) >= 5)),
    ("Nombra un país que tenga frontera terrestre con un solo país", paises_que(lambda p: len(p["fronteras"]) == 1)),
    ("Nombra un país sin salida al mar", paises_que(lambda p: p["sin_mar"])),
    ("Nombra un país sin fronteras terrestres (una isla o un archipiélago)", paises_que(lambda p: not p["fronteras"] and not p["sin_mar"])),
    # idiomas
    ("Nombra un país donde el español sea idioma oficial", paises_que(habla("Spanish"))),
    ("Nombra un país donde el inglés sea idioma oficial", paises_que(habla("English"))),
    ("Nombra un país de África donde el francés sea idioma oficial", paises_que(lambda p: habla("French")(p) and "África" in p["continentes"])),
    ("Nombra un país donde el árabe sea idioma oficial", paises_que(habla("Arabic"))),
    ("Nombra un país donde el portugués sea idioma oficial", paises_que(habla("Portuguese"))),
    ("Nombra un país de América donde el español NO sea idioma oficial", paises_que(lambda p: p["continentes"][0] in ("Norteamérica", "Sudamérica") and not habla("Spanish")(p))),
    # tamaño y población
    ("Nombra un país con más de 100 millones de habitantes", paises_que(lambda p: (p["poblacion"] or 0) > 100e6)),
    ("Nombra un país con menos de un millón de habitantes", paises_que(lambda p: (p["poblacion"] or 0) < 1e6)),
    ("Nombra un país más grande que México en superficie", paises_que(lambda p: (p["superficie"] or 0) > 1964375)),
    ("Nombra un país más grande que España en superficie", paises_que(lambda p: (p["superficie"] or 0) > 505990)),
    ("Nombra un país de Europa con más de 10 millones de habitantes", paises_que(lambda p: "Europa" in p["continentes"] and (p["poblacion"] or 0) > 10e6)),
    # listas
    ("Nombra un país cuyo jefe de Estado sea un rey, una reina u otro monarca", paises_que(lambda p: p["monarquia"])),
    ("Nombra un país de la Unión Europea", paises_que(lambda p: p["ue"])),
    ("Nombra un país que haya formado parte de la Unión Soviética", paises_que(lambda p: p["urss"])),
    ("Nombra un país que tenga armas nucleares", paises_que(lambda p: p["nuclear"])),
    ("Nombra un país con costa en el mar Mediterráneo", paises_que(lambda p: p["mediterraneo"])),
    ("Nombra un país miembro de la OTAN", paises_que(lambda p: p["otan"])),
    ("Nombra un país donde se maneje por la izquierda", paises_que(lambda p: p["izquierda"])),
    ("Nombra un país que atraviese la línea del ecuador", paises_que(lambda p: p["ecuador"])),
    # letras (nombre en español)
    ("Nombra un país cuyo nombre empiece con A", paises_que(lambda p: prim(p).startswith("a"))),
    ("Nombra un país cuyo nombre empiece con B", paises_que(lambda p: prim(p).startswith("b"))),
    ("Nombra un país cuyo nombre empiece con M", paises_que(lambda p: prim(p).startswith("m"))),
    ("Nombra un país cuyo nombre empiece con T", paises_que(lambda p: prim(p).startswith("t"))),
    ("Nombra un país cuyo nombre empiece con P o con L", paises_que(lambda p: prim(p)[:1] in "pl")),
    ("Nombra un país cuyo nombre empiece con una vocal", paises_que(lambda p: prim(p)[:1] in vocales)),
    ("Nombra un país cuyo nombre termine en A", paises_que(lambda p: prim(p).endswith("a"))),
    ("Nombra un país cuyo nombre termine en O", paises_que(lambda p: prim(p).endswith("o"))),
    ("Nombra un país cuyo nombre lleve la letra Z", paises_que(lambda p: "z" in prim(p))),
    ("Nombra un país cuyo nombre lleve la letra H", paises_que(lambda p: "h" in prim(p))),
    ("Nombra un país cuyo nombre tenga exactamente cuatro letras", paises_que(lambda p: len(prim(p)) == 4)),
    ("Nombra un país cuyo nombre tenga diez letras o más", paises_que(lambda p: len(prim(p)) >= 10)),
    ("Nombra un país cuyo nombre tenga dos palabras o más", paises_que(lambda p: len(p["nombres"][0].split()) >= 2)),
    ("Nombra un país cuyo nombre no lleve la letra A", paises_que(lambda p: "a" not in prim(p))),
]

# Consignas de Clásica que ya existían y se completan con todos los países (no se crean nuevas).
COMPLETAR_CLASICA = [
    ("Nombra un país cuyo nombre en español empiece con C", paises_que(lambda p: prim(p).startswith("c"))),
    ("Nombra un país cuyo nombre en español tenga exactamente cinco letras", paises_que(lambda p: len(prim(p)) == 5)),
    ("Nombra un país cuyo nombre en español termine en la letra N", paises_que(lambda p: prim(p).endswith("n"))),
    ("Nombra un país cuyo nombre en español empiece con la letra S", paises_que(lambda p: prim(p).startswith("s"))),
    ("Nombra un país que tenga frontera con Brasil", paises_que(limita("BRA"))),
    ("Nombra un país donde el francés sea idioma oficial", paises_que(habla("French"))),
    ("Nombra un país de Sudamérica", paises_cont("Sudamérica")),
    ("Nombra un país de África", paises_cont("África")),
    ("Nombra un país de Asia", paises_cont("Asia")),
    ("Nombra un país europeo que NO pertenezca a la Unión Europea", paises_que(lambda p: "Europa" in p["continentes"] and not p["ue"])),
    ("Nombra una capital europea", capitales_que(en_cont("Europa"))),
    ("Nombra la capital de un país de América", capitales_que(lambda p: p["continentes"][0] in ("Norteamérica", "Sudamérica"))),
    ("Nombra un país que sea una isla o un archipiélago", paises_que(lambda p: not p["fronteras"] and not p["sin_mar"])),
]


def fila(q, items):
    lv = niveles(items)
    return "  [" + json.dumps(q, ensure_ascii=False) + ",\n" + ",\n".join("    " + json.dumps(x, ensure_ascii=False) for x in lv) + "]"


ok = [(q, it) for q, it in CONSIGNAS if 8 <= len(it) <= 200]
for q, it in CONSIGNAS:
    print(len(it), q, "" if 8 <= len(it) <= 200 else "  <-- DESCARTADA")
with io.open(os.path.join(PROJ, "data", "geografia_modo.js"), "w", encoding="utf-8") as f:
    f.write("// Categoría Geografía: consignas generadas con la base de datos de países (geografia_fuente/paises.json).\n")
    f.write("// No editar a mano: se regenera con  python geografia_fuente/generar.py\n")
    f.write('CC.add("geografia", { name: "Geografía", color: "#2f9fd6", desc: "Países, capitales, fronteras, idiomas, ciudades, ríos, montañas y más." }, [\n')
    f.write(",\n\n".join(fila(q, it) for q, it in ok) + "\n]);\n\n")
    f.write("// Respuestas que se AGREGAN a consignas de Clásica que ya existían.\n")
    f.write('CC.completarFilas("clasica", [\n' + ",\n\n".join(fila(q, it) for q, it in COMPLETAR_CLASICA) + "\n]);\n")
print("consignas:", len(ok), "países:", len(paises))
