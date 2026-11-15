// Mi chacra: mapa real, ubicación, cultivo, prioridades y límites. Guarda las respuestas
// en el navegador y arma el enlace a resultado.html. Usa setSelected() y los iconos de app.js.
const CLAVE = "chacra";
const CULTIVO = { "Maíz": "maiz", "Papa": "papa", "Trigo": "trigo", "Haba": "haba", "Cebada": "cebada", "Arveja": "arveja" };
const PRIORIDAD = {
  "Ahorrar agua": "agua", "Cuidar la tierra": "suelo", "Ganar más": "ingreso",
  "Menos erosión": "erosion", "Alimento para animales": "forraje", "Devolver fuerza al suelo": "fuerza",
};
// Los botones de agua y maquinaria se reconocen por su posición, no por su texto (que se traduce).
const AGUA = ["poca", "media", "buena"];
const MAQUINARIA = ["ninguna", "basica", "completa"];
const AGUA_TEXTO = { poca: "Poca agua", media: "Agua media", buena: "Buena agua" };
const MAQ_TEXTO = { ninguna: "sin maquinaria", basica: "maquinaria básica", completa: "maquinaria completa" };

const $ = (id) => document.getElementById(id);
const invertir = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));

const paneles = document.querySelectorAll(".col-main .panel");
const fichasCultivo = [...paneles[1].querySelectorAll(".tile")];
const fichasPrioridad = [...paneles[2].querySelectorAll(".tile")];
const [chipsAgua, chipsMaq] = [...paneles[2].querySelectorAll(".chips")].map((g) => [...g.children]);
const [ddLugar, ddCultivo, ddPrio1, ddPrio2, ddLimites] = document.querySelectorAll(".summary dd");

// La pantalla empieza vacía. Solo al volver desde el resultado ("Cambiar mis respuestas",
// mi-chacra.html?editar=1) se recupera lo que la persona ya había respondido.
let guardado = {};
if (new URLSearchParams(location.search).has("editar")) {
  try { guardado = JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch { guardado = {}; }
}
const estado = { lat: null, lon: null, lugar: null, ...guardado };

// ---------- Mapa ----------
const mapa = L.map("mapa").setView([-17, -65], 5);
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
  setSelected($("loc-aqui"), boton === $("loc-aqui"));
}

function avisoLugar(mensaje) {
  $("found").querySelector("span").textContent = mensaje;
}

function coordenadas() {
  return `${estado.lat.toFixed(4)}, ${estado.lon.toFixed(4)}`;
}

async function ponerPunto(lat, lon, boton, nombre, acercar = 12) {
  estado.lat = Math.round(lat * 1e4) / 1e4;
  estado.lon = Math.round(lon * 1e4) / 1e4;
  estado.lugar = nombre || null;
  if (!marcador) marcador = L.marker([lat, lon], { icon: icono, keyboard: false }).addTo(mapa);
  marcador.setLatLng([lat, lon]);
  if (acercar) mapa.flyTo([lat, lon], Math.max(mapa.getZoom(), acercar), { duration: 1.2 });
  marcar(boton);
  actualizar();
  const este = ++pedidoLugar; // descarta el nombre de un punto anterior que llegue tarde
  if (nombre) return;
  try {
    const r = await fetch(api(`/api/lugar?lat=${estado.lat}&lon=${estado.lon}`));
    const d = await r.json();
    if (este === pedidoLugar && d.nombre) {
      estado.lugar = d.nombre;
      actualizar();
    }
  } catch { /* sin nombre: se muestran las coordenadas */ }
}

mapa.on("click", (e) => ponerPunto(e.latlng.lat, e.latlng.lng, null, null, 0));

$("loc-aqui").addEventListener("click", () => {
  if (!navigator.geolocation) return avisoLugar(t("Este navegador no permite usar la ubicación. Toca el mapa o busca tu comunidad."));
  $("loc-aqui").disabled = true;
  avisoLugar(t("Buscando tu ubicación…"));
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      $("loc-aqui").disabled = false;
      $("mapa").scrollIntoView({ behavior: "smooth", block: "center" });
      ponerPunto(pos.coords.latitude, pos.coords.longitude, $("loc-aqui"), null, 15);
    },
    () => {
      $("loc-aqui").disabled = false;
      avisoLugar(t("No se pudo obtener tu ubicación. Toca el mapa o busca tu comunidad."));
    },
    { timeout: 15000 }
  );
});

$("buscar-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const lista = $("buscar-res");
  const consulta = $("buscar").value.trim();
  if (consulta.length < 2) return;
  lista.replaceChildren(Object.assign(document.createElement("li"), { textContent: t("Buscando…") }));
  try {
    const r = await fetch(api("/api/buscar?q=" + encodeURIComponent(consulta)));
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    if (!d.resultados.length) {
      lista.replaceChildren(Object.assign(document.createElement("li"), { textContent: t("No se encontró ese lugar. Prueba con el municipio o toca el mapa.") }));
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
        ponerPunto(res.lat, res.lon, null, res.nombre);
      });
      li.append(b);
      return li;
    }));
  } catch (err) {
    lista.replaceChildren(Object.assign(document.createElement("li"), { textContent: err.message || t("No se pudo buscar. Toca el mapa para marcar tu chacra.") }));
  }
});

// ---------- Resumen y enlace ----------
function leer() {
  const elegido = (lista) => lista.find((el) => el.classList.contains("is-selected"));
  const cultivo = elegido(fichasCultivo);
  estado.cultivo = cultivo ? CULTIVO[cultivo.dataset.label] : null;
  estado.prioridades = fichasPrioridad.filter((el) => el.classList.contains("is-selected")).map((el) => PRIORIDAD[el.dataset.label]);
  const agua = elegido(chipsAgua);
  const maq = elegido(chipsMaq);
  estado.agua = agua ? AGUA[chipsAgua.indexOf(agua)] : null;
  estado.maquinaria = maq ? MAQUINARIA[chipsMaq.indexOf(maq)] : null;
}

function enlace() {
  const q = new URLSearchParams({
    lat: estado.lat, lon: estado.lon, cultivo: estado.cultivo,
    prioridades: estado.prioridades.join(","),
    agua: estado.agua || "poca", maquinaria: estado.maquinaria || "ninguna", // sin elegir: lo más prudente
  });
  if (estado.lugar) q.set("lugar", estado.lugar);
  return "resultado.html?" + q;
}

function actualizar() {
  leer();
  const hayPunto = estado.lat != null;
  const nombres = invertir(PRIORIDAD);
  ddLugar.textContent = hayPunto ? estado.lugar || coordenadas() : t("Sin elegir");
  ddCultivo.textContent = t(estado.cultivo ? invertir(CULTIVO)[estado.cultivo] : "Sin elegir");
  ddPrio1.textContent = t(nombres[estado.prioridades[0]] || "Sin elegir");
  ddPrio2.textContent = t(nombres[estado.prioridades[1]] || "Sin elegir");
  ddLimites.textContent = [AGUA_TEXTO[estado.agua], MAQ_TEXTO[estado.maquinaria]].filter(Boolean).map((x) => t(x)).join(" · ") || t("Sin elegir");
  if (hayPunto) avisoLugar(t("Ubicación elegida: {lugar}", { lugar: estado.lugar ? estado.lugar + " (" + coordenadas() + ")" : coordenadas() }));
  $("prio-count").textContent = t("{n} de 2 elegidas.", { n: estado.prioridades.length });
  const listo = hayPunto && estado.cultivo;
  $("ver").href = listo ? enlace() : "resultado.html";
  if (listo) $("falta").classList.add("is-hidden");
  // Abrir la pantalla vacía no borra lo guardado; se guarda desde la primera respuesta.
  if (hayPunto || estado.cultivo) {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch { /* sin almacenamiento */ }
  }
}

$("ver").addEventListener("click", (e) => {
  leer();
  const faltan = [];
  if (estado.lat == null) faltan.push(t("marca dónde está tu chacra"));
  if (!estado.cultivo) faltan.push(t("elige qué siembras hoy"));
  if (!faltan.length) return;
  e.preventDefault();
  $("falta").querySelector("span").textContent = t("Antes de seguir: {faltan}.", { faltan: faltan.join(t(" y ")) });
  $("falta").classList.remove("is-hidden");
  (estado.lat == null ? paneles[0] : paneles[1]).scrollIntoView({ behavior: "smooth", block: "start" });
});

// ---------- Guardar el terreno en el backend ----------
// Con mi-chacra.html?terreno=<id> se edita un terreno ya guardado.
const terrenoId = new URLSearchParams(location.search).get("terreno");

function errorGuardar(mensaje) {
  $("guardar-error").querySelector("span").textContent = mensaje || "";
  $("guardar-error").classList.toggle("is-hidden", !mensaje);
}

$("guardar-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  leer();
  const nombre = $("nombre").value.trim();
  const faltan = [];
  if (estado.lat == null) faltan.push(t("marca dónde está"));
  if (!estado.cultivo) faltan.push(t("elige qué siembras hoy"));
  if (!nombre) faltan.push(t("ponle un nombre"));
  if (faltan.length) {
    errorGuardar(t("Para guardar el terreno: {faltan}.", { faltan: faltan.join(", ") }));
    if (estado.lat != null && estado.cultivo) $("nombre").focus();
    return;
  }
  errorGuardar("");
  $("guardar").disabled = true;
  const terreno = {
    nombre, lat: estado.lat, lon: estado.lon, lugar: estado.lugar || "", cultivo: estado.cultivo,
    prioridades: estado.prioridades, agua: estado.agua || "poca", maquinaria: estado.maquinaria || "ninguna",
  };
  try {
    await (terrenoId ? pedirTerrenos("/" + terrenoId, "PUT", terreno) : pedirTerrenos("", "POST", terreno));
    location.href = "terrenos.html";
  } catch (err) {
    $("guardar").disabled = false;
    errorGuardar(err.message);
  }
});

// app.js cambia las selecciones en el mismo clic; se lee después.
paneles.forEach((p) => p.addEventListener("click", () => setTimeout(actualizar)));

// Al cambiar de idioma la página se recarga; si ya hay respuestas, se vuelve en modo editar
// para no perderlas (están guardadas en el navegador).
window.alCambiarIdioma = () => (!terrenoId && (estado.lat != null || estado.cultivo) ? "mi-chacra.html?editar=1" : null);

// ---------- Estado inicial: nada elegido, lo guardado al volver a editar, o un terreno ----------
function iniciar(g) {
  fichasCultivo.forEach((el) => setSelected(el, CULTIVO[el.dataset.label] === g.cultivo));
  fichasPrioridad.forEach((el) => setSelected(el, (g.prioridades || []).includes(PRIORIDAD[el.dataset.label])));
  chipsAgua.forEach((el, i) => setSelected(el, AGUA[i] === g.agua));
  chipsMaq.forEach((el, i) => setSelected(el, MAQUINARIA[i] === g.maquinaria));
  if (typeof g.lat === "number" && typeof g.lon === "number") {
    ponerPunto(g.lat, g.lon, null, g.lugar);
  } else {
    actualizar();
  }
}

if (terrenoId) {
  $("guardar-titulo").textContent = t("Guarda los cambios del terreno");
  $("guardar").textContent = t("Guardar cambios");
  pedirTerrenos("/" + terrenoId).then((terreno) => {
    $("nombre").value = terreno.nombre;
    iniciar(terreno);
  }).catch((err) => {
    errorGuardar(err.message);
    iniciar({});
  });
} else {
  iniciar(guardado);
}
