"""Deja en caché los datos de un punto, para que la demo responda al instante.

Uso:  python precargar.py            (ejemplo de Sucre)
      python precargar.py -19.03 -65.26
"""
import sys

import nasa

lat, lon = (float(sys.argv[1]), float(sys.argv[2])) if len(sys.argv) == 3 else (-19.03, -65.26)
lat, lon = round(lat, 4), round(lon, 4)
print(f"Clima de {lat}, {lon} (NASA POWER)…", flush=True)
print("  ", nasa.clima(lat, lon)["periodo"])
print("Verdor (MODIS); puede tardar varios minutos…", flush=True)
print("  ", nasa.ndvi(lat, lon)["periodo"])
print("Listo.")
