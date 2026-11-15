// Mis terrenos: lista los terrenos guardados en el backend, pide la rotación recomendada de
// cada uno (/api/opciones) y arma el calendario del año. Usa pedirTerrenos() de app.js.
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const CULTIVO = { maiz: "Maíz", papa: "Papa", trigo: "Trigo", haba: "Haba", cebada: "Cebada", arveja: "Arveja" };
const ESTADO = { ok: "Bien", warn: "Ojo", bad: "Evitar" };
const FASE = { sow: "Siembra", grow: "Crece", harv: "Cosecha", free: "Suelo libre" };
const PLANO = '<svg class="thumb" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="160" height="100" fill="#E8F5E9"/><path d="M12 84 L36 12 H148 L124 88 Z" fill="#FFFFFF" stroke="#2E7D32" stroke-width="3" stroke-linejoin="round"/><path d="M20 78 L44 22M56 78 L80 22M92 78 L116 22" stroke="#2E7D32" stroke-width="7" stroke-linecap="round"/><path d="M38 78 L62 22M74 78 L98 22M110 78 L134 22" stroke="#5CB85C" stroke-width="7" stroke-linecap="round"/><circle cx="130" cy="20" r="9" fill="#F5C518"/></svg>';

const $ = (id) => document.getElementById(id);

function h(tag, props = {}, ...hijos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") n.className = v;
    else n.setAttribute(k, v);
  }
  n.append(...hijos);
  return n;
}

function juntar(lista) {
  return lista.length < 2 ? lista.join("") : lista.slice(0, -1).join(", ") + t(" y ") + lista[lista.length - 1];
}

function estado(texto) {
  $("estado").classList.toggle("is-hidden", !texto);
  $("estado").querySelector("span").textContent = texto || "";
}

let terrenos = [];
const planes = new Map(); // id del terreno → primera campaña de su rotación recomendada

function consulta(terreno) {
  return new URLSearchParams({ lat: terreno.lat, lon: terreno.lon, cultivo: terreno.cultivo, prioridades: terreno.prioridades.join(","), agua: terreno.agua, maquinaria: terreno.maquinaria });
}

// ---------- Tarjetas ----------
function tarjeta(terreno) {
  const sugerida = h("p", {}, t("Calculando con el clima de la NASA…"));
  const estados = h("div", { class: "stats-inline" });
  const ver = new URLSearchParams(consulta(terreno));
  ver.set("lugar", terreno.nombre);
  ver.set("terreno", terreno.id);
  const borrar = h("button", { type: "button", class: "btn btn-outline btn-sm" }, t("Borrar"));
  borrar.addEventListener("click", async () => {
    if (!confirm(t("¿Borrar el terreno «{nombre}»? No se puede deshacer.", { nombre: terreno.nombre }))) return;
    borrar.disabled = true;
    try {
      await pedirTerrenos("/" + terreno.id, "DELETE");
      cargar();
    } catch (e) {
      borrar.disabled = false;
      estado(e.message);
    }
  });
  const plano = h("div", {});
  plano.innerHTML = PLANO; // constante propia, sin datos de la persona
  const articulo = h("article", { class: "terr" }, plano.firstChild,
    h("div", { class: "terr-body" },
      h("h3", {}, terreno.nombre),
      h("p", { class: "small" }, t("{lugar} · hoy siembras {cultivo}", { lugar: terreno.lugar || `${terreno.lat}, ${terreno.lon}`, cultivo: t(CULTIVO[terreno.cultivo]) })),
      sugerida, estados,
      h("div", { class: "terr-actions" },
        h("a", { class: "btn btn-green btn-sm", href: "resultado.html?" + ver }, t("Ver opciones")),
        h("a", { class: "btn btn-outline btn-sm", href: "mi-chacra.html?terreno=" + terreno.id }, t("Editar")),
        borrar)));

  const listo = fetch(api("/api/opciones?" + consulta(terreno))).then(async (r) => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || t("No se pudo calcular."));
    const rec = d.opciones[0];
    sugerida.replaceChildren(h("b", {}, t("Sugerida: ")), rec.titulo);
    estados.replaceChildren(...[["agua", "Agua"], ["suelo", "Suelo"], ["heladas", "Heladas"]].map(([k, nombre]) =>
      h("span", { class: "st st-" + rec.estados[k] }, t("{nombre}: {estado}", { nombre: t(nombre), estado: t(ESTADO[rec.estados[k]]) }))));
    planes.set(terreno.id, rec.escenarios.normal.plan[0]);
  }).catch((e) => {
    sugerida.textContent = t("{error} Recarga la página para reintentar.", { error: e.message });
  });
  return { articulo, listo };
}

// ---------- Calendario ----------
function fases(plan) {
  const siembra = MESES.indexOf(plan.siembra);
  const cosecha = MESES.indexOf(plan.cosecha);
  return MESES.map((_, m) => (m === siembra ? "sow" : m === cosecha ? "harv" : plan.rueda.dentro[m] !== "nodata" ? "grow" : "free"));
}

function dibujarCalendario() {
  const conPlan = terrenos.filter((terreno) => planes.has(terreno.id));
  const filas = conPlan.map((terreno) => {
    const f = fases(planes.get(terreno.id));
    return { terreno, f, tr: h("tr", {}, h("th", { scope: "row" }, h("b", {}, terreno.nombre), h("small", {}, t(CULTIVO[terreno.cultivo]))),
      ...f.map((x) => h("td", { class: "gc g-" + x }, h("span", {}, t(FASE[x]))))) };
  });
  // Carga de trabajo: siembras y cosechas que caen en el mismo mes.
  const tareas = MESES.map((_, m) => filas.filter((x) => x.f[m] === "sow" || x.f[m] === "harv"));
  const carga = h("tr", {}, h("th", { scope: "row" }, h("b", {}, t("Carga de trabajo"))),
    ...tareas.map((l) => {
      const nivel = l.length >= 2 ? "mucho" : l.length === 1 ? "medio" : "bajo";
      return h("td", { class: "wk wk-" + nivel }, h("span", {}, t({ mucho: "Mucho", medio: "Medio", bajo: "Bajo" }[nivel])));
    }));
  $("calendario").replaceChildren(...filas.map((x) => x.tr), ...(filas.length ? [carga] : []));

  const cargados = tareas.map((l, m) => [l, m]).filter(([l]) => l.length >= 2);
  $("aviso").classList.toggle("is-hidden", !cargados.length);
  if (cargados.length) {
    $("aviso-texto").textContent = cargados.map(([l, m]) => {
      const partes = [["sow", t("siembras")], ["harv", t("cosechas")]]
        .map(([fase, verbo]) => [verbo, l.filter((x) => x.f[m] === fase).map((x) => `«${x.terreno.nombre}»`)])
        .filter(([, nombres]) => nombres.length)
        .map(([verbo, nombres]) => `${verbo} ${juntar(nombres)}`);
      return t("En {mes} {tareas}.", { mes: t(MES_LARGO[m]), tareas: juntar(partes) });
    }).join(" ") + t(" Eso pide más gente y más herramientas al mismo tiempo.");
    $("idea-titulo").textContent = t("Una idea: escalonar las siembras");
    $("idea-texto").textContent = t("Sembrar un terreno unas semanas antes que el otro reparte el trabajo y también el riesgo: si una helada daña uno, el otro puede salvarse. Es una idea general; confírmala con un técnico.");
  } else if (filas.length < 2) {
    $("idea-titulo").textContent = t("Agrega otro terreno para comparar");
    $("idea-texto").textContent = t("Con dos o más terrenos, aquí verás si se juntan siembras o cosechas en el mismo mes.");
  } else {
    $("idea-titulo").textContent = t("El trabajo queda repartido");
    $("idea-texto").textContent = t("Ningún mes junta siembras o cosechas de dos terrenos. Es un cálculo general; confírmalo con un técnico.");
  }
}

// ---------- Inicio ----------
async function cargar() {
  try {
    terrenos = (await pedirTerrenos()).terrenos;
  } catch (e) {
    estado(t("{error} Revisa que el servidor esté encendido y recarga la página.", { error: e.message }));
    return;
  }
  estado("");
  planes.clear();
  $("vacio").classList.toggle("is-hidden", terrenos.length > 0);
  $("contenido").classList.toggle("is-hidden", terrenos.length === 0);
  if (!terrenos.length) return;
  const tarjetas = terrenos.map(tarjeta);
  $("terrenos").replaceChildren(...tarjetas.map((x) => x.articulo));
  dibujarCalendario();
  tarjetas.forEach((x) => x.listo.then(dibujarCalendario)); // el calendario se llena a medida que llegan
}

cargar();
