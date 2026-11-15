# Frontend

Este es el frontend de Chacra Futura. Está hecho en HTML, CSS y JavaScript puros. La guía de estilos está en `../design.md`.

## Flujo real (web)

Necesita el backend encendido (ver `../backend/README.md`) y abrirse desde <http://localhost:5000/>.

1. `index.html`: inicio. "Ver un ejemplo" abre un resultado real de Sucre.
2. `mi-chacra.html` + `mi-chacra.js`: mapa real para marcar la chacra, cultivo, prioridades y límites.
3. `resultado.html` + `resultado.js`: las 3 rotaciones calculadas con el clima de la NASA, la rueda del año y los números de la zona.

`flujo.css` complementa a `app.css` con los estilos de estas pantallas.

## Dependencia externa

`vendor/leaflet/`: Leaflet 1.9.4 (mapa), copiado dentro del repositorio. Las imágenes del mapa vienen de OpenStreetMap y necesitan internet.

## Todavía ilustrativo

`terrenos.html` y las pantallas de `movil/` siguen con datos de ejemplo.
