"""Nombres de lugares con Nominatim (OpenStreetMap): de coordenada a nombre y búsqueda por nombre."""
import nasa

URL = "https://nominatim.openstreetmap.org"


def _nombre(direccion):
    lugar = next((direccion[k] for k in ("village", "hamlet", "town", "city", "municipality", "county") if direccion.get(k)), None)
    partes = [p for p in (lugar, direccion.get("state"), direccion.get("country")) if p]
    return ", ".join(dict.fromkeys(partes[:2] if lugar else partes)) or None


def nombre(lat, lon):
    """Nombre corto del lugar, o None si no se puede averiguar."""
    def pedir():
        crudo = nasa._pedir(URL + "/reverse", {
            "format": "jsonv2", "lat": lat, "lon": lon, "zoom": 12, "accept-language": "es",
        }, espera=20, intentos=2)
        return {"nombre": _nombre(crudo.get("address") or {})}
    try:
        return nasa._con_cache(f"lugar_{nasa._clave(lat, lon)}", pedir)["nombre"]
    except nasa.FuenteNoDisponible:
        return None


def buscar(texto):
    crudo = nasa._pedir(URL + "/search", {
        "format": "jsonv2", "q": texto, "limit": 5, "addressdetails": 1, "accept-language": "es",
    }, espera=20, intentos=2)
    vistos, resultados = set(), []
    for r in crudo:
        try:
            etiqueta = _nombre(r.get("address") or {}) or r["display_name"]
            lat, lon = round(float(r["lat"]), 4), round(float(r["lon"]), 4)
        except (KeyError, ValueError):
            continue
        detalle = r.get("display_name", "")
        if (etiqueta, detalle) not in vistos:
            vistos.add((etiqueta, detalle))
            resultados.append({"nombre": etiqueta, "detalle": detalle, "lat": lat, "lon": lon})
    return resultados
