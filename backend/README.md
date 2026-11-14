# Backend

Este es el backend de Chacra Futura. Está hecho en Python con Flask.

Por ahora es una demo: consulta datos reales de la NASA para un punto y los resume mes a mes.

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

Ninguna de las dos fuentes pide cuenta ni clave. A la NASA solo se le envían la latitud y la longitud.

## Archivos

1. `app.py`: rutas de Flask.
2. `nasa.py`: consultas a las dos APIs, caché y reglas de clasificación (Bien, Ojo, Evitar).
3. `precargar.py`: llena la caché de un punto.
4. `cache/`: respuestas guardadas; no se sube al repositorio.

## Límites conocidos

1. Los umbrales de `nasa.py` son reglas simples de la demo; falta que un técnico los valide.
2. El clima viene de una cuadrícula de unos 50 km y el verdor de un píxel de 250 m.
3. Todavía no hay tabla de cultivos ni comparación de rotaciones.
