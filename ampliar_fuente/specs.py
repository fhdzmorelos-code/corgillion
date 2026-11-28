"""Consignas que se completan con listas de Wikidata.
Cada entrada: (consigna exacta, condición SPARQL sobre ?item, mínimo de Wikipedias, tipo)
tipo "cosa": necesita etiqueta en español; "persona": vale la etiqueta en inglés si no hay en español.
"""

def equipo(nombre_en, minimo=12):
    # jugadores de un equipo, buscado por su nombre en inglés
    return ('?team rdfs:label "%s"@en . ?item wdt:P54 ?team . ?item wdt:P31 wd:Q5 .' % nombre_en, minimo, "persona")


def equipo_id(qid, minimo=6):
    return ("?item wdt:P54 wd:%s ; wdt:P31 wd:Q5 ." % qid, minimo, "persona_es")


def personajes(qids, minimo=3):
    # personajes de ficción que aparecen en la obra o pertenecen a su universo o franquicia
    vals = " ".join("wd:" + q for q in qids.split())
    return ("VALUES ?w { %s } { ?item wdt:P1441 ?w } UNION { ?item wdt:P1080 ?w } UNION { ?item wdt:P8345 ?w } "
            "?item wdt:P31/wdt:P279* wd:Q95074 ." % vals, minimo, "persona_es")


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

    # ---------- segunda ronda: música ----------
    ("Nombra un compositor de música clásica", "?item wdt:P106 wd:Q36834 ; wdt:P31 wd:Q5 ; wdt:P136|wdt:P101 wd:Q9730 .", 30, "persona"),
    ("Nombra una cantante de pop", "?item wdt:P106 wd:Q177220 ; wdt:P136 wd:Q37073 ; wdt:P21 wd:Q6581072 ; wdt:P31 wd:Q5 .", 40, "persona"),
    ("Nombra un cantante o grupo de reguetón", '?g rdfs:label "reggaeton"@en . ?item wdt:P136 ?g . { ?item wdt:P31 wd:Q5 . } UNION { ?item wdt:P31/wdt:P279* wd:Q215380 . }', 8, "persona"),
    ("Nombra una banda de rock del Reino Unido", "?item wdt:P31/wdt:P279* wd:Q215380 ; wdt:P136/wdt:P279* wd:Q11399 ; wdt:P495 wd:Q145 .", 25, "persona"),
    ("Nombra una canción de Shakira", "?item wdt:P175 wd:Q34424 . ?item wdt:P31 ?t . VALUES ?t { wd:Q7366 wd:Q134556 }", 2, "persona"),

    # ---------- segunda ronda: ciudades (más de 50 mil habitantes) ----------
    ("Nombra una ciudad de Japón",) + (lambda q: (q, 12, "cosa"))("?item wdt:P17 wd:Q17 ; wdt:P1082 ?pop . FILTER(?pop >= 50000) ?item wdt:P31/wdt:P279* wd:Q515 ."),
    ("Nombra una ciudad de Italia",) + (lambda q: (q, 20, "cosa"))("?item wdt:P17 wd:Q38 ; wdt:P1082 ?pop . FILTER(?pop >= 30000) ?item wdt:P31 wd:Q747074 ."),
    ("Nombra una ciudad de Francia",) + (lambda q: (q, 20, "cosa"))("?item wdt:P17 wd:Q142 ; wdt:P1082 ?pop . FILTER(?pop >= 30000) ?item wdt:P31 wd:Q484170 ."),
    ("Nombra una ciudad de Alemania",) + (lambda q: (q, 20, "cosa"))("?item wdt:P17 wd:Q183 ; wdt:P1082 ?pop . FILTER(?pop >= 40000) ?item wdt:P31/wdt:P279* wd:Q515 ."),
    ("Nombra una ciudad de España",) + (lambda q: (q, 15, "cosa"))("?item wdt:P17 wd:Q29 ; wdt:P1082 ?pop . FILTER(?pop >= 30000) ?item wdt:P31 wd:Q2074737 ."),
    ("Nombra una ciudad del Reino Unido",) + (lambda q: (q, 15, "cosa"))("?item wdt:P17 wd:Q145 ; wdt:P1082 ?pop . FILTER(?pop >= 40000) ?item wdt:P31/wdt:P279* wd:Q486972 ."),
    ("Nombra una ciudad de Colombia",) + (lambda q: (q, 8, "cosa"))("?item wdt:P17 wd:Q739 ; wdt:P1082 ?pop . FILTER(?pop >= 40000) ?item wdt:P31/wdt:P279* wd:Q486972 ."),
    ("Nombra una ciudad de Canadá",) + (lambda q: (q, 10, "cosa"))("?item wdt:P17 wd:Q16 ; wdt:P1082 ?pop . FILTER(?pop >= 25000) ?item wdt:P31/wdt:P279* wd:Q486972 ."),
    ("Nombra una ciudad de Polonia",) + (lambda q: (q, 15, "cosa"))("?item wdt:P17 wd:Q36 ; wdt:P1082 ?pop . FILTER(?pop >= 40000) ?item wdt:P31/wdt:P279* wd:Q515 ."),
    ("Nombra una ciudad de Ucrania",) + (lambda q: (q, 15, "cosa"))("?item wdt:P17 wd:Q212 ; wdt:P1082 ?pop . FILTER(?pop >= 40000) ?item wdt:P31/wdt:P279* wd:Q515 ."),
    ("Nombra una ciudad de Argentina",) + (lambda q: (q, 8, "cosa"))("?item wdt:P17 wd:Q414 ; wdt:P1082 ?pop . FILTER(?pop >= 30000) ?item wdt:P31/wdt:P279* wd:Q486972 ."),
    ("Nombra una ciudad de Corea del Sur",) + (lambda q: (q, 12, "cosa"))("?item wdt:P17 wd:Q884 ; wdt:P1082 ?pop . FILTER(?pop >= 50000) ?item wdt:P31/wdt:P279* wd:Q515 ."),
    ("Nombra una ciudad de Australia",) + (lambda q: (q, 10, "cosa"))("?item wdt:P17 wd:Q408 ; wdt:P1082 ?pop . FILTER(?pop >= 20000) ?item wdt:P31/wdt:P279* wd:Q486972 ."),
    ("Nombra una ciudad de Brasil",) + (lambda q: (q, 15, "cosa"))("?item wdt:P17 wd:Q155 ; wdt:P1082 ?pop . FILTER(?pop >= 150000) ?item wdt:P31 wd:Q3184121 ."),

    # ---------- segunda ronda: deportes ----------
    ("Nombra un futbolista argentino (actual o histórico)",) + futbolistas_de("Q414", 30),
    ("Nombra un portero o arquero de fútbol famoso (actual o histórico)", "?item wdt:P413 wd:Q201330 ; wdt:P106 wd:Q937857 ; wdt:P31 wd:Q5 ; p:P54/pq:P1350 [] .", 30, "persona"),
    ("Nombra un jugador que haya jugado en los Knicks de Nueva York (actual o histórico)",) + equipo("New York Knicks"),
    ("Nombra un jugador que haya jugado en los Rockets de Houston (actual o histórico)",) + equipo("Houston Rockets"),
    ("Nombra un jugador que haya jugado en los Seahawks de Seattle (actual o histórico)",) + equipo("Seattle Seahawks", 8),
    ("Nombra un jugador que haya jugado en los 49ers de San Francisco (actual o histórico)",) + equipo("San Francisco 49ers", 8),
    ("Nombra un jugador que haya jugado en los Chiefs de Kansas City (actual o histórico)",) + equipo("Kansas City Chiefs", 8),
    ("Nombra un jugador que haya jugado en los Eagles de Filadelfia (actual o histórico)",) + equipo("Philadelphia Eagles", 8),
    ("Nombra un pelotero que haya jugado en los Dodgers de Los Ángeles (actual o histórico)",) + equipo("Los Angeles Dodgers", 10),
    ("Nombra un futbolista que haya jugado en la Juventus (actual o histórico)",) + equipo("Juventus FC", 20),
    ("Nombra un futbolista que haya jugado en el FC Barcelona (actual o histórico)",) + equipo("FC Barcelona", 20),
    ("Nombra un futbolista que haya jugado en el Bayern de Múnich (actual o histórico)",) + equipo("FC Bayern Munich", 20),
    ("Nombra un futbolista que haya jugado en el Chelsea (actual o histórico)",) + equipo("Chelsea F.C.", 20),

    # ---------- tercera ronda: personajes (de la obra o de su franquicia) ----------
    ("Nombra un personaje de Los Simpson",) + personajes("Q886 Q7764350"),
    ("Nombra un personaje de Star Wars",) + personajes("Q462 Q19786052", 6),
    ("Nombra un personaje de Harry Potter",) + personajes("Q216930 Q30739117"),
    ("Nombra un personaje de los Looney Tunes",) + personajes("Q622435"),
    ("Nombra un personaje de Bob Esponja",) + personajes("Q83279 Q98109524"),
    ("Nombra un personaje de las películas de Shrek",) + personajes("Q1203222"),
    ("Nombra un personaje de Toy Story",) + personajes("Q2316015"),
    ("Nombra un personaje de la saga Super Mario",) + personajes("Q4803535"),
    ("Nombra un personaje de la saga Sonic",) + personajes("Q1046812 Q29906232"),
    ("Nombra un personaje de Dragon Ball",) + personajes("Q2020 Q239506 Q15051307"),
    ("Nombra un personaje de Naruto",) + personajes("Q642 Q25929253 Q26971382"),
    ("Nombra un personaje de One Piece",) + personajes("Q673 Q28667972 Q710324"),
    ("Nombra un personaje de Juego de Tronos (Game of Thrones)",) + personajes("Q45875 Q23572"),
    ("Nombra un personaje de Attack on Titan (Shingeki no Kyojin)",) + personajes("Q586025 Q22126305"),
    ("Nombra un personaje de Demon Slayer (Kimetsu no Yaiba)",) + personajes("Q105037706 Q24862683 Q63350570", 1),

    # ---------- tercera ronda: NFL y selecciones ----------
    ("Nombra un jugador de la NFL que no haya sido mariscal de campo (quarterback)", "?item wdt:P106 wd:Q19204627 ; wdt:P31 wd:Q5 . ?item wdt:P54 ?tm . ?tm wdt:P118 wd:Q1215884 . FILTER NOT EXISTS { ?item wdt:P106 wd:Q13474373 } FILTER NOT EXISTS { ?item wdt:P413 wd:Q622747 }", 25, "persona"),
    ("Nombra un receptor abierto (wide receiver) de la NFL (actual o histórico)", "?item wdt:P413 wd:Q918224 ; wdt:P31 wd:Q5 . ?item wdt:P54 ?tm . ?tm wdt:P118 wd:Q1215884 . FILTER NOT EXISTS { ?item wdt:P106 wd:Q13474373 }", 6, "persona"),
    ("Nombra un corredor (running back) de la NFL (actual o histórico)", "?item wdt:P413 wd:Q912985 ; wdt:P31 wd:Q5 . ?item wdt:P54 ?tm . ?tm wdt:P118 wd:Q1215884 . FILTER NOT EXISTS { ?item wdt:P106 wd:Q13474373 }", 6, "persona"),
    ("Nombra un ala cerrada (tight end) de la NFL (actual o histórico)", "?item wdt:P413 wd:Q1153176 ; wdt:P31 wd:Q5 . ?item wdt:P54 ?tm . ?tm wdt:P118 wd:Q1215884 . FILTER NOT EXISTS { ?item wdt:P106 wd:Q13474373 }", 5, "persona"),
    ("Nombra un jugador defensivo de la NFL (actual o histórico)", "?item wdt:P413 ?pos ; wdt:P31 wd:Q5 . VALUES ?pos { wd:Q528145 wd:Q869161 wd:Q903354 wd:Q2550304 wd:Q24994 wd:Q10566551 } ?item wdt:P54 ?tm . ?tm wdt:P118 wd:Q1215884 . FILTER NOT EXISTS { ?item wdt:P106 wd:Q13474373 }", 8, "persona"),
    ("Nombra un jugador que haya jugado en la selección de Argentina o en la de Brasil", "?item wdt:P54 ?t ; wdt:P31 wd:Q5 . VALUES ?t { wd:Q79800 wd:Q83459 }", 25, "persona"),

    # ---------- tercera ronda: más ciudades ----------
    ("Nombra una ciudad de Perú o de Chile", "?item wdt:P17 ?pais ; wdt:P1082 ?pop . VALUES ?pais { wd:Q419 wd:Q298 } FILTER(?pop >= 30000) ?item wdt:P31/wdt:P279* wd:Q486972 .", 8, "cosa"),
    ("Nombra una ciudad de Venezuela o de Ecuador", "?item wdt:P17 ?pais ; wdt:P1082 ?pop . VALUES ?pais { wd:Q717 wd:Q736 } FILTER(?pop >= 30000) ?item wdt:P31/wdt:P279* wd:Q486972 .", 8, "cosa"),
    ("Nombra una ciudad de Turquía", "?item wdt:P17 wd:Q43 ; wdt:P1082 ?pop . FILTER(?pop >= 80000) ?item wdt:P31/wdt:P279* wd:Q486972 .", 15, "cosa"),
    ("Nombra una ciudad de China", "?item wdt:P17 wd:Q148 ; wdt:P1082 ?pop . FILTER(?pop >= 500000) ?item wdt:P31/wdt:P279* wd:Q515 .", 25, "cosa"),
    ("Nombra una ciudad de Estados Unidos", "?item wdt:P17 wd:Q30 ; wdt:P31 wd:Q1093829 ; wdt:P1082 ?pop . FILTER(?pop >= 100000)", 30, "cosa"),
]
