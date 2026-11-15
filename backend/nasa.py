"""Consultas a NASA POWER y MODIS (ORNL DAAC) con caché en disco.

Reglas de la demo (umbrales simples y explicables, no validados por un técnico):
  - Agua:    lluvia del mes >= 60 mm Bien · 20 a 60 mm Ojo · < 20 mm Evitar
  - Heladas: < 1 día al mes Bien · 1 a 5 días Ojo · > 5 días Evitar
  - Suelo:   NDVI >= 0,40 Bien · 0,20 a 0,40 Ojo · < 0,20 Evitar (suelo casi desnudo)
"""
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

from idioma import decimal, tr

CACHE = Path(__file__).parent / "cache"
AGENTE = "demo-rotacion-cultivos/0.1"
POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
MODIS_URL = "https://modis.ornl.gov/rst/api/v1/MOD13Q1"

MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]  # también son claves de datos
MESES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
CAMPANIAS = 10          # campañas agrícolas (julio a junio) de clima
FECHAS_NDVI = 69        # 3 años de NDVI (23 fechas por año); el servicio es lento
FECHAS_POR_PEDIDO = 10  # el servicio de MODIS no responde pedidos más largos

REGLAS = {
    "agua": {"bien_desde_mm": 60, "ojo_desde_mm": 20},
    "heladas": {"ojo_desde_dias": 1, "evitar_desde_dias": 5, "umbral_c": 0},
    "suelo": {"bien_desde_ndvi": 0.40, "ojo_desde_ndvi": 0.20},
}


class FuenteNoDisponible(Exception):
    """La API externa no respondió o respondió algo inesperado."""


def _pedir(url, parametros, espera=60, intentos=3):
    completo = url + "?" + urllib.parse.urlencode(parametros)
    pedido = urllib.request.Request(completo, headers={"Accept": "application/json", "User-Agent": AGENTE})
    error = None
    for intento in range(intentos):
        try:
            with urllib.request.urlopen(pedido, timeout=espera) as respuesta:
                return json.load(respuesta)
        except urllib.error.HTTPError as e:
            if e.code < 500:
                raise FuenteNoDisponible(f"{url} respondió {e.code}") from e
            error = e
        except (urllib.error.URLError, TimeoutError, ValueError) as e:
            error = e
        time.sleep(1.5 * (intento + 1))
    raise FuenteNoDisponible(f"{url} no respondió: {error}")


def _con_cache(nombre, calcular):
    archivo = CACHE / f"{nombre}.json"
    if archivo.exists():
        return json.loads(archivo.read_text(encoding="utf-8"))
    datos = calcular()
    CACHE.mkdir(exist_ok=True)
    archivo.write_text(json.dumps(datos, ensure_ascii=False), encoding="utf-8")
    return datos


def _clave(lat, lon):
    return f"{lat:.4f}_{lon:.4f}".replace("-", "m").replace(".", "p")


def _media(valores):
    return sum(valores) / len(valores) if valores else None


def _coma(valor):
    return decimal(valor, 2)


def mes(indice):
    """Nombre corto del mes en el idioma del pedido."""
    return tr(MESES[indice], MESES_EN[indice])


def _redondear(valor, decimales=1):
    return None if valor is None else round(valor, decimales)


# ---------- Clasificación ----------

def estado_agua(mm):
    if mm is None:
        return "nodata"
    if mm >= REGLAS["agua"]["bien_desde_mm"]:
        return "ok"
    return "warn" if mm >= REGLAS["agua"]["ojo_desde_mm"] else "bad"


def estado_heladas(dias):
    if dias is None:
        return "nodata"
    if dias > REGLAS["heladas"]["evitar_desde_dias"]:
        return "bad"
    return "warn" if dias >= REGLAS["heladas"]["ojo_desde_dias"] else "ok"


def estado_suelo(ndvi):
    if ndvi is None:
        return "nodata"
    if ndvi >= REGLAS["suelo"]["bien_desde_ndvi"]:
        return "ok"
    return "warn" if ndvi >= REGLAS["suelo"]["ojo_desde_ndvi"] else "bad"


ORDEN = {"nodata": -1, "ok": 0, "warn": 1, "bad": 2}


def peor(a, b):
    return a if ORDEN[a] >= ORDEN[b] else b


def _lista(indices):
    return ", ".join(mes(i) for i in indices)


# ---------- NASA POWER: lluvia y temperatura diarias ----------

def clima(lat, lon, hoy=None):
    hoy = hoy or date.today()
    # Última campaña completa (julio a junio), con margen por el retraso de los datos.
    cierre = hoy.year if hoy >= date(hoy.year, 9, 1) else hoy.year - 1
    inicio = cierre - CAMPANIAS
    return _textos_clima(_con_cache(f"clima_{_clave(lat, lon)}_{inicio}_{cierre}", lambda: _clima(lat, lon, inicio, cierre)))


def _textos_clima(d):
    """Textos del clima en el idioma del pedido. Van fuera de la caché, que solo guarda datos."""
    esc, meses = d["escenarios"], d["meses"]
    campanias = esc["normal"]["campanias"]
    inicio, fin = int(campanias[0][:4]), int(campanias[-1][:4]) + 1
    d["fuente"] = tr("NASA POWER (MERRA-2), datos diarios", "NASA POWER (MERRA-2), daily data")
    d["periodo"] = tr(f"julio de {inicio} a junio de {fin}", f"July {inicio} to June {fin}")
    esc["normal"]["descripcion"] = tr("Promedio de todas las campañas", "Average of all seasons")
    esc["menos"]["descripcion"] = tr("Promedio de las 3 campañas más secas", "Average of the 3 driest seasons")
    esc["mucho"]["descripcion"] = tr("La campaña más seca del periodo", "The driest season of the period")

    secos = [i for i, x in enumerate(meses) if x["agua"] == "bad"]
    con_helada = [i for i, x in enumerate(meses) if x["heladas"] != "ok"]
    hallazgos = []
    if secos:
        hallazgos.append(tr(f"Casi no llueve en: {_lista(secos)} (menos de {REGLAS['agua']['ojo_desde_mm']} mm al mes).",
                            f"It hardly rains in: {_lista(secos)} (less than {REGLAS['agua']['ojo_desde_mm']} mm a month)."))
    if con_helada:
        hallazgos.append(tr(f"Suele helar en: {_lista(con_helada)} (al menos 1 día al mes bajo cero).",
                            f"Frost is usual in: {_lista(con_helada)} (at least 1 day a month below zero)."))
    else:
        hallazgos.append(tr("En promedio no se registran heladas en ningún mes.", "On average no month records frost."))
    seca, normal = esc["mucho"], esc["normal"]
    hallazgos.append(tr(
        f"La campaña más seca fue {seca['campanias'][0]}, con {seca['lluvia_anual_mm']} mm; "
        f"lo normal son {normal['lluvia_anual_mm']} mm al año.",
        f"The driest season was {seca['campanias'][0]}, with {seca['lluvia_anual_mm']} mm; "
        f"the normal amount is {normal['lluvia_anual_mm']} mm a year."))
    d["hallazgos"] = hallazgos
    return d


def _clima(lat, lon, inicio, cierre):
    crudo = _pedir(POWER_URL, {
        "parameters": "PRECTOTCORR,T2M_MIN,T2M_MAX", "community": "AG",
        "latitude": lat, "longitude": lon,
        "start": f"{inicio}0701", "end": f"{cierre}0630", "format": "JSON",
    }, espera=120)
    try:
        serie = crudo["properties"]["parameter"]
        lluvia, tmin, tmax = serie["PRECTOTCORR"], serie["T2M_MIN"], serie["T2M_MAX"]
        vacio = crudo["header"]["fill_value"]
        altitud = crudo["geometry"]["coordinates"][2]
    except (KeyError, IndexError, TypeError) as e:
        raise FuenteNoDisponible("NASA POWER devolvió un formato inesperado") from e

    # Acumular por campaña (año en que empieza, en julio) y mes.
    grupos = {}
    for dia, mm in lluvia.items():
        anio, mes = int(dia[:4]), int(dia[4:6])
        campania = anio if mes >= 7 else anio - 1
        g = grupos.setdefault((campania, mes), {"mm": 0.0, "dias": 0, "heladas": 0, "tmin": [], "tmax": []})
        if mm == vacio or tmin.get(dia, vacio) == vacio or tmax.get(dia, vacio) == vacio:
            continue
        g["mm"] += mm
        g["dias"] += 1
        g["heladas"] += tmin[dia] < REGLAS["heladas"]["umbral_c"]
        g["tmin"].append(tmin[dia])
        g["tmax"].append(tmax[dia])
    # Un mes con muchos días sin dato no se usa.
    grupos = {k: g for k, g in grupos.items() if g["dias"] >= 25}

    campanias = sorted({c for c, _ in grupos})
    totales = {c: sum(grupos[(c, m)]["mm"] for m in range(1, 13))
               for c in campanias if all((c, m) in grupos for m in range(1, 13))}
    if len(totales) < 3:
        raise FuenteNoDisponible("NASA POWER no tiene suficientes años completos para este punto")
    por_lluvia = sorted(totales, key=totales.get)
    secas, mas_seca = por_lluvia[:3], por_lluvia[0]

    def lluvia_mensual(lista):
        return [_redondear(_media([grupos[(c, m)]["mm"] for c in lista if (c, m) in grupos]), 0) for m in range(1, 13)]

    def de_mes(m, campo):
        return [grupos[(c, m)][campo] for c in campanias if (c, m) in grupos]

    meses = []
    normal = lluvia_mensual(campanias)
    for m in range(1, 13):
        dias_helada = _redondear(_media(de_mes(m, "heladas")))
        agua, heladas = estado_agua(normal[m - 1]), estado_heladas(dias_helada)
        meses.append({
            "mes": MESES[m - 1],
            "lluvia_mm": normal[m - 1],
            "dias_helada": dias_helada,
            "tmin_media": _redondear(_media([t for lista in de_mes(m, "tmin") for t in lista])),
            "tmax_media": _redondear(_media([t for lista in de_mes(m, "tmax") for t in lista])),
            "agua": agua, "heladas": heladas, "agua_y_heladas": peor(agua, heladas),
        })

    def nombre(c):
        return f"{c}-{str(c + 1)[2:]}"

    def escenario(lista):
        mm = lluvia_mensual(lista)
        estados = [estado_agua(v) for v in mm]
        return {
            "campanias": [nombre(c) for c in lista],
            "lluvia_mm": mm,
            "lluvia_anual_mm": round(sum(v for v in mm if v is not None)),
            "agua": estados,
            "agua_y_heladas": [peor(e, meses[i]["heladas"]) for i, e in enumerate(estados)],
        }

    escenarios = {
        "normal": escenario(campanias),     # promedio de todas las campañas
        "menos": escenario(sorted(secas)),  # promedio de las 3 más secas
        "mucho": escenario([mas_seca]),     # la más seca del periodo
    }
    return {
        "altitud_m": round(altitud),
        "meses": meses,
        "escenarios": escenarios,
    }


# ---------- MODIS MOD13Q1: verdor (NDVI) cada 16 días ----------

def ndvi(lat, lon, hoy=None):
    hoy = hoy or date.today()
    # La clave incluye el mes para que la caché se renueve cuando llegan fechas nuevas.
    return _textos_ndvi(_con_cache(f"ndvi_{_clave(lat, lon)}_{hoy:%Y%m}", lambda: _ndvi(lat, lon)))


def _textos_ndvi(d):
    """Textos del verdor en el idioma del pedido, armados con los datos de la caché."""
    meses, serie, caida = d["meses"], d["serie"], d.get("caida_reciente")
    d["fuente"] = tr("MODIS MOD13Q1 (Terra), NDVI cada 16 días, píxel de 250 m",
                     "MODIS MOD13Q1 (Terra), NDVI every 16 days, 250 m pixel")
    d["periodo"] = tr(f"{serie[0]['fecha']} a {serie[-1]['fecha']}", f"{serie[0]['fecha']} to {serie[-1]['fecha']}")
    con_dato = [i for i, x in enumerate(meses) if x["ndvi"] is not None]
    alto = max(con_dato, key=lambda i: meses[i]["ndvi"])
    bajo = min(con_dato, key=lambda i: meses[i]["ndvi"])
    hallazgos = [tr(
        f"El satélite ve más verde en {mes(alto)} (NDVI {_coma(meses[alto]['ndvi'])}) "
        f"y menos en {mes(bajo)} (NDVI {_coma(meses[bajo]['ndvi'])}).",
        f"The satellite sees the most green in {mes(alto)} (NDVI {_coma(meses[alto]['ndvi'])}) "
        f"and the least in {mes(bajo)} (NDVI {_coma(meses[bajo]['ndvi'])}).")]
    desnudo = [i for i in con_dato if meses[i]["suelo"] == "bad"]
    if desnudo:
        hallazgos.append(tr(f"La zona se ve casi sin vegetación en: {_lista(desnudo)}.",
                            f"The area looks almost bare of vegetation in: {_lista(desnudo)}."))
    if caida:
        m = mes(MESES.index(caida["mes"]))
        hallazgos.append(tr(
            f"En {m} de {caida['anio']} el satélite vio menos verde que lo habitual "
            f"(NDVI {_coma(caida['ndvi'])} frente a {_coma(caida['habitual'])}).",
            f"In {m} {caida['anio']} the satellite saw less green than usual "
            f"(NDVI {_coma(caida['ndvi'])} versus {_coma(caida['habitual'])})."))
    d["hallazgos"] = hallazgos
    return d


def _ndvi(lat, lon):
    punto = {"latitude": lat, "longitude": lon}
    try:
        fechas = [f["modis_date"] for f in _pedir(MODIS_URL + "/dates", punto, espera=180)["dates"]][-FECHAS_NDVI:]
    except (KeyError, TypeError) as e:
        raise FuenteNoDisponible("MODIS devolvió un formato inesperado") from e
    tramos = [fechas[i:i + FECHAS_POR_PEDIDO] for i in range(0, len(fechas), FECHAS_POR_PEDIDO)]

    def recorte(tarea):
        banda, tramo = tarea
        crudo = _pedir(MODIS_URL + "/subset", {
            **punto, "band": banda, "startDate": tramo[0], "endDate": tramo[-1],
            "kmAboveBelow": 0, "kmLeftRight": 0,
        }, espera=180, intentos=2)
        return banda, crudo

    bandas = ("250m_16_days_NDVI", "250m_16_days_pixel_reliability")
    with ThreadPoolExecutor(max_workers=4) as grupo:
        resultados = list(grupo.map(recorte, [(b, t) for b in bandas for t in tramos]))

    valores, calidad, escala = {}, {}, 0.0001
    try:
        for banda, crudo in resultados:
            destino = valores if banda == bandas[0] else calidad
            if banda == bandas[0]:
                escala = float(crudo["scale"])
            for dato in crudo["subset"]:
                destino[dato["calendar_date"]] = dato["data"][0]
    except (KeyError, IndexError, TypeError, ValueError) as e:
        raise FuenteNoDisponible("MODIS devolvió un formato inesperado") from e

    # Solo se usan datos de calidad buena (0) o aceptable (1); se descartan nieve, nube y vacíos.
    serie, descartados = [], 0
    for dia in sorted(valores):
        crudo, fiable = valores[dia], calidad.get(dia)
        if fiable not in (0, 1) or not -2000 <= crudo <= 10000:
            descartados += 1
            continue
        serie.append({"fecha": dia, "ndvi": round(crudo * escala, 3)})
    if not serie:
        raise FuenteNoDisponible("MODIS no tiene datos de buena calidad para este punto")

    meses = []
    for m in range(1, 13):
        del_mes = [s["ndvi"] for s in serie if int(s["fecha"][5:7]) == m]
        promedio = _redondear(_media(del_mes), 2)
        meses.append({"mes": MESES[m - 1], "ndvi": promedio, "observaciones": len(del_mes), "suelo": estado_suelo(promedio)})

    # Último año frente a los anteriores: el mes con la mayor caída de verdor.
    ultimo_dia = date.fromisoformat(serie[-1]["fecha"])
    corte = ultimo_dia.replace(year=ultimo_dia.year - 1).isoformat()
    caida = None
    for m in range(1, 13):
        recientes = [s["ndvi"] for s in serie if s["fecha"] > corte and int(s["fecha"][5:7]) == m]
        previos = [s["ndvi"] for s in serie if s["fecha"] <= corte and int(s["fecha"][5:7]) == m]
        if not recientes or len(previos) < 3:
            continue
        ahora, antes = _media(recientes), _media(previos)
        if antes > 0.1 and ahora < antes * 0.85 and (caida is None or ahora / antes < caida["razon"]):
            anio = max(s["fecha"] for s in serie if s["fecha"] > corte and int(s["fecha"][5:7]) == m)[:4]
            caida = {"mes": MESES[m - 1], "anio": anio, "ndvi": round(ahora, 2), "habitual": round(antes, 2), "razon": ahora / antes}
    if caida:
        caida.pop("razon")

    return {
        "observaciones": len(serie),
        "descartadas_por_calidad": descartados,
        "meses": meses,
        "caida_reciente": caida,
        "serie": serie,
    }
