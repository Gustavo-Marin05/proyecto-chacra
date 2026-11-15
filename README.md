# Chacra

Proyecto con frontend y backend para Chacra.

## Estructura

1. `frontend/`: pantallas (HTML, CSS y JavaScript puro) y `frontend/img/` con fotos reales de Santa Cruz y sus problemas.
2. `frontend/movil/`: pantallas de la versión móvil.
3. `backend/`: aún sin implementar (solo README).
4. `design.md`: guía de estilos del frontend.

## Requisitos

1. Un navegador moderno (Chrome, Firefox, Edge o Safari).
2. Opcional, para servir los archivos en local: Python 3 o Node.js.

No hay dependencias que instalar: el frontend no usa `npm`, frameworks ni librerías externas.

## Cómo correr el frontend

### Opción 1: abrir el archivo directamente

1. Clona el repositorio y entra a la carpeta:
   1. `git clone https://github.com/Gustavo-Marin05/proyecto-chacra.git`
   2. `cd proyecto-chacra`
2. Abre `frontend/index.html` en el navegador (doble clic o arrastrándolo a la ventana).

### Opción 2: servidor local (recomendada)

1. Desde la raíz del proyecto, entra a `frontend/`: `cd frontend`
2. Levanta un servidor con una de estas opciones:
   1. Python: `python3 -m http.server 8000`
   2. Node.js: `npx serve -l 8000`
3. Abre http://localhost:8000 en el navegador.
4. Para detener el servidor, pulsa `Ctrl + C`.

## Pantallas principales

1. Inicio: `/index.html`
2. Terrenos: `/terrenos.html`
3. Mi chacra: `/mi-chacra.html`
4. Resultado: `/resultado.html`
5. Versión móvil: `/movil/index.html`

## Backend

El backend todavía no está implementado. Cuando exista, sus instrucciones de ejecución se agregarán en `backend/README.md`.
