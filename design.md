# Design — Chacra Futura

Guía de estilos del frontend (`frontend/`).

## Principios

1. Fondo siempre blanco.
2. Paleta principal: verde, amarillo y blanco.
3. Todos los iconos son SVG inline (sin emojis ni fuentes de iconos).
4. Las ilustraciones son fotos reales de Santa Cruz y de sus problemas (incendios, quemas, inundaciones), en `frontend/img/` con sus créditos en `img/CREDITOS.md`. No hay escenas 3D.
5. Respeta `prefers-reduced-motion`.

## Colores

| Token | Valor | Uso |
|---|---|---|
| `--white` | `#FFFFFF` | Fondo de página y tarjetas |
| `--green-900` | `#14532D` | Texto de títulos |
| `--green-700` | `#2E7D32` | Color principal, botones, iconos |
| `--green-500` | `#5CB85C` | Acentos |
| `--green-100` | `#E8F5E9` | Superficies suaves |
| `--yellow-500` | `#F5C518` | Acento secundario, llamadas a la acción |
| `--yellow-100` | `#FFF8DC` | Superficies suaves cálidas |
| `--ink` | `#1F2937` | Texto de cuerpo |

Contraste: texto verde oscuro o `--ink` sobre blanco; texto `--green-900` sobre amarillo.

## Tipografía

1. Familia: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
2. Títulos: peso 800, `clamp(2.2rem, 5vw, 4rem)`.
3. Cuerpo: 1rem / 1.6.

## Espaciado y forma

1. Escala: 4, 8, 16, 24, 48, 96 px.
2. Radio: 16px en tarjetas, 999px en botones.
3. Sombras suaves de tono verde: `0 20px 40px rgba(46,125,50,.15)`.

## Iconos

1. SVG inline, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.8"`, extremos redondeados.
2. Color por `currentColor` (verde o amarillo según contexto).
3. Con `aria-hidden="true"` cuando son decorativos.

## Imágenes

1. Fotos reales con licencia libre, de 1200 px de ancho, con `alt` descriptivo y `width`/`height` definidos.
2. Hero: foto de Santa Cruz con `object-fit: cover` y radio 24px.
3. Sección de problemas: tarjetas `.photo` dentro de `.photo-grid`, con título y una frase corta.
4. Cada foto nueva se acredita en `frontend/img/CREDITOS.md`.

## Estructura de carpetas

1. `frontend/index.html`, `mi-chacra.html`, `resultado.html`, `terrenos.html`: versión web (mockups W1 a W4).
2. `frontend/movil/`: flujo móvil en 6 pantallas (Inicio, Ubicación, Cultivo, Prioridades, Resultado, Detalle).
3. `frontend/app.css` y `frontend/app.js`: estilos e interacción de las pantallas.
4. `frontend/img/`: fotos reales y `CREDITOS.md`.
5. `frontend/logo.txt`: isotipo SVG original (copia inline en `index.html`).
6. `backend/`: sin interfaz; no aplica estilos.

## Logo

1. Isotipo SVG inline de 40x40 px en la cabecera, junto al texto `CHACRA` (peso 800, `letter-spacing: .12em`).
2. Colores propios del logo: verdes de la paleta, `--yellow-500` y tierra (`#C86D3B`, `#B35627`, `#9E471C`) solo dentro del isotipo.
3. Fuente de verdad: `frontend/logo.txt`.

## Componentes

1. `.btn-yellow` (acción principal), `.btn-green` y `.btn-outline` (secundarias), todos con radio 999px.
2. `.photo` y `.photo-grid`: fotos reales con pie de foto.
3. `.card-icon.icon-green` / `.icon-yellow`: contenedor del icono SVG.
4. Secciones alternan fondo blanco, `--green-100` y `--yellow-100`.

## Pantallas de los mockups

1. Fuente: mockups "Chacra Futura – Mockups" (6 pantallas móviles y 4 web). Se replican con esta guía: fondo blanco, verde y amarillo; no se usa el beige ni los verdes del mockup original.
2. Estados `Bien` (verde, check), `Ojo` (amarillo, alerta) y `Evitar` / `Mal` (borde punteado o rayado, equis). Nunca solo por color.
3. Rueda del año: dos anillos de 12 meses (afuera suelo cubierto, adentro agua y calor); `Evitar` usa rayado diagonal.
4. Calendario "Mi año completo": Siembra amarillo, Crece verde claro, Cosecha verde oscuro, Suelo libre borde punteado.
5. Móvil: columna de máximo 430px, barra de progreso de 4 pasos y botón principal fijo abajo.
6. Todos los datos son ilustrativos y se avisa en pantalla.
