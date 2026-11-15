"""Backend de Chacra (demo): API con datos reales de NASA POWER y MODIS.

Uso:  python app.py   y abrir http://localhost:5000/mi-chacra.html
También sirve los archivos de ../frontend para que la demo funcione sin configurar nada más.
"""
from pathlib import Path

from flask import Flask, Response, jsonify, request

import idioma
import lugares
import nasa
import rotaciones
import terrenos
import teselas
from cultivos import CULTIVOS
from idioma import tr

FRONTEND = Path(__file__).resolve().parent.parent / "frontend"
app = Flask(__name__, static_folder=str(FRONTEND), static_url_path="")


class PuntoInvalido(ValueError):
    pass


@app.before_request
def elegir_idioma():
    idioma.usar(request.args.get("idioma"))


def punto():
    try:
        lat, lon = float(request.args["lat"]), float(request.args["lon"])
    except (KeyError, ValueError) as e:
        raise PuntoInvalido(tr("Faltan lat y lon, o no son números.", "lat and lon are missing or are not numbers.")) from e
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):  # también descarta NaN
        raise PuntoInvalido(tr("lat debe estar entre -90 y 90, y lon entre -180 y 180.", "lat must be between -90 and 90, and lon between -180 and 180."))
    return round(lat, 4), round(lon, 4)


@app.errorhandler(PuntoInvalido)
def punto_invalido(error):
    return jsonify(error=str(error)), 400


@app.errorhandler(nasa.FuenteNoDisponible)
def fuente_no_disponible(error):
    app.logger.warning("Fuente externa: %s", error)
    return jsonify(error=tr("La fuente de datos de la NASA no respondió. Intenta de nuevo en un momento.",
                            "The NASA data source did not respond. Try again in a moment.")), 502


@app.errorhandler(terrenos.TerrenoInvalido)
def terreno_invalido(error):
    return jsonify(error=str(error)), 400


@app.errorhandler(terrenos.TerrenoNoEncontrado)
def terreno_no_encontrado(error):
    return jsonify(error=tr("Ese terreno no existe o no es de esta chacra.", "That plot does not exist or does not belong to this farm.")), 404


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
        raise PuntoInvalido(tr(f"{nombre} debe ser uno de: {', '.join(validos)}.", f"{nombre} must be one of: {', '.join(validos)}."))
    return valor


@app.get("/api/lugar")
def api_lugar():
    lat, lon = punto()
    return jsonify(lat=lat, lon=lon, nombre=lugares.nombre(lat, lon))


@app.get("/api/buscar")
def api_buscar():
    texto = request.args.get("q", "").strip()
    if not 2 <= len(texto) <= 80:
        raise PuntoInvalido(tr("Escribe el nombre de tu comunidad o municipio.", "Type the name of your community or municipality."))
    return jsonify(resultados=lugares.buscar(texto))


@app.get("/api/opciones")
def api_opciones():
    lat, lon = punto()
    prioridades = [p for p in request.args.get("prioridades", "").split(",") if p]
    if len(prioridades) > 2 or any(p not in rotaciones.PRIORIDADES for p in prioridades):
        raise PuntoInvalido(tr("prioridades admite hasta 2 de: ", "prioridades accepts up to 2 of: ") + ", ".join(rotaciones.PRIORIDADES) + ".")
    entrada = {
        "cultivo": eleccion("cultivo", CULTIVOS),
        "prioridades": prioridades,
        "agua": eleccion("agua", rotaciones.AGUA, "poca"),
        "maquinaria": eleccion("maquinaria", rotaciones.MAQUINARIA, "ninguna"),
        "heladas": eleccion("heladas", ("normal", "mas"), "normal"),
    }
    clima = nasa.clima(lat, lon)
    return jsonify(lat=lat, lon=lon, entrada=entrada, clima=clima, **rotaciones.comparar(clima, entrada))


def codigo():
    """Código al azar que el navegador genera y envía para reconocer sus terrenos."""
    return terrenos.codigo_valido(request.headers.get("X-Chacra-Codigo"))


@app.get("/api/terrenos")
def api_terrenos():
    return jsonify(terrenos=terrenos.listar(codigo()))


@app.post("/api/terrenos")
def api_terreno_nuevo():
    return jsonify(terrenos.crear(codigo(), request.get_json(silent=True))), 201


@app.get("/api/terrenos/<int:terreno_id>")
def api_terreno(terreno_id):
    return jsonify(terrenos.obtener(codigo(), terreno_id))


@app.put("/api/terrenos/<int:terreno_id>")
def api_terreno_cambiar(terreno_id):
    return jsonify(terrenos.cambiar(codigo(), terreno_id, request.get_json(silent=True)))


@app.delete("/api/terrenos/<int:terreno_id>")
def api_terreno_borrar(terreno_id):
    terrenos.borrar(codigo(), terreno_id)
    return "", 204


@app.errorhandler(teselas.TeselaInvalida)
def tesela_invalida(error):
    return jsonify(error=str(error)), 400


@app.get("/api/tesela/<capa>/<int:z>/<int:x>/<int:y>.jpg")
def api_tesela(capa, z, x, y):
    """Tesela del globo 3D: capa de la NASA sobre el mapa base (ver teselas.py)."""
    datos = teselas.tesela(capa, z, x, y, request.args.get("fecha", ""))
    return Response(datos, mimetype="image/jpeg", headers={"Cache-Control": "public, max-age=86400"})


if __name__ == "__main__":
    app.run(port=5000)
