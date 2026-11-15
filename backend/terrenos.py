"""Terrenos guardados de cada agricultor, en un archivo SQLite.

No hay cuentas: cada navegador genera un código al azar y lo envía en cada pedido. Quien
tiene el código ve y cambia sus terrenos; no se guarda nombre, teléfono ni correo.
"""
import re
import sqlite3
from contextlib import closing
from pathlib import Path

import rotaciones
from cultivos import CULTIVOS
from idioma import tr

ARCHIVO = Path(__file__).parent / "datos" / "terrenos.db"
CODIGO = re.compile(r"[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}")
MAXIMO = 20  # terrenos por código
CAMPOS = ("nombre", "lat", "lon", "lugar", "cultivo", "prioridades", "agua", "maquinaria")


class TerrenoInvalido(ValueError):
    pass


class TerrenoNoEncontrado(LookupError):
    pass


def _conectar():
    ARCHIVO.parent.mkdir(exist_ok=True)
    con = sqlite3.connect(ARCHIVO)
    con.row_factory = sqlite3.Row
    con.execute("""
        CREATE TABLE IF NOT EXISTS terrenos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT NOT NULL,
            nombre TEXT NOT NULL,
            lat REAL NOT NULL,
            lon REAL NOT NULL,
            lugar TEXT NOT NULL DEFAULT '',
            cultivo TEXT NOT NULL,
            prioridades TEXT NOT NULL DEFAULT '',
            agua TEXT NOT NULL,
            maquinaria TEXT NOT NULL,
            creado TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )""")
    con.execute("CREATE INDEX IF NOT EXISTS terrenos_codigo ON terrenos (codigo)")
    return con


def _fila(fila):
    terreno = {k: fila[k] for k in ("id", *CAMPOS)}
    terreno["prioridades"] = [p for p in fila["prioridades"].split(",") if p]
    return terreno


def codigo_valido(codigo):
    if not codigo or not CODIGO.fullmatch(codigo):
        raise TerrenoInvalido(tr("Falta el código de la chacra o no es válido.", "The farm code is missing or not valid."))
    return codigo


def validar(datos):
    """Devuelve los campos limpios de un terreno o lanza TerrenoInvalido."""
    if not isinstance(datos, dict):
        raise TerrenoInvalido(tr("Se esperaba un terreno en formato JSON.", "A plot in JSON format was expected."))
    try:
        lat, lon = float(datos["lat"]), float(datos["lon"])
    except (KeyError, TypeError, ValueError) as e:
        raise TerrenoInvalido(tr("Marca en el mapa dónde está el terreno.", "Mark on the map where the plot is.")) from e
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):  # también descarta NaN
        raise TerrenoInvalido(tr("La ubicación del terreno no es válida.", "The plot location is not valid."))

    nombre = " ".join(str(datos.get("nombre") or "").split())
    if not 1 <= len(nombre) <= 40:
        raise TerrenoInvalido(tr("Ponle un nombre al terreno, de hasta 40 letras.", "Give the plot a name of up to 40 letters."))
    if datos.get("cultivo") not in CULTIVOS:
        raise TerrenoInvalido(tr("Elige qué siembras hoy en el terreno.", "Choose what you grow on the plot today."))

    prioridades = datos.get("prioridades") or []
    if (not isinstance(prioridades, list) or len(prioridades) > 2
            or any(p not in rotaciones.PRIORIDADES for p in prioridades)):
        raise TerrenoInvalido(tr("Las prioridades admiten hasta 2 de: ", "Priorities accept up to 2 of: ") + ", ".join(rotaciones.PRIORIDADES) + ".")
    agua = datos.get("agua") or "poca"
    maquinaria = datos.get("maquinaria") or "ninguna"
    if agua not in rotaciones.AGUA or maquinaria not in rotaciones.MAQUINARIA:
        raise TerrenoInvalido(tr("El agua o la maquinaria no son válidas.", "The water or machinery value is not valid."))

    return {
        "nombre": nombre, "lat": round(lat, 4), "lon": round(lon, 4),
        "lugar": " ".join(str(datos.get("lugar") or "").split())[:80],
        "cultivo": datos["cultivo"], "prioridades": ",".join(dict.fromkeys(prioridades)),
        "agua": agua, "maquinaria": maquinaria,
    }


def listar(codigo):
    with closing(_conectar()) as con:
        return [_fila(f) for f in con.execute("SELECT * FROM terrenos WHERE codigo = ? ORDER BY id", (codigo,))]


def obtener(codigo, terreno_id):
    with closing(_conectar()) as con:
        fila = con.execute("SELECT * FROM terrenos WHERE id = ? AND codigo = ?", (terreno_id, codigo)).fetchone()
    if fila is None:
        raise TerrenoNoEncontrado(terreno_id)
    return _fila(fila)


def crear(codigo, datos):
    limpio = validar(datos)
    with closing(_conectar()) as con, con:
        if con.execute("SELECT COUNT(*) FROM terrenos WHERE codigo = ?", (codigo,)).fetchone()[0] >= MAXIMO:
            raise TerrenoInvalido(tr(f"Se pueden guardar hasta {MAXIMO} terrenos.", f"You can save up to {MAXIMO} plots."))
        cursor = con.execute(
            f"INSERT INTO terrenos (codigo, {', '.join(CAMPOS)}) VALUES (?, {', '.join('?' * len(CAMPOS))})",
            (codigo, *(limpio[c] for c in CAMPOS)))
        nuevo = cursor.lastrowid
    return obtener(codigo, nuevo)


def cambiar(codigo, terreno_id, datos):
    limpio = validar(datos)
    with closing(_conectar()) as con, con:
        cursor = con.execute(
            f"UPDATE terrenos SET {', '.join(c + ' = ?' for c in CAMPOS)} WHERE id = ? AND codigo = ?",
            (*(limpio[c] for c in CAMPOS), terreno_id, codigo))
        if cursor.rowcount == 0:
            raise TerrenoNoEncontrado(terreno_id)
    return obtener(codigo, terreno_id)


def borrar(codigo, terreno_id):
    with closing(_conectar()) as con, con:
        if con.execute("DELETE FROM terrenos WHERE id = ? AND codigo = ?", (terreno_id, codigo)).rowcount == 0:
            raise TerrenoNoEncontrado(terreno_id)
