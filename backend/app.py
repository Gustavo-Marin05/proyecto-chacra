"""Backend de Chacra Futura (demo): API con datos reales de NASA POWER y MODIS.

Uso:  python app.py   y abrir http://localhost:5000/mi-chacra.html
También sirve los archivos de ../frontend para que la demo funcione sin configurar nada más.
"""
from pathlib import Path

from flask import Flask, jsonify, request

import lugares
import nasa
import rotaciones
from cultivos import CULTIVOS

FRONTEND = Path(__file__).resolve().parent.parent / "frontend"
app = Flask(__name__, static_folder=str(FRONTEND), static_url_path="")


class PuntoInvalido(ValueError):
    pass


def punto():
    try:
        lat, lon = float(request.args["lat"]), float(request.args["lon"])
    except (KeyError, ValueError) as e:
        raise PuntoInvalido("Faltan lat y lon, o no son números.") from e
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):  # también descarta NaN
        raise PuntoInvalido("lat debe estar entre -90 y 90, y lon entre -180 y 180.")
    return round(lat, 4), round(lon, 4)


@app.errorhandler(PuntoInvalido)
def punto_invalido(error):
    return jsonify(error=str(error)), 400


@app.errorhandler(nasa.FuenteNoDisponible)
def fuente_no_disponible(error):
    app.logger.warning("Fuente externa: %s", error)
    return jsonify(error="La fuente de datos de la NASA no respondió. Intenta de nuevo en un momento."), 502


@app.get("/")
def inicio():
    return app.send_static_file("index.html")


@app.get("/api/clima")
def api_clima():
    lat, lon = punto()
    return jsonify(lat=lat, lon=lon, reglas=nasa.REGLAS, **nasa.clima(lat, lon))


@app.get("/api/ndvi")
def api_ndvi():
    lat, lon = punto()
    return jsonify(lat=lat, lon=lon, reglas=nasa.REGLAS, **nasa.ndvi(lat, lon))


def eleccion(nombre, validos, defecto=None):
    valor = request.args.get(nombre, defecto)
    if valor not in validos:
        raise PuntoInvalido(f"{nombre} debe ser uno de: {', '.join(validos)}.")
    return valor


@app.get("/api/lugar")
def api_lugar():
    lat, lon = punto()
    return jsonify(lat=lat, lon=lon, nombre=lugares.nombre(lat, lon))


@app.get("/api/buscar")
def api_buscar():
    texto = request.args.get("q", "").strip()
    if not 2 <= len(texto) <= 80:
        raise PuntoInvalido("Escribe el nombre de tu comunidad o municipio.")
    return jsonify(resultados=lugares.buscar(texto))


@app.get("/api/opciones")
def api_opciones():
    lat, lon = punto()
    prioridades = [p for p in request.args.get("prioridades", "").split(",") if p]
    if len(prioridades) > 2 or any(p not in rotaciones.PRIORIDADES for p in prioridades):
        raise PuntoInvalido("prioridades admite hasta 2 de: " + ", ".join(rotaciones.PRIORIDADES) + ".")
    entrada = {
        "cultivo": eleccion("cultivo", CULTIVOS),
        "prioridades": prioridades,
        "agua": eleccion("agua", rotaciones.AGUA, "poca"),
        "maquinaria": eleccion("maquinaria", rotaciones.MAQUINARIA, "ninguna"),
        "heladas": eleccion("heladas", ("normal", "mas"), "normal"),
    }
    clima = nasa.clima(lat, lon)
    return jsonify(lat=lat, lon=lon, entrada=entrada, clima=clima, **rotaciones.comparar(clima, entrada))


if __name__ == "__main__":
    app.run(port=5000)
