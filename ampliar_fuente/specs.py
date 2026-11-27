"""Consignas que se completan con listas de Wikidata.
Cada entrada: (consigna exacta, condición SPARQL sobre ?item, mínimo de Wikipedias, tipo)
tipo "cosa": necesita etiqueta en español; "persona": vale la etiqueta en inglés si no hay en español.
"""

def equipo(nombre_en, minimo=12):
    # jugadores de un equipo, buscado por su nombre en inglés
    return ('?team rdfs:label "%s"@en . ?item wdt:P54 ?team . ?item wdt:P31 wd:Q5 .' % nombre_en, minimo, "persona")


def equipo_id(qid, minimo=6):
    return ("?item wdt:P54 wd:%s ; wdt:P31 wd:Q5 ." % qid, minimo, "persona_es")


def futbolistas_de(pais_qid, minimo):
    return ("?item wdt:P106 wd:Q937857 ; wdt:P1532 wd:%s ; wdt:P31 wd:Q5 ." % pais_qid, minimo, "persona")


SPECS = [
    # ---------- Clásica: cosas ----------
    ("Nombra una raza de perro", "?item wdt:P31 wd:Q39367 .", 8, "cosa"),
    ("Nombra una raza de gato", "?item wdt:P31 wd:Q43577 .", 6, "cosa"),
    ("Nombra un tipo de queso", "?item wdt:P279|wdt:P31 wd:Q10943 .", 6, "cosa"),
    ("Nombra un tipo de pasta italiana", "?item wdt:P279|wdt:P31 wd:Q178 .", 5, "cosa"),
    ("Nombra un instrumento musical", "?item wdt:P279+ wd:Q34379 .", 25, "cosa"),
    ("Nombra un mineral o una piedra preciosa", "{ ?item wdt:P31 wd:Q12089225 . } UNION { ?item wdt:P279|wdt:P31 wd:Q83437 . }", 20, "cosa"),
    ("Nombra una constelación", "?item wdt:P31 wd:Q8928 .", 5, "cosa"),
    ("Nombra un juego de mesa", "?item wdt:P31 wd:Q131436 .", 10, "cosa"),
    ("Nombra un género musical", "?item wdt:P31 wd:Q188451 .", 30, "cosa"),
    ("Nombra un lenguaje de programación", "?item wdt:P31/wdt:P279* wd:Q9143 .", 20, "cosa"),
    ("Nombra una moneda (divisa) del mundo", "?item wdt:P31 wd:Q8142 . FILTER NOT EXISTS { ?item wdt:P576 [] }", 15, "cosa"),
    ("Nombra una especia o hierba de cocina", "{ ?item wdt:P279|wdt:P31 wd:Q42527 . } UNION { ?item wdt:P279|wdt:P31 wd:Q207123 . }", 15, "cosa"),
    ("Nombra una marca de autos", "{ ?item wdt:P31 wd:Q786820 . } UNION { ?item wdt:P31 wd:Q44294 . }", 15, "cosa"),
    ("Nombra un superhéroe o superheroína", "{ ?item wdt:P31 wd:Q188784 . } UNION { ?item wdt:P106 wd:Q188784 . } UNION { ?item wdt:P31/wdt:P279 wd:Q188784 . }", 15, "cosa"),
    ("Nombra un dios, diosa o titán de la mitología griega", "{ ?item wdt:P31 wd:Q22989102 . } UNION { ?item wdt:P31 wd:Q12891443 . } UNION { ?item wdt:P31 wd:Q207850 . }", 12, "cosa"),
    ("Nombra un arte marcial o deporte de combate", "?item wdt:P31|wdt:P279 wd:Q11417 .", 12, "cosa"),
    ("Nombra una enfermedad causada por un virus", "?item wdt:P279+ wd:Q1928978 .", 20, "cosa"),
    ("Nombra un postre", "?item wdt:P31|wdt:P279 wd:Q182940 .", 15, "cosa"),
    ("Nombra un platillo mexicano", "?item wdt:P31/wdt:P279* wd:Q746549 ; wdt:P495 wd:Q96 .", 4, "cosa"),
    ("Nombra una sopa o un caldo", "?item wdt:P31|wdt:P279 wd:Q41415 .", 10, "cosa"),
    ("Nombra un tipo de sombrero o gorro", "?item wdt:P279+ wd:Q80151 .", 8, "cosa"),
    ("Nombra un tipo de calzado", "?item wdt:P279+ wd:Q161928 .", 12, "cosa"),
    ("Nombra un estudio desarrollador de videojuegos", "?item wdt:P31 wd:Q210167 .", 20, "cosa"),
    ("Nombra un navegador web", "?item wdt:P31/wdt:P279* wd:Q6368 .", 8, "cosa"),
    ("Nombra una misión, nave o sonda espacial real", "{ ?item wdt:P31 wd:Q26529 . } UNION { ?item wdt:P31 wd:Q40218 . } UNION { ?item wdt:P31 wd:Q752783 . }", 20, "cosa"),
    ("Nombra una batalla histórica", "?item wdt:P31 wd:Q178561 .", 45, "cosa"),
    ("Nombra un deporte de equipo", "?item wdt:P31 wd:Q216048 .", 10, "cosa"),
    ("Nombra un deporte que se juegue en equipo", "?item wdt:P31 wd:Q216048 .", 10, "cosa"),
    ("Nombra un idioma con más de 10 millones de hablantes", "?item wdt:P1098 ?n . ?item wdt:P31/wdt:P279* wd:Q34770 . FILTER(?n >= 10000000)", 20, "cosa"),
    ("Nombra un juego de cartas o naipes", "?item wdt:P31|wdt:P279 wd:Q142714 .", 8, "cosa"),

    # ---------- Clásica: personas ----------
    ("Nombra un artista importante de la historia del arte (pintor, escultor o muralista)", "?item wdt:P106 ?o . VALUES ?o { wd:Q1028181 wd:Q1281618 wd:Q3391743 } ?item wdt:P31 wd:Q5 ; wdt:P135 [] .", 50, "persona"),
    ("Nombra un ganador del Premio Nobel de Física", "?item wdt:P166 wd:Q38104 ; wdt:P31 wd:Q5 .", 1, "persona"),
    ("Nombra un presidente de México (de cualquier época)", "?item wdt:P39 wd:Q628004 ; wdt:P31 wd:Q5 .", 1, "persona_es"),

    # ---------- Deportes ----------
    ("Nombra un jugador de la NBA (actual o histórico)", "?item wdt:P106 wd:Q3665646 ; wdt:P118 wd:Q155223 ; wdt:P31 wd:Q5 .", 25, "persona"),
    ("Nombra un futbolista famoso (actual o histórico)", "?item wdt:P106 wd:Q937857 ; wdt:P31 wd:Q5 ; p:P54/pq:P1350 [] .", 70, "persona"),
    ("Nombra un piloto de Fórmula 1 (actual o histórico)", "?item wdt:P106 wd:Q10841764 ; wdt:P31 wd:Q5 .", 15, "persona"),
    ("Nombra un boxeador mexicano famoso (actual o histórico)", "?item wdt:P106 wd:Q11338576 ; wdt:P27 wd:Q96 ; wdt:P31 wd:Q5 ; wdt:P1967 [] .", 6, "persona_es"),
    ("Nombra un boxeador famoso que no sea mexicano (actual o histórico)", "?item wdt:P106 wd:Q11338576 ; wdt:P31 wd:Q5 ; wdt:P1967 [] . FILTER NOT EXISTS { ?item wdt:P27 wd:Q96 }", 25, "persona"),
    ("Nombra un futbolista español (actual o histórico)",) + futbolistas_de("Q29", 30),
    ("Nombra un futbolista francés (actual o histórico)",) + futbolistas_de("Q142", 30),
    ("Nombra un futbolista italiano (actual o histórico)",) + futbolistas_de("Q38", 30),
    ("Nombra un futbolista alemán (actual o histórico)",) + futbolistas_de("Q183", 30),
    ("Nombra un futbolista inglés (actual o histórico)",) + futbolistas_de("Q21", 30),
    ("Nombra un futbolista mexicano que haya jugado en un club de Europa", "?item wdt:P106 wd:Q937857 ; wdt:P1532 wd:Q96 ; wdt:P54 ?c . ?c wdt:P17 ?pais . ?pais wdt:P30 wd:Q46 .", 8, "persona"),
    ("Nombra un deportista mexicano famoso (de cualquier deporte)", "?item wdt:P27 wd:Q96 ; wdt:P641 [] ; wdt:P31 wd:Q5 . FILTER NOT EXISTS { ?item wdt:P106 wd:Q177220 } FILTER NOT EXISTS { ?item wdt:P106 wd:Q33999 }", 25, "persona_es"),
    ("Nombra un jugador que haya jugado en los Lakers",) + equipo("Los Angeles Lakers"),
    ("Nombra un jugador que haya jugado en los Chicago Bulls (actual o histórico)",) + equipo("Chicago Bulls"),
    ("Nombra un jugador que haya jugado en los Boston Celtics (actual o histórico)",) + equipo("Boston Celtics"),
    ("Nombra un jugador que haya jugado en los Golden State Warriors (actual o histórico)",) + equipo("Golden State Warriors"),
    ("Nombra un jugador que haya jugado en los San Antonio Spurs (actual o histórico)",) + equipo("San Antonio Spurs"),
    ("Nombra un jugador que haya jugado en el Heat de Miami (actual o histórico)",) + equipo("Miami Heat"),
    ("Nombra un jugador que haya jugado en los Dallas Cowboys (actual o histórico)",) + equipo("Dallas Cowboys", 8),
    ("Nombra un jugador que haya jugado en los New England Patriots (actual o histórico)",) + equipo("New England Patriots", 8),
    ("Nombra un jugador que haya jugado en los Steelers de Pittsburgh (actual o histórico)",) + equipo("Pittsburgh Steelers", 8),
    ("Nombra un jugador que haya jugado en los Packers de Green Bay (actual o histórico)",) + equipo("Green Bay Packers", 8),
    ("Nombra un pelotero que haya jugado en los New York Yankees (actual o histórico)",) + equipo("New York Yankees", 10),
    ("Nombra un futbolista que haya jugado en el Manchester United",) + equipo("Manchester United F.C.", 20),
    ("Nombra un futbolista que haya jugado en el Liverpool (actual o histórico)",) + equipo("Liverpool F.C.", 20),
    ("Nombra un futbolista que haya jugado en el Arsenal (actual o histórico)",) + equipo("Arsenal F.C.", 20),
    ("Nombra un jugador histórico del Real Madrid o del FC Barcelona", '?team rdfs:label ?tn . VALUES ?tn { "Real Madrid CF"@en "FC Barcelona"@en } ?item wdt:P54 ?team ; wdt:P31 wd:Q5 .', 35, "persona"),
    ("Nombra un futbolista que haya jugado en el Club América",) + equipo_id("Q459090", 6),
    ("Nombra un futbolista que haya jugado en las Chivas de Guadalajara",) + equipo_id("Q503321", 6),
    ("Nombra un futbolista que haya jugado en Cruz Azul (actual o histórico)",) + equipo_id("Q845859", 6),
    ("Nombra un futbolista que haya jugado en los Pumas de la UNAM (actual o histórico)",) + equipo_id("Q1143000", 6),
    ("Nombra un futbolista que haya jugado en los Tigres de la UANL (actual o histórico)",) + equipo_id("Q849823", 6),
    ("Nombra un club de fútbol de Sudamérica", "?item wdt:P31 wd:Q476028 ; wdt:P17 ?p . ?p wdt:P30 wd:Q18 .", 15, "club"),
]
