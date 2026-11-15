"""Motor de rotaciones: compara 3 estrategias con el clima real del punto.

Una rotación son 3 campañas seguidas, un cultivo por campaña. Todo son reglas simples y
explicables (no un modelo entrenado); los umbrales están en REGLAS y faltan validar.
"""
from itertools import permutations

from cultivos import CULTIVOS, familia, fuente, fuente_residuo, necesidad, nombre, residuo_t_ha
from idioma import decimal, tr
from nasa import MESES, ORDEN, peor

REGLAS = {
    # Agua: lluvia del ciclo (más riego) frente a lo que necesita el cultivo.
    "agua_bien": 0.9, "agua_ojo": 0.6,
    # Riego declarado por el agricultor, como fracción de la necesidad que puede cubrir.
    "riego": {"poca": 0.0, "media": 0.2, "buena": 0.4},
    # Días bajo cero durante el ciclo: desde cuántos es Ojo y desde cuántos Evitar.
    "helada": {"sensible": (1, 5), "tolerante": (5, 15)},
    # Suelo: peso de cada componente y cortes del puntaje (0 a 1).
    "suelo_pesos": {"diversidad": 0.35, "nitrogeno": 0.30, "residuo": 0.20, "cobertura": 0.15},
    "suelo_bien": 0.6, "suelo_ojo": 0.35,
    # Un mes con el suelo sin cultivo y esta lluvia o más se marca Evitar (riesgo de erosión).
    "lluvia_erosiva_mm": 60,
}

PRIORIDADES = {
    "agua": "Ahorrar agua", "suelo": "Cuidar la tierra", "ingreso": "Ganar más",
    "erosion": "Menos erosión", "forraje": "Alimento para animales", "fuerza": "Devolver fuerza al suelo",
}
# El puntaje de rastrojo es relativo: 1 es el cultivo de la ficha que más deja.
RESIDUO_MAXIMO = max(residuo_t_ha(c) for c in CULTIVOS)

AGUA = {"poca": "Poca agua", "media": "Agua media", "buena": "Buena agua"}
MAQUINARIA = {"ninguna": "sin maquinaria", "basica": "maquinaria básica", "completa": "maquinaria completa"}
NOMBRE_ESTADO = {"ok": "Bien", "warn": "Ojo", "bad": "Evitar"}

# Los mismos textos en inglés; las claves de arriba también validan lo que llega.
PRIORIDADES_EN = {
    "agua": "Save water", "suelo": "Care for the soil", "ingreso": "Earn more",
    "erosion": "Less erosion", "forraje": "Feed for animals", "fuerza": "Restore soil strength",
}
AGUA_EN = {"poca": "Little water", "media": "Some water", "buena": "Plenty of water"}
MAQUINARIA_EN = {"ninguna": "no machinery", "basica": "basic machinery", "completa": "full machinery"}
NOMBRE_ESTADO_EN = {"ok": "Good", "warn": "Caution", "bad": "Avoid"}


def _estado(valor, bien, ojo):
    return "ok" if valor >= bien else "warn" if valor >= ojo else "bad"


def _estado_helada(dias, tipo):
    ojo, evitar = REGLAS["helada"][tipo]
    return "bad" if dias > evitar else "warn" if dias >= ojo else "ok"


def _meses(inicio, cuantos):
    return [(inicio + k) % 12 for k in range(cuantos)]


def _juntar(nombres):
    nombres = list(nombres)
    return nombres[0] if len(nombres) == 1 else ", ".join(nombres[:-1]) + tr(" y ", " and ") + nombres[-1]


def heladas_ajustadas(clima, observacion):
    """Si el agricultor dice que hiela más que lo que ve el satélite, se cuentan más heladas
    en los meses fríos (mínima media bajo 7 °C): el doble más un día."""
    dias = [m["dias_helada"] or 0 for m in clima["meses"]]
    if observacion != "mas":
        return dias
    return [d * 2 + 1 if (m["tmin_media"] or 99) < 7 else d for d, m in zip(dias, clima["meses"])]


def mejor_siembra(cultivo, lluvia, heladas):
    """Mes de siembra con mejor balance entre lluvia recibida y heladas en el ciclo."""
    ficha = CULTIVOS[cultivo]
    limite = REGLAS["helada"][ficha["helada"]][1]

    def puntaje(mes):
        ciclo = _meses(mes, ficha["ciclo_meses"])
        agua = min(1, sum(lluvia[m] for m in ciclo) / necesidad(cultivo))
        return agua - min(1, sum(heladas[m] for m in ciclo) / limite)

    return max(range(12), key=puntaje)


def evaluar_cultivo(cultivo, siembra, lluvia, heladas, riego):
    ficha = CULTIVOS[cultivo]
    ciclo = _meses(siembra, ficha["ciclo_meses"])
    necesita = necesidad(cultivo)
    recibe = sum(lluvia[m] for m in ciclo)
    cobertura = recibe / necesita + riego
    dias = sum(heladas[m] for m in ciclo)
    por_mes = necesita / len(ciclo)

    dentro, fuera = [], []
    for m in range(12):
        if m in ciclo:
            agua = _estado(lluvia[m] / por_mes + riego, REGLAS["agua_bien"], REGLAS["agua_ojo"])
            ojo, evitar = REGLAS["helada"][ficha["helada"]]
            helada = "bad" if heladas[m] > evitar else "warn" if heladas[m] >= ojo else "ok"
            dentro.append(peor(agua, helada))
            fuera.append("ok")
        else:
            dentro.append("nodata")
            fuera.append("bad" if lluvia[m] >= REGLAS["lluvia_erosiva_mm"] else "warn")
    return {
        "cultivo": cultivo, "nombre": nombre(cultivo),
        "siembra": MESES[siembra], "cosecha": MESES[ciclo[-1]], "meses_ciclo": len(ciclo),
        "lluvia_mm": round(recibe), "necesita_mm": round(necesita),
        "cobertura_agua": round(cobertura, 2), "dias_helada": round(dias, 1),
        "agua": _estado(cobertura, REGLAS["agua_bien"], REGLAS["agua_ojo"]),
        "heladas": _estado_helada(dias, ficha["helada"]),
        "residuo_t_ha": round(residuo_t_ha(cultivo), 1),
        "rueda": {"fuera": fuera, "dentro": dentro},
    }


def evaluar_rotacion(cultivos, siembras, lluvia, heladas, riego):
    plan = [dict(evaluar_cultivo(c, siembras[c], lluvia, heladas, riego), campania=i + 1) for i, c in enumerate(cultivos)]
    fichas = [CULTIVOS[c] for c in cultivos]
    n = len(cultivos)

    agua = sum(min(1, p["cobertura_agua"]) for p in plan) / n
    helada = sum(1 - min(1, p["dias_helada"] / REGLAS["helada"][f["helada"]][1]) for p, f in zip(plan, fichas)) / n
    rastrojo = sum(residuo_t_ha(c) for c in cultivos) / n
    partes = {
        "diversidad": (len({f["familia"] for f in fichas}) - 1) / 2,
        "nitrogeno": 1.0 if any(f["leguminosa"] for f in fichas) else 0.0,
        "residuo": rastrojo / RESIDUO_MAXIMO,
        "cobertura": min(1, sum(f["ciclo_meses"] for f in fichas) / n / 6),
    }
    suelo = sum(REGLAS["suelo_pesos"][k] * v for k, v in partes.items())
    demanda = sum(necesidad(c) for c in cultivos) / n
    return {
        "plan": plan,
        "puntajes": {"agua": agua, "suelo": suelo, "heladas": helada, **partes,
                     "ahorro": max(0, min(1, (650 - demanda) / 250)),
                     "forraje": sum(f["forraje"] for f in fichas) / n},
        "estados": {
            "agua": _estado(sum(p["cobertura_agua"] for p in plan) / n, REGLAS["agua_bien"], REGLAS["agua_ojo"]),
            "suelo": _estado(suelo, REGLAS["suelo_bien"], REGLAS["suelo_ojo"]),
            "heladas": max((p["heladas"] for p in plan), key=ORDEN.get),
        },
        "demanda_mm": round(demanda),
        "residuo_t_ha": round(rastrojo, 1),
        "meses_cubiertos": round(sum(f["ciclo_meses"] for f in fichas) / n, 1),
    }


def _total(evaluacion, cultivos, prioridades):
    p = evaluacion["puntajes"]
    total = p["agua"] + p["suelo"] + p["heladas"]
    if "agua" in prioridades:
        total += p["agua"] + 0.5 * p["ahorro"]
    if "suelo" in prioridades:
        total += 1.5 * p["suelo"]
    if "erosion" in prioridades:
        total += 0.6 * p["residuo"] + 0.4 * p["cobertura"]
    if "fuerza" in prioridades:
        total += p["nitrogeno"] + 0.5 * p["diversidad"]
    if "forraje" in prioridades:
        total += 1.5 * p["forraje"]
    # No se premia una opción que deja el suelo en Evitar.
    if evaluacion["estados"]["suelo"] == "bad":
        total -= 0.5
    # La leguminosa rinde más justo después de un cultivo que no lo es.
    if CULTIVOS[cultivos[1]]["leguminosa"] and not CULTIVOS[cultivos[0]]["leguminosa"]:
        total += 0.05
    return total


def _resumen(estados):
    nombres = {"agua": tr("agua", "water"), "suelo": tr("suelo", "soil"), "heladas": tr("heladas", "frost")}
    bien = [nombres[k] for k, v in estados.items() if v == "ok"]
    ojo = [nombres[k] for k, v in estados.items() if v == "warn"]
    mal = [nombres[k] for k, v in estados.items() if v == "bad"]
    frases = []
    if bien:
        frases.append(tr(f"Va bien en {_juntar(bien)}.", f"Does well on {_juntar(bien)}."))
    if ojo:
        frases.append(tr(f"Ojo con {_juntar(ojo)}.", f"Watch out for {_juntar(ojo)}."))
    if mal:
        frases.append(tr(f"Punto débil: {_juntar(mal)}.", f"Weak point: {_juntar(mal)}."))
    return " ".join(frases)


def _explicar(cultivos, normal, seco, hoy, clima, entrada):
    fichas = [CULTIVOS[c] for c in cultivos]
    familias = [familia(f) for f in dict.fromkeys(f["familia"] for f in fichas)]
    leguminosas = list(dict.fromkeys(nombre(c) for c in cultivos if CULTIVOS[c]["leguminosa"]))
    forrajes = list(dict.fromkeys(nombre(c) for c in cultivos if CULTIVOS[c]["forraje"]))
    estado = lambda e: tr(NOMBRE_ESTADO[e], NOMBRE_ESTADO_EN[e])
    repetir = len(set(cultivos)) == 1
    actual = nombre(entrada["cultivo"])

    porque, beneficios, riesgos = [], [], []
    if repetir:
        porque.append(tr(f"Es lo que ya conoces: {actual} todas las campañas. Se muestra para comparar.",
                         f"It is what you already know: {actual} every season. It is shown for comparison."))
    if leguminosas:
        una = len(leguminosas) == 1
        porque.append(tr(
            f"{_juntar(leguminosas)} {'es leguminosa: fija' if una else 'son leguminosas: fijan'} "
            "nitrógeno del aire y lo deja para el cultivo siguiente.",
            f"{_juntar(leguminosas)} {'is a legume: it fixes' if una else 'are legumes: they fix'} "
            f"nitrogen from the air and {'leaves' if una else 'leave'} it for the next crop."))
    if len(familias) > 1:
        porque.append(tr(
            f"Alterna {len(familias)} familias de cultivos ({_juntar(familias)}), lo que ayuda a cortar ciclos de plagas y enfermedades.",
            f"It alternates {len(familias)} crop families ({_juntar(familias)}), which helps break pest and disease cycles."))
    for p in dict((p["cultivo"], p) for p in normal["plan"]).values():
        porque.append(tr(
            f"{p['nombre']}: sembrando en {p['siembra']} recibe unos {p['lluvia_mm']} mm de lluvia "
            f"en su ciclo y necesita cerca de {p['necesita_mm']} mm.",
            f"{p['nombre']}: sown in {_mes(p['siembra'])} it gets about {p['lluvia_mm']} mm of rain "
            f"during its cycle and needs around {p['necesita_mm']} mm."))

    if not repetir and normal["demanda_mm"] < hoy["demanda_mm"]:
        beneficios.append(tr(
            f"Pide menos agua: unos {normal['demanda_mm']} mm por campaña en promedio, "
            f"frente a {hoy['demanda_mm']} mm si repites {actual}.",
            f"It needs less water: about {normal['demanda_mm']} mm per season on average, "
            f"versus {hoy['demanda_mm']} mm if you repeat {actual}."))
    if leguminosas:
        beneficios.append(tr("Aporta nitrógeno al suelo sin comprar fertilizante.",
                             "It adds nitrogen to the soil without buying fertilizer."))
    if len(familias) > 1:
        beneficios.append(tr("Rompe la repetición del mismo cultivo, que es lo que más cansa la tierra.",
                             "It breaks the repetition of the same crop, which is what wears the soil out most."))
    if forrajes and "forraje" in entrada["prioridades"]:
        beneficios.append(tr(f"Deja alimento para animales con {_juntar(forrajes)}.",
                             f"It leaves feed for animals with {_juntar(forrajes)}."))
    beneficios.append(tr(
        f"Deja unas {decimal(normal['residuo_t_ha'])} toneladas de rastrojo por hectárea en cada campaña, en promedio; "
        "si se queda en la chacra, cubre el suelo.",
        f"It leaves about {decimal(normal['residuo_t_ha'])} tonnes of crop residue per hectare each season, on average; "
        "if it stays on the field, it covers the soil."))
    cubiertos = decimal(normal["meses_cubiertos"])
    beneficios.append(tr(f"El suelo queda con cultivo unos {cubiertos} meses al año en promedio.",
                         f"The soil stays under crop about {cubiertos} months a year on average."))

    vistos = set()
    for p, f in zip(normal["plan"], fichas):
        if p["cultivo"] in vistos:
            continue
        vistos.add(p["cultivo"])
        if p["heladas"] != "ok":
            sensible = f["helada"] == "sensible"
            riesgos.append(tr(
                f"Heladas: en el ciclo de {p['nombre']} ({p['siembra']} a {p['cosecha']}) hay en promedio "
                f"{decimal(p['dias_helada'])} días bajo cero" + (" y es un cultivo sensible." if sensible else "."),
                f"Frost: during the {p['nombre']} cycle ({_mes(p['siembra'])} to {_mes(p['cosecha'])}) there are on average "
                f"{decimal(p['dias_helada'])} days below zero" + (" and it is a sensitive crop." if sensible else ".")))
        if p["agua"] != "ok":
            riesgos.append(tr(
                f"Agua: a {p['nombre']} le llegaría {p['lluvia_mm']} de los {p['necesita_mm']} mm que necesita; "
                "sin riego puede rendir menos.",
                f"Water: {p['nombre']} would get {p['lluvia_mm']} of the {p['necesita_mm']} mm it needs; "
                "without irrigation it may yield less."))
    if ORDEN[seco["estados"]["agua"]] > ORDEN[normal["estados"]["agua"]]:
        seca = clima["escenarios"]["mucho"]["campanias"][0]
        riesgos.append(tr(
            f"En una campaña seca como {seca}, el agua pasa de "
            f"{estado(normal['estados']['agua'])} a {estado(seco['estados']['agua'])}.",
            f"In a dry season like {seca}, water goes from "
            f"{estado(normal['estados']['agua'])} to {estado(seco['estados']['agua'])}."))
    riesgos.append(tr("Plagas, enfermedades y variedades propias de tu zona: esta herramienta no las conoce.",
                      "Pests, diseases and varieties specific to your area: this tool does not know them."))
    return {"porque": porque, "beneficios": beneficios, "riesgos": riesgos}


def _mes(abreviado):
    """Mes del plan (clave en español) en el idioma del pedido."""
    from nasa import mes
    return mes(MESES.index(abreviado))


def comparar(clima, entrada):
    """Devuelve 3 opciones: la recomendada, una alternativa y repetir el cultivo de hoy."""
    actual, prioridades = entrada["cultivo"], entrada["prioridades"]
    riego = REGLAS["riego"][entrada["agua"]]
    heladas = heladas_ajustadas(clima, entrada["heladas"])
    lluvias = {k: [v or 0 for v in e["lluvia_mm"]] for k, e in clima["escenarios"].items()}
    siembras = {c: mejor_siembra(c, lluvias["normal"], heladas) for c in CULTIVOS}

    def evaluar(cultivos, escenario="normal"):
        return evaluar_rotacion(cultivos, siembras, lluvias[escenario], heladas, riego)

    candidatas = [(actual, *resto) for resto in permutations([c for c in CULTIVOS if c != actual], 2)]
    orden = sorted(candidatas, key=lambda c: _total(evaluar(c), c, prioridades), reverse=True)
    recomendada = orden[0]
    alternativa = next(c for c in orden[1:] if set(c) != set(recomendada))
    repetir = (actual,) * 3
    hoy = evaluar(repetir)

    opciones = []
    for clave, etiqueta, cultivos in (("rec", tr("Recomendada", "Recommended"), recomendada),
                                      ("b", tr("Opción B", "Option B"), alternativa),
                                      ("hoy", tr("Repetir lo de hoy", "Repeat today's crop"), repetir)):
        escenarios = {e: evaluar(cultivos, e) for e in lluvias}
        normal = escenarios["normal"]
        opciones.append({
            "id": clave, "etiqueta": etiqueta,
            "titulo": " → ".join(nombre(c) for c in cultivos),
            "resumen": _resumen(normal["estados"]),
            "estados": normal["estados"],
            "puntaje": round(_total(normal, cultivos, prioridades), 3),
            "escenarios": {e: {"estados": v["estados"], "plan": v["plan"]} for e, v in escenarios.items()},
            **_explicar(cultivos, normal, escenarios["mucho"], hoy, clima, entrada),
        })

    lagunas = [
        tr("El tipo de suelo de tu chacra: no tenemos un mapa de suelos para esta zona.",
           "The soil type of your farm: we have no soil map for this area."),
        tr("Los precios y el mercado local de cada cultivo: por eso no se calcula el ingreso.",
           "Prices and the local market for each crop: that is why income is not calculated."),
        tr("La ficha de cultivos usa valores generales (FAO); falta ajustarla a tu zona y a tus variedades.",
           "The crop sheet uses general values (FAO); it still has to be adjusted to your area and varieties."),
        tr("El rastrojo se calcula con el rendimiento promedio de Bolivia, no con el de tu chacra, "
           "y no descuenta lo que se llevan los animales o se quema.",
           "Crop residue is calculated with Bolivia's average yield, not your farm's, "
           "and does not subtract what animals eat or what is burned."),
        tr("El clima viene de una cuadrícula de unos 50 km: en tu valle o ladera puede helar o llover distinto.",
           "The climate comes from a grid of about 50 km: in your valley or hillside frost and rain may differ."),
    ]
    if "ingreso" in prioridades:
        lagunas.insert(0, tr("Elegiste «Ganar más», pero sin precios locales esa prioridad todavía no cambia el resultado.",
                             "You chose “Earn more”, but without local prices that priority does not change the result yet."))
    maquinaria = tr(MAQUINARIA[entrada["maquinaria"]], MAQUINARIA_EN[entrada["maquinaria"]])
    lagunas.append(tr(f"Tu maquinaria ({maquinaria}) todavía no entra en el cálculo.",
                      f"Your machinery ({maquinaria}) is not part of the calculation yet."))

    margen = opciones[0]["puntaje"] - opciones[1]["puntaje"]
    empate = margen < 0.02 * opciones[0]["puntaje"]
    return {
        "opciones": opciones,
        "confianza": {
            "nivel": "baja" if empate else "media", "barras": 1 if empate else 2,
            "motivo": (tr("Las dos primeras opciones quedan casi empatadas y falta el dato de suelo. ",
                          "The first two options are almost tied and soil data is missing. ") if empate
                       else tr("El clima es real, pero falta el dato de suelo y la ficha de cultivos es general. ",
                               "The climate is real, but soil data is missing and the crop sheet is general. "))
                      + tr("Un técnico puede ayudar a confirmarlo.", "An agronomist can help confirm it."),
        },
        "lagunas": lagunas,
        "evidencia": [
            tr(f"{clima['fuente']}: lluvia y temperatura de {clima['periodo']}, para un punto a {clima['altitud_m']} m de altura.",
               f"{clima['fuente']}: rain and temperature from {clima['periodo']}, for a point at {clima['altitud_m']} m of altitude."),
            fuente(),
            fuente_residuo(),
        ],
        "resumen_entrada": " · ".join(
            [tr(f"{nombre(actual)} hoy", f"{nombre(actual)} today")]
            + [tr(PRIORIDADES[p], PRIORIDADES_EN[p]) for p in prioridades]
            + [f"{tr(AGUA[entrada['agua']], AGUA_EN[entrada['agua']])}, {maquinaria}"]),
        "ajuste_heladas": entrada["heladas"] == "mas",
    }
