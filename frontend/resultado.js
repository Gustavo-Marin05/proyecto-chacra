// Resultado: pide al backend las 3 rotaciones calculadas con el clima real y las dibuja.
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const NOMBRE = { ok: "Bien", warn: "Ojo", bad: "Evitar", nodata: "Sin dato" };
const RELLENO = { ok: "#2E7D32", warn: "#F5C518", bad: "url(#hatch-rueda)", nodata: "#FFFFFF" };
const SVG = "http://www.w3.org/2000/svg";
const EJEMPLO = { lat: "-19.03", lon: "-65.26", lugar: "Sucre, Chuquisaca", cultivo: "maiz", prioridades: "agua,suelo", agua: "poca", maquinaria: "ninguna" };
const trazo = (d, w) => `<svg class="ic" width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONO = {
  ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
  bad: '<path d="M6 6l12 12M18 6L6 18"/>',
  agua: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  suelo: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  heladas: '<path d="M12 2v20M4 6l16 12M20 6L4 18"/>',
  estrella: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
};

const $ = (id) => document.getElementById(id);
const num = (v, d = 0) => (v == null ? "–" : v.toLocaleString("es", { minimumFractionDigits: d, maximumFractionDigits: d }));

function h(tag, props = {}, ...hijos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") n.className = v;
    else if (k === "icono") n.innerHTML = v; // solo constantes de ICONO
    else n.setAttribute(k, v);
  }
  n.append(...hijos);
  return n;
}

function pastilla(estado, texto) {
  const s = h("span", { class: `st st-${estado}`, icono: trazo(ICONO[estado], 16) });
  s.append(texto || NOMBRE[estado]);
  return s;
}

function lista(id, textos) {
  $(id).replaceChildren(...textos.map((t) => h("li", {}, t)));
}

// ---------- Estado ----------
let datos = null;
let ndvi = null;
let escenario = "normal";
let viendo = "rec";
let campania = 0;
let observacion = "igual";
let pedido = 0;
let entrada = null;

function leerEntrada() {
  const q = new URLSearchParams(location.search);
  if (q.has("ejemplo")) return { ...EJEMPLO };
  if (q.has("lat") && q.has("lon") && q.has("cultivo")) return Object.fromEntries(q);
  try {
    const g = JSON.parse(localStorage.getItem("chacra"));
    if (g && typeof g.lat === "number" && g.cultivo) {
      return { lat: g.lat, lon: g.lon, lugar: g.lugar || "", cultivo: g.cultivo, prioridades: (g.prioridades || []).join(","), agua: g.agua || "poca", maquinaria: g.maquinaria || "ninguna" };
    }
  } catch { /* sin datos guardados */ }
  return null;
}

const opcion = () => datos.opciones.find((o) => o.id === viendo);
const vista = () => opcion().escenarios[escenario];

// ---------- Dibujo ----------
function dibujarOpciones() {
  $("opciones").replaceChildren(...datos.opciones.map((o) => {
    const estados = o.escenarios[escenario].estados;
    const etiqueta = h("span", { class: o.id === "rec" ? "tag" : "tag tag-soft", icono: o.id === "rec" ? trazo(ICONO.estrella, 16) : "" });
    etiqueta.append(o.etiqueta);
    const stats = h("div", { class: "stats" }, ...["agua", "suelo", "heladas"].map((k) =>
      h("div", { class: "stat" },
        (() => { const s = h("span", { class: "stat-name", icono: trazo(ICONO[k], 22) }); s.append({ agua: "Agua", suelo: "Suelo", heladas: "Heladas" }[k]); return s; })(),
        pastilla(estados[k], k === "suelo" && estados[k] === "bad" ? "Mal" : null))));
    const activo = o.id === viendo;
    const boton = h("button", { type: "button", class: `btn btn-sm ${activo ? "btn-green" : "btn-outline"}`, "aria-pressed": String(activo), "data-ver": o.id }, activo ? "Viendo esta opción" : "Ver esta opción");
    return h("article", { class: `opt opt-${o.id === "rec" ? "rec" : o.id}${activo ? " is-viewing" : ""}` }, etiqueta, h("h3", {}, o.titulo), h("p", {}, o.resumen), stats, boton);
  }));
}

function sector(rOut, rIn, a0, a1) {
  const p = (r, a) => {
    const t = (a * Math.PI) / 180;
    return `${(170 + r * Math.sin(t)).toFixed(1)} ${(170 - r * Math.cos(t)).toFixed(1)}`;
  };
  return `M${p(rOut, a0)} A${rOut} ${rOut} 0 0 1 ${p(rOut, a1)} L${p(rIn, a1)} A${rIn} ${rIn} 0 0 0 ${p(rIn, a0)}Z`;
}

function svg(tag, attrs, texto) {
  const n = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (texto != null) n.textContent = texto;
  return n;
}

function dibujarRueda() {
  const paso = vista().plan[campania];
  const { fuera, dentro } = paso.rueda;
  const rueda = $("wheel");
  rueda.replaceChildren();
  const patron = svg("pattern", { id: "hatch-rueda", width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" });
  patron.append(svg("rect", { width: 6, height: 6, fill: "#FFFFFF" }), svg("rect", { width: 3, height: 6, fill: "#14532D" }));
  const defs = svg("defs", {});
  defs.append(patron);
  rueda.append(defs);
  MESES.forEach((mes, i) => {
    const a0 = i * 30 + 1.5;
    const a1 = i * 30 + 28.5;
    const estilo = (e) => ({ fill: RELLENO[e], stroke: "#14532D", "stroke-width": 1, ...(e === "nodata" ? { "stroke-dasharray": "2 3" } : {}) });
    rueda.append(svg("path", { d: sector(142, 114, a0, a1), ...estilo(fuera[i]) }), svg("path", { d: sector(110, 80, a0, a1), ...estilo(dentro[i]) }));
    const t = ((i * 30 + 15) * Math.PI) / 180;
    rueda.append(svg("text", { x: (170 + 157 * Math.sin(t)).toFixed(1), y: (174 - 157 * Math.cos(t)).toFixed(1), "text-anchor": "middle", "font-size": 11, "font-weight": 700, fill: "#14532D" }, mes));
  });
  rueda.append(svg("text", { x: 170, y: 166, "text-anchor": "middle", "font-size": 16, "font-weight": 800, fill: "#14532D" }, paso.nombre));
  rueda.append(svg("text", { x: 170, y: 186, "text-anchor": "middle", "font-size": 12, fill: "#1F2937" }, `campaña ${paso.campania}`));
  const leer = (l, nd) => MESES.map((m, i) => `${m} ${l[i] === "nodata" ? nd : NOMBRE[l[i]]}`).join(", ");
  rueda.setAttribute("aria-label", `Rueda del año de ${paso.nombre}, campaña ${paso.campania}. Suelo con cultivo: ${leer(fuera, "")}. Agua y heladas: ${leer(dentro, "sin cultivo")}.`);

  $("viendo").textContent = `${opcion().etiqueta}: ${opcion().titulo}`;
  $("campanias").replaceChildren(...vista().plan.map((p, i) => {
    const b = h("button", { type: "button", class: `chip${i === campania ? " is-selected" : ""}`, "aria-pressed": String(i === campania), "data-campania": i, icono: i === campania ? trazo(ICONO.ok, 16) : "" });
    b.append(`Campaña ${p.campania}: ${p.nombre}`);
    return b;
  }));
  $("plan").replaceChildren(...vista().plan.map((p) => h("tr", {},
    h("th", { scope: "row" }, String(p.campania)), h("td", {}, p.nombre), h("td", {}, p.siembra), h("td", {}, p.cosecha),
    h("td", {}, `${num(p.lluvia_mm)} mm`), h("td", {}, `${num(p.necesita_mm)} mm`),
    h("td", {}, pastilla(p.agua)), h("td", {}, pastilla(p.heladas)))));
}

function dibujarPorque() {
  const o = opcion();
  $("porque-titulo").textContent = o.id === "rec" ? "¿Por qué esta opción?" : `Sobre «${o.titulo}»`;
  lista("porque", o.porque);
  lista("beneficios", o.beneficios);
  lista("riesgos", o.riesgos);
  lista("lagunas", datos.lagunas);
  const evidencia = [...datos.evidencia];
  if (ndvi) evidencia.push(`${ndvi.fuente}: ${ndvi.periodo}, ${ndvi.observaciones} observaciones usadas y ${ndvi.descartadas_por_calidad} descartadas por nubes.`);
  lista("evidencia", evidencia);
  const c = datos.confianza;
  $("conf-nivel").replaceChildren(pastilla("warn", c.nivel === "baja" ? "Baja" : "Media").lastChild);
  $("conf-nivel").className = "st st-warn";
  [...$("conf-barras").children].forEach((b, i) => b.classList.toggle("on", i < c.barras));
  $("conf-barras").setAttribute("aria-label", `Confianza ${c.nivel}, ${c.barras} de 3`);
  $("conf-motivo").textContent = c.motivo;
}

function dibujarLluvia() {
  const normal = datos.clima.escenarios.normal;
  const esc = datos.clima.escenarios[escenario];
  const rec = datos.opciones[0];
  const antes = rec.escenarios.normal.estados.agua;
  const ahora = rec.escenarios[escenario].estados.agua;
  let texto;
  if (escenario === "normal") {
    texto = `Lluvia normal: ${num(normal.lluvia_anual_mm)} mm al año (${normal.descripcion.toLowerCase()}, ${datos.clima.periodo}).`;
  } else {
    const cambio = antes === ahora ? `En la opción recomendada, Agua se mantiene en ${NOMBRE[ahora]}.` : `En la opción recomendada, Agua pasa de ${NOMBRE[antes]} a ${NOMBRE[ahora]}.`;
    texto = `${esc.descripcion} (${esc.campanias.join(", ")}): ${num(esc.lluvia_anual_mm)} mm al año frente a ${num(normal.lluvia_anual_mm)} de lo normal. ${cambio}`;
  }
  document.querySelector("#rain-note span").textContent = texto;
}

function fila(titulo, detalle, celdas) {
  const th = h("th", { scope: "row" }, titulo, h("small", {}, detalle));
  return h("tr", {}, th, ...celdas.map(([t, c]) => h("td", { class: c }, t)));
}

function dibujarTabla() {
  const meses = datos.clima.meses;
  const esc = datos.clima.escenarios[escenario];
  const filas = [
    fila("Lluvia", "mm en el mes", esc.lluvia_mm.map((v, i) => [num(v), "c-" + esc.agua[i]])),
    fila("Días con helada", "bajo 0 °C", meses.map((m) => [num(m.dias_helada, 1), "c-" + m.heladas])),
    fila("Temp. mínima", "promedio, °C", meses.map((m) => [num(m.tmin_media, 1), "c-plain"])),
    fila("Temp. máxima", "promedio, °C", meses.map((m) => [num(m.tmax_media, 1), "c-plain"])),
  ];
  if (ndvi) filas.push(fila("Verdor", "NDVI, de 0 a 1", ndvi.meses.map((m) => [num(m.ndvi, 2), "c-" + m.suelo])));
  $("tabla").replaceChildren(...filas);
  $("tabla-nota").textContent = `Clima: ${datos.clima.fuente}, ${datos.clima.periodo}.` + (ndvi ? ` Verdor: ${ndvi.fuente}.` : "");
  lista("dice", [...datos.clima.hallazgos, ...(ndvi ? ndvi.hallazgos : [])]);
}

function dibujar() {
  if (campania >= vista().plan.length) campania = 0;
  dibujarOpciones();
  dibujarRueda();
  dibujarPorque();
  dibujarLluvia();
  dibujarTabla();
  const rec = datos.opciones[0];
  const mensaje = `Chacra: para ${entrada.lugar || "mi chacra"}, la opción recomendada es ${rec.titulo}. ${rec.resumen} Es un apoyo; hay que revisarlo con un técnico.`;
  $("whatsapp").href = "https://wa.me/?text=" + encodeURIComponent(mensaje);
}

// ---------- Datos ----------
function estado(texto) {
  $("estado").classList.toggle("is-hidden", !texto);
  $("estado").querySelector("span").textContent = texto || "";
}

async function cargar() {
  const este = ++pedido;
  const q = new URLSearchParams({ lat: entrada.lat, lon: entrada.lon, cultivo: entrada.cultivo, prioridades: entrada.prioridades || "", agua: entrada.agua || "poca", maquinaria: entrada.maquinaria || "ninguna", heladas: observacion === "hiela" ? "mas" : "normal" });
  try {
    const r = await fetch("/api/opciones?" + q);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "No se pudo calcular.");
    if (este !== pedido) return;
    datos = d;
    $("entrada").textContent = d.resumen_entrada;
    $("resultado").classList.remove("is-hidden");
    $("acciones").classList.remove("is-hidden");
    estado("");
    dibujar();
  } catch (e) {
    if (este === pedido) estado(`${e.message} Vuelve a intentarlo o cambia tus respuestas.`);
  }
}

async function cargarVerdor() {
  const nota = $("ndvi-estado");
  try {
    const r = await fetch(`/api/ndvi?lat=${entrada.lat}&lon=${entrada.lon}`);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error);
    ndvi = d;
    nota.classList.add("is-hidden");
    if (datos) dibujar();
  } catch {
    nota.querySelector("span").textContent = "El servicio de verdor de la NASA no respondió. Las opciones no dependen de él; puedes recargar la página para reintentar.";
  }
}

// ---------- Interacción ----------
$("opciones").addEventListener("click", (e) => {
  const b = e.target.closest("[data-ver]");
  if (!b) return;
  viendo = b.dataset.ver;
  campania = 0;
  dibujar();
});

$("campanias").addEventListener("click", (e) => {
  const b = e.target.closest("[data-campania]");
  if (!b) return;
  campania = Number(b.dataset.campania);
  dibujarRueda();
});

function elegirEscenario(nuevo) {
  escenario = nuevo;
  [...$("escenarios").children].forEach((c) => setSelected(c, c.dataset.esc === nuevo));
  dibujar();
}

$("escenarios").addEventListener("click", (e) => {
  const b = e.target.closest("[data-esc]");
  if (b && datos) elegirEscenario(b.dataset.esc);
});

$("observa").addEventListener("click", (e) => {
  const b = e.target.closest("[data-obs]");
  if (!b || !datos) return;
  const antes = observacion;
  observacion = b.dataset.obs;
  $("obs-nota").textContent = {
    igual: "",
    hiela: "Tomamos tu observación: contamos más heladas en los meses fríos y recalculamos las opciones.",
    seco: "Tomamos tu observación: te mostramos las opciones con el escenario de menos lluvia.",
  }[observacion];
  if (observacion === "seco") elegirEscenario("menos");
  else if (antes === "seco") elegirEscenario("normal");
  if ((observacion === "hiela") !== (antes === "hiela")) cargar();
});

// ---------- Inicio ----------
entrada = leerEntrada();
if (!entrada) {
  $("vacio").classList.remove("is-hidden");
  estado("");
  $("titulo").textContent = "Tus opciones";
} else {
  $("titulo").textContent = `Tus 3 opciones para ${entrada.lugar || "tu chacra"}`;
  cargar();
  cargarVerdor();
}
