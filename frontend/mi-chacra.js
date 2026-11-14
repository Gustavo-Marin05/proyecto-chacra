// Mi chacra: mapa real, ubicación, cultivo, prioridades y límites. Guarda las respuestas
// en el navegador y arma el enlace a resultado.html. Usa setSelected() y los iconos de app.js.
const CLAVE = "chacra";
const CULTIVO = { "Maíz": "maiz", "Papa": "papa", "Trigo": "trigo", "Haba": "haba", "Cebada": "cebada", "Arveja": "arveja" };
const PRIORIDAD = {
  "Ahorrar agua": "agua", "Cuidar la tierra": "suelo", "Ganar más": "ingreso",
  "Menos erosión": "erosion", "Alimento para animales": "forraje", "Devolver fuerza al suelo": "fuerza",
};
const AGUA = { Poca: "poca", Media: "media", Buena: "buena" };
const MAQUINARIA = { Ninguna: "ninguna", "Básica": "basica", Completa: "completa" };
const AGUA_TEXTO = { poca: "Poca agua", media: "Agua media", buena: "Buena agua" };
const MAQ_TEXTO = { ninguna: "sin maquinaria", basica: "maquinaria básica", completa: "maquinaria completa" };

const $ = (id) => document.getElementById(id);
const invertir = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));
const texto = (el) => el.textContent.trim();

const paneles = document.querySelectorAll(".col-main .panel");
const fichasCultivo = [...paneles[1].querySelectorAll(".tile")];
const fichasPrioridad = [...paneles[2].querySelectorAll(".tile")];
const [chipsAgua, chipsMaq] = [...paneles[2].querySelectorAll(".chips")].map((g) => [...g.children]);
const [ddLugar, ddCultivo, ddPrio1, ddPrio2, ddLimites] = document.querySelectorAll(".summary dd");
const botonesLugar = [$("loc-aqui"), $("loc-comunidad"), $("loc-mapa")];

let guardado = {};
try { guardado = JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch { guardado = {}; }
const estado = { lat: null, lon: null, lugar: null, ...guardado };

// ---------- Mapa ----------
const mapa = L.map("mapa", { scrollWheelZoom: false }).setView([-17, -65], 5);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
}).addTo(mapa);
mapa.attributionControl.setPrefix(false); // un toque en el mapa no debe sacar a la persona de la app
const icono = L.divIcon({
  className: "pin",
  html: '<svg width="40" height="40" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s7-6.5 7-12.5A7 7 0 0 0 5 9.500C5 15.500 12 22 12 22z"/><circle cx="12" cy="9.500" r="2.500" fill="#FFFFFF"/></svg>',
  iconSize: [40, 40],
  iconAnchor: [20, 38],
});
let marcador = null;
let pedidoLugar = 0;

function marcar(boton) {
  botonesLugar.forEach((b) => setSelected(b, b === boton));
}

function avisoLugar(mensaje) {
  $("found").querySelector("span").textContent = mensaje;
}

function coordenadas() {
  return `${estado.lat.toFixed(4)}, ${estado.lon.toFixed(4)}`;
}

async function ponerPunto(lat, lon, boton, nombre, acercar = true) {
  estado.lat = Math.round(lat * 1e4) / 1e4;
  estado.lon = Math.round(lon * 1e4) / 1e4;
  estado.lugar = nombre || null;
  if (!marcador) marcador = L.marker([lat, lon], { icon: icono, keyboard: false }).addTo(mapa);
  marcador.setLatLng([lat, lon]);
  if (acercar) mapa.setView([lat, lon], Math.max(mapa.getZoom(), 12));
  if (boton) marcar(boton);
  actualizar();
  const este = ++pedidoLugar; // descarta el nombre de un punto anterior que llegue tarde
  if (nombre) return;
  try {
    const r = await fetch(`/api/lugar?lat=${estado.lat}&lon=${estado.lon}`);
    const d = await r.json();
    if (este === pedidoLugar && d.nombre) {
      estado.lugar = d.nombre;
      actualizar();
    }
  } catch { /* sin nombre: se muestran las coordenadas */ }
}

mapa.on("click", (e) => ponerPunto(e.latlng.lat, e.latlng.lng, $("loc-mapa"), null, false));

$("loc-aqui").addEventListener("click", () => {
  if (!navigator.geolocation) return avisoLugar("Este navegador no permite usar la ubicación. Toca el mapa o busca tu comunidad.");
  $("loc-aqui").disabled = true;
  avisoLugar("Buscando tu ubicación…");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      $("loc-aqui").disabled = false;
      ponerPunto(pos.coords.latitude, pos.coords.longitude, $("loc-aqui"));
    },
    () => {
      $("loc-aqui").disabled = false;
      avisoLugar("No se pudo obtener tu ubicación. Toca el mapa o busca tu comunidad.");
    },
    { timeout: 15000 }
  );
});

$("loc-mapa").addEventListener("click", () => {
  $("mapa").scrollIntoView({ block: "center" });
  avisoLugar("Toca en el mapa el lugar donde está tu chacra.");
});

$("loc-comunidad").addEventListener("click", () => {
  const abierto = $("buscar-form").classList.toggle("is-hidden") === false;
  $("loc-comunidad").setAttribute("aria-expanded", String(abierto));
  if (abierto) $("buscar").focus();
});

$("buscar-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const lista = $("buscar-res");
  const consulta = $("buscar").value.trim();
  if (consulta.length < 2) return;
  lista.replaceChildren(Object.assign(document.createElement("li"), { textContent: "Buscando…" }));
  try {
    const r = await fetch("/api/buscar?q=" + encodeURIComponent(consulta));
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    if (!d.resultados.length) {
      lista.replaceChildren(Object.assign(document.createElement("li"), { textContent: "No se encontró ese lugar. Prueba con el municipio o toca el mapa." }));
      return;
    }
    lista.replaceChildren(...d.resultados.map((res) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "loc";
      const span = document.createElement("span");
      span.className = "loc-text";
      span.append(Object.assign(document.createElement("b"), { textContent: res.nombre }), Object.assign(document.createElement("small"), { textContent: res.detalle }));
      b.append(span);
      b.addEventListener("click", () => {
        lista.replaceChildren();
        $("buscar-form").classList.add("is-hidden");
        $("loc-comunidad").setAttribute("aria-expanded", "false");
        ponerPunto(res.lat, res.lon, $("loc-comunidad"), res.nombre);
      });
      li.append(b);
      return li;
    }));
  } catch (err) {
    lista.replaceChildren(Object.assign(document.createElement("li"), { textContent: err.message || "No se pudo buscar. Toca el mapa para marcar tu chacra." }));
  }
});

// ---------- Resumen y enlace ----------
function leer() {
  const elegido = (lista) => lista.find((el) => el.classList.contains("is-selected"));
  const cultivo = elegido(fichasCultivo);
  estado.cultivo = cultivo ? CULTIVO[cultivo.dataset.label] : null;
  estado.prioridades = fichasPrioridad.filter((el) => el.classList.contains("is-selected")).map((el) => PRIORIDAD[el.dataset.label]);
  estado.agua = AGUA[texto(elegido(chipsAgua))];
  estado.maquinaria = MAQUINARIA[texto(elegido(chipsMaq))];
}

function enlace() {
  const q = new URLSearchParams({
    lat: estado.lat, lon: estado.lon, cultivo: estado.cultivo,
    prioridades: estado.prioridades.join(","), agua: estado.agua, maquinaria: estado.maquinaria,
  });
  if (estado.lugar) q.set("lugar", estado.lugar);
  return "resultado.html?" + q;
}

function actualizar() {
  leer();
  const hayPunto = estado.lat != null;
  const nombres = invertir(PRIORIDAD);
  ddLugar.textContent = hayPunto ? estado.lugar || coordenadas() : "Sin elegir";
  ddCultivo.textContent = estado.cultivo ? invertir(CULTIVO)[estado.cultivo] : "Sin elegir";
  ddPrio1.textContent = nombres[estado.prioridades[0]] || "Sin elegir";
  ddPrio2.textContent = nombres[estado.prioridades[1]] || "Sin elegir";
  ddLimites.textContent = `${AGUA_TEXTO[estado.agua]} · ${MAQ_TEXTO[estado.maquinaria]}`;
  if (hayPunto) avisoLugar(`Ubicación elegida: ${estado.lugar ? estado.lugar + " (" + coordenadas() + ")" : coordenadas()}`);
  $("prio-count").textContent = `${estado.prioridades.length} de 2 elegidas.`;
  const listo = hayPunto && estado.cultivo;
  $("ver").href = listo ? enlace() : "resultado.html";
  if (listo) $("falta").classList.add("is-hidden");
  try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch { /* sin almacenamiento */ }
}

$("ver").addEventListener("click", (e) => {
  leer();
  const faltan = [];
  if (estado.lat == null) faltan.push("marca dónde está tu chacra");
  if (!estado.cultivo) faltan.push("elige qué siembras hoy");
  if (!faltan.length) return;
  e.preventDefault();
  $("falta").querySelector("span").textContent = "Antes de seguir: " + faltan.join(" y ") + ".";
  $("falta").classList.remove("is-hidden");
  (estado.lat == null ? paneles[0] : paneles[1]).scrollIntoView({ behavior: "smooth", block: "start" });
});

// app.js cambia las selecciones en el mismo clic; se lee después.
paneles.forEach((p) => p.addEventListener("click", () => setTimeout(actualizar)));

// ---------- Estado inicial: lo guardado, o nada elegido ----------
fichasCultivo.forEach((el) => setSelected(el, CULTIVO[el.dataset.label] === guardado.cultivo));
fichasPrioridad.forEach((el) => setSelected(el, (guardado.prioridades || []).includes(PRIORIDAD[el.dataset.label])));
chipsAgua.forEach((el) => setSelected(el, AGUA[texto(el)] === (guardado.agua || "poca")));
chipsMaq.forEach((el) => setSelected(el, MAQUINARIA[texto(el)] === (guardado.maquinaria || "ninguna")));
if (typeof guardado.lat === "number" && typeof guardado.lon === "number") {
  ponerPunto(guardado.lat, guardado.lon, null, guardado.lugar);
} else {
  actualizar();
}
