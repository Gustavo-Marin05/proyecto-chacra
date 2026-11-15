"""Idioma de la respuesta: español (por defecto) o inglés, según el parámetro ?idioma=."""
from contextvars import ContextVar

IDIOMAS = ("es", "en")
_actual = ContextVar("idioma", default="es")


def usar(idioma):
    _actual.set(idioma if idioma in IDIOMAS else "es")


def actual():
    return _actual.get()


def tr(es, en):
    """Devuelve el texto en el idioma del pedido. Los dos textos se escriben juntos en el código."""
    return en if _actual.get() == "en" else es


def decimal(valor, decimales=None):
    """Número con coma decimal en español y punto en inglés."""
    texto = str(valor) if decimales is None else f"{valor:.{decimales}f}"
    return texto if _actual.get() == "en" else texto.replace(".", ",")
