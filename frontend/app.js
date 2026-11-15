// Interacción de las pantallas de Chacra Futura (sin dependencias)
// Idioma: las pantallas web cargan i18n.js antes; las de movil/ (ilustrativas) no, y quedan en español.
const hayIdiomas = typeof traducirPagina === "function";
const texto_ = hayIdiomas ? t : (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k]);
if (hayIdiomas) {
  traducirPagina();
  const boton = document.getElementById("idioma");
  if (boton) {
    boton.lastChild.textContent = IDIOMA === "en" ? "English" : "Español"; // muestra el idioma activo
    boton.addEventListener("click", cambiarIdioma);
  }
}
const CHECK = '<svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHECK_BIG = CHECK.replace(/16/g, "20");
const ARROW = '<svg class="ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

function setSelected(el, on) {
  el.classList.toggle("is-selected", on);
  el.setAttribute("aria-pressed", String(on));
  // Marca de selección: chips llevan check al inicio; fichas lo muestran en la esquina.
  if (el.classList.contains("chip")) {
    const has = el.querySelector("svg");
    if (on && !has) el.insertAdjacentHTML("afterbegin", CHECK);
    if (!on && has) has.remove();
  } else if (el.classList.contains("tile")) {
    el.querySelector(".tile-check").innerHTML = on ? CHECK : "";
  } else if (el.classList.contains("loc")) {
    el.querySelector(".loc-end").innerHTML = on ? CHECK_BIG : ARROW;
  }
}

// Grupos de selección única
document.querySelectorAll('[data-group="single"]').forEach((group) => {
  const items = [...group.children];
  items.forEach((item) => {
    item.addEventListener("click", () => {
      items.forEach((o) => setSelected(o, o === item));
      if (item.dataset.found && group.dataset.foundTarget) {
        document.querySelector("#" + group.dataset.foundTarget + " span").textContent = item.dataset.found;
      }
      if (item.dataset.note && group.dataset.noteTarget) {
        document.querySelector("#" + group.dataset.noteTarget + " span").textContent = item.dataset.note;
      }
    });
  });
});

// Selección múltiple con máximo (hasta 2 prioridades)
document.querySelectorAll('[data-group="multi"]').forEach((group) => {
  const max = Number(group.dataset.max || 2);
  const counter = document.getElementById(group.dataset.counter);
  const items = [...group.children];
  const update = () => {
    const n = items.filter((i) => i.classList.contains("is-selected")).length;
    if (counter) counter.textContent = texto_("{n} de {max} elegidas", { n, max }) + (counter.textContent.endsWith(".") ? "." : "");
  };
  items.forEach((item) => {
    item.addEventListener("click", () => {
      const on = !item.classList.contains("is-selected");
      const n = items.filter((i) => i.classList.contains("is-selected")).length;
      if (on && n >= max) return;
      setSelected(item, on);
      update();
    });
  });
});

// Terrenos guardados: no hay cuentas. El navegador genera un código al azar la primera vez
// y lo envía en cada pedido; el backend guarda los terrenos bajo ese código.
function codigoChacra() {
  let codigo = localStorage.getItem("chacra-codigo");
  if (!codigo) {
    codigo = crypto.randomUUID();
    localStorage.setItem("chacra-codigo", codigo);
  }
  return codigo;
}

async function pedirTerrenos(ruta = "", metodo = "GET", cuerpo) {
  const r = await fetch(api("/api/terrenos" + ruta), {
    method: metodo,
    headers: { "X-Chacra-Codigo": codigoChacra(), ...(cuerpo ? { "Content-Type": "application/json" } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const d = r.status === 204 ? {} : await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || t("No se pudo conectar con el servidor."));
  return d;
}

// Escuchar: lee la pantalla con la voz del navegador
document.querySelectorAll("[data-speak]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(document.getElementById("main").innerText);
    u.lang = hayIdiomas && IDIOMA === "en" ? "en-US" : "es-ES";
    speechSynthesis.speak(u);
  });
});

// WhatsApp: comparte la opción recomendada
document.querySelectorAll("[data-whatsapp]").forEach((a) => {
  const text = "Chacra Futura: mi mejor opción es Maíz → Haba → Trigo. Cuida la tierra y pide poca agua. (Ejemplo con datos ilustrativos)";
  a.href = "https://wa.me/?text=" + encodeURIComponent(text);
  a.target = "_blank";
  a.rel = "noopener";
});

// Enlaces de ejemplo sin destino
document.querySelectorAll('a[href="#"]').forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));
