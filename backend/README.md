# Backend

Este es el backend de Chacra. Está hecho en Python con Flask.

Por ahora es una demo: consulta datos reales de la NASA para un punto, compara rotaciones de cultivos y guarda los terrenos de cada agricultor.

## Cómo correrlo

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Luego abre <http://localhost:5000/mi-chacra.html>. El mismo servidor entrega los archivos de `../frontend`.

El verdor (MODIS) tarda varios minutos la primera vez que se consulta un punto. Para dejarlo listo antes de mostrar la demo:

```bash
python precargar.py              # ejemplo de Sucre
python precargar.py -19.03 -65.26
```

## API

| Ruta | Qué devuelve | Fuente |
|---|---|---|
| `GET /api/clima?lat=..&lon=..` | Lluvia, días de helada y temperaturas por mes; escenarios de menos lluvia | NASA POWER, datos diarios de las últimas 10 campañas (julio a junio) |
| `GET /api/ndvi?lat=..&lon=..` | Verdor (NDVI) por mes y la serie con fechas | MODIS MOD13Q1, últimos 3 años, vía ORNL DAAC |

| `GET /api/opciones?lat=..&lon=..&cultivo=..` | Las 3 rotaciones comparadas (recomendada, opción B y repetir lo de hoy). Acepta `prioridades`, `agua`, `maquinaria` y `heladas` | Clima de NASA POWER y ficha de cultivos |
| `GET /api/lugar?lat=..&lon=..` | Nombre del lugar de un punto | OpenStreetMap (Nominatim) |
| `GET /api/buscar?q=..` | Lugares que coinciden con un nombre | OpenStreetMap (Nominatim) |
| `GET` y `POST /api/terrenos` | Lista los terrenos guardados o guarda uno nuevo | SQLite local |
| `GET`, `PUT` y `DELETE /api/terrenos/<id>` | Lee, cambia o borra un terreno | SQLite local |

Todas las rutas aceptan `idioma=en` para recibir en inglés los textos que redacta el backend (por defecto, español).

Ninguna fuente pide cuenta ni clave. A la NASA y a OpenStreetMap solo se les envían la latitud y la longitud, o el nombre buscado.

## Terrenos guardados

No hay cuentas. El navegador genera un código al azar la primera vez y lo envía en la cabecera `X-Chacra-Codigo`; los terrenos se guardan bajo ese código en `datos/terrenos.db` (SQLite, incluido en Python). No se guarda nombre, teléfono ni correo. Si la persona cambia de navegador o borra sus datos, no recupera sus terrenos.

## Archivos

1. `app.py`: rutas de Flask.
2. `nasa.py`: consultas a las dos APIs, caché y reglas de clasificación (Bien, Ojo, Evitar).
3. `cultivos.py`: ficha de los 6 cultivos (agua, ciclo, heladas, familia, rendimiento y rastrojo).
4. `rotaciones.py`: compara las rotaciones y explica cada opción.
5. `lugares.py`: nombres de lugares con OpenStreetMap.
6. `terrenos.py`: terrenos guardados en SQLite.
7. `idioma.py`: idioma de cada respuesta (español o inglés).
8. `precargar.py`: llena la caché de un punto.
9. `teselas.py`: teselas del globo de Tierra 3D (`/api/tesela/<capa>/<z>/<x>/<y>.jpg?fecha=AAAA-MM-DD`). Mezcla una capa de NASA GIBS (vegetación, temperatura, lluvia o incendios) sobre el mapa de relieve. Usa Pillow.
10. `cache/` y `datos/`: respuestas, teselas y base de terrenos; no se suben al repositorio.

## Límites conocidos

1. Los umbrales de `nasa.py` son reglas simples de la demo; falta que un técnico los valide.
2. El clima viene de una cuadrícula de unos 50 km y el verdor de un píxel de 250 m.
3. La ficha de cultivos usa valores generales de la FAO; falta ajustarla a cada zona.
4. El rastrojo sale de la regresión del IPCC (2006, vol. 4, cuadro 11.2) con el rendimiento promedio de Bolivia (FAOSTAT, 2020-2024): no cambia con el lugar ni con el clima, y no descuenta lo que comen los animales o se quema.
