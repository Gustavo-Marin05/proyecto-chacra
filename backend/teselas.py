"""Teselas del globo 3D (Tierra 3D): una capa de la NASA mezclada sobre un mapa base.

Cada tesela es un cuadrado de 256 px en proyección web (EPSG:3857, el mismo esquema
z/x/y de los mapas web). Se pide a NASA GIBS por WMS con el recuadro exacto de la
tesela, así se ve nítida en cualquier nivel de zoom, y se guarda en caché en disco.
"""
import io
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageFilter

from nasa import AGENTE, CACHE, FuenteNoDisponible

GIBS_WMS = "https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi"
BASE = "BlueMarble_ShadedRelief_Bathymetry"  # relieve y mar, sin nubes ni huecos
NIVEL_MAX = 9
LADO = 256
R = 20037508.342789244  # medio ancho del mundo en metros (EPSG:3857)

# clave: (capa de GIBS, opacidad sobre el mapa base, agrandar puntos chicos)
CAPAS = {
    "verde": ("MODIS_Terra_NDVI_8Day", 0.8, False),
    "temp": ("MODIS_Terra_Land_Surface_Temp_Day", 0.8, False),
    "lluvia": ("IMERG_Precipitation_Rate", 0.85, False),
    "fuego": ("MODIS_Terra_Thermal_Anomalies_All", 1.0, True),
}
FECHA = re.compile(r"\d{4}-\d{2}-\d{2}")


class TeselaInvalida(ValueError):
    pass


def _recuadro(z, x, y):
    paso = 2 * R / 2**z
    return f"{-R + x * paso},{R - (y + 1) * paso},{-R + (x + 1) * paso},{R - y * paso}"


def _wms(capa, recuadro, fecha=None, intentos=3):
    parametros = {
        "SERVICE": "WMS", "REQUEST": "GetMap", "VERSION": "1.3.0", "LAYERS": capa, "STYLES": "",
        "CRS": "EPSG:3857", "BBOX": recuadro, "WIDTH": LADO, "HEIGHT": LADO,
        "FORMAT": "image/png", "TRANSPARENT": "true",
    }
    if fecha:
        parametros["TIME"] = fecha
    pedido = urllib.request.Request(GIBS_WMS + "?" + urllib.parse.urlencode(parametros), headers={"User-Agent": AGENTE})
    error = None
    for intento in range(intentos):
        try:
            with urllib.request.urlopen(pedido, timeout=30) as respuesta:
                if not respuesta.headers.get("Content-Type", "").startswith("image/"):
                    raise FuenteNoDisponible(f"GIBS no devolvió una imagen para {capa}")
                return Image.open(io.BytesIO(respuesta.read())).convert("RGBA")
        except urllib.error.HTTPError as e:
            if e.code < 500:
                raise FuenteNoDisponible(f"GIBS respondió {e.code} para {capa}") from e
            error = e
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            error = e
        time.sleep(1.0 * (intento + 1))
    raise FuenteNoDisponible(f"GIBS no respondió para {capa}: {error}")


def _guardada(archivo, crear):
    if archivo.exists():
        return archivo.read_bytes()
    datos = crear()
    archivo.parent.mkdir(parents=True, exist_ok=True)
    archivo.write_bytes(datos)
    return datos


def _jpeg(imagen):
    salida = io.BytesIO()
    imagen.convert("RGB").save(salida, "JPEG", quality=88)
    return salida.getvalue()


def tesela(clave, z, x, y, fecha):
    """Devuelve los bytes JPEG de la tesela z/x/y de la capa `clave` en la fecha dada."""
    if clave not in CAPAS:
        raise TeselaInvalida("capa debe ser una de: " + ", ".join(CAPAS) + ".")
    if not 0 <= z <= NIVEL_MAX or not (0 <= x < 2**z and 0 <= y < 2**z):
        raise TeselaInvalida(f"La tesela {z}/{x}/{y} no existe (zoom de 0 a {NIVEL_MAX}).")
    if not FECHA.fullmatch(fecha or ""):
        raise TeselaInvalida("fecha debe tener el formato AAAA-MM-DD.")
    capa, opacidad, agrandar = CAPAS[clave]
    recuadro = _recuadro(z, x, y)
    carpeta = CACHE / "teselas"

    def crear():
        base = Image.open(io.BytesIO(_guardada(carpeta / "base" / f"{z}_{x}_{y}.jpg", lambda: _jpeg(_wms(BASE, recuadro))))).convert("RGBA")
        encima = _wms(capa, recuadro, fecha)
        if agrandar:  # los focos de calor miden 1 o 2 px: se agrandan para que se vean
            alfa = encima.getchannel("A").filter(ImageFilter.MaxFilter(5))
            color = encima.filter(ImageFilter.MaxFilter(5))
            color.putalpha(alfa)
            encima = color
        if opacidad < 1:
            encima.putalpha(encima.getchannel("A").point(lambda a: int(a * opacidad)))
        return _jpeg(Image.alpha_composite(base, encima))

    return _guardada(carpeta / clave / fecha / f"{z}_{x}_{y}.jpg", crear)
