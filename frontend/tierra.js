// Tierra 3D: globo interactivo con imágenes de la NASA y clima real (NASA POWER, vía el backend)
(function () {
  const el = document.getElementById("globo");
  if (!el || typeof Globe !== "function") {
    const e = document.getElementById("globo-estado");
    if (e) e.textContent = "No se pudo cargar el globo 3D en este navegador.";
    return;
  }
  const $ = (id) => document.getElementById(id);
  const BASE = "vendor/globe/earth-blue-marble.jpg";
  const NOCHE = "vendor/globe/earth-night.jpg";
  const RELIEVE = "vendor/globe/earth-topology.png";
  const BOLIVIA = { lat: -17, lng: -64, altitude: 2.4 };
  const SCZ = { lat: -17.6, lng: -61.8, altitude: 0.42 };

  // Fecha de las capas: 3 días atrás (la NASA publica con un pequeño retraso)
  const FECHA = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
  const WMTS = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best";
  // Cada capa se dibuja en teselas que se afinan al acercar el zoom.
  // Las que van sobre un mapa base las mezcla el backend (/api/tesela, ver backend/teselas.py).
  const mezcla = (k) => (x, y, l) => `/api/tesela/${k}/${l}/${x}/${y}.jpg?fecha=${FECHA}`;
  const CAPAS = {
    detalle: { max: 9, url: (x, y, l) => `${WMTS}/MODIS_Terra_CorrectedReflectance_TrueColor/default/${FECHA}/GoogleMapsCompatible_Level9/${l}/${y}/${x}.jpg`, nota: `Foto real del satélite MODIS de la NASA (${FECHA}). Acércate para ver ríos, campos y quemas.` },
    verde: { max: 9, url: mezcla("verde"), nota: `Vegetación (NDVI), MODIS de la NASA. Verde intenso = cultivos y bosque sanos; claro = suelo seco o sin plantas.` },
    temp: { max: 9, url: mezcla("temp"), nota: `Temperatura del suelo de día, MODIS de la NASA (${FECHA}). Azul = frío, amarillo/rojo = caliente. Sin color = nubes ese día.` },
    lluvia: { max: 9, url: mezcla("lluvia"), nota: `Lluvia en curso, misión IMERG de la NASA (${FECHA}). Verde = poca, rojo = mucha.` },
    fuego: { max: 9, url: mezcla("fuego"), nota: `Focos de calor (incendios y quemas), MODIS de la NASA (${FECHA}). Cada punto naranja es un foco.` },
    tierra: { max: 8, url: (x, y, l) => `${WMTS}/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/${l}/${y}/${x}.jpeg`, nota: "Mapa de relieve Blue Marble de la NASA." },
    noche: { max: 8, base: NOCHE, url: (x, y, l) => `${WMTS}/VIIRS_CityLights_2012/default/GoogleMapsCompatible_Level8/${l}/${y}/${x}.jpeg`, nota: "Luces de la Tierra de noche, satélite VIIRS de la NASA." },
  };

  // Lugares, en orden de importancia: si dos nombres chocan en pantalla, se muestra el primero
  const lugares = (lista, grupo) => lista.map(([nombre, lat, lng]) => ({ nombre, lat, lng, lluvia: null, temp: null, grupo }));
  const CIUDADES = lugares([
    ["Santa Cruz de la Sierra", -17.78, -63.18], ["La Paz", -16.5, -68.15], ["Cochabamba", -17.39, -66.16],
    ["Sucre", -19.05, -65.26], ["Oruro", -17.97, -67.11], ["Potosí", -19.58, -65.75],
    ["Tarija", -21.53, -64.73], ["Trinidad", -14.83, -64.9], ["Cobija", -11.03, -68.77], ["Camiri", -20.05, -63.52],
  ], "bolivia");
  const SANTA_CRUZ = lugares([
    ["Santa Cruz de la Sierra", -17.78, -63.18], ["Montero", -17.34, -63.26], ["San Ignacio de Velasco", -16.37, -60.96],
    ["San José de Chiquitos", -17.84, -60.74], ["Puerto Suárez", -18.96, -57.8], ["Camiri", -20.05, -63.52],
    ["Vallegrande", -18.49, -64.11], ["Concepción", -16.14, -62.03], ["Roboré", -18.33, -59.76],
    ["Yapacaní", -17.4, -63.88], ["Ascensión de Guarayos", -15.9, -63.19], ["San Julián", -16.92, -62.62],
    ["Charagua", -19.79, -63.18], ["Samaipata", -18.18, -63.87], ["Comarapa", -17.91, -64.53], ["San Matías", -16.36, -58.4],
    ["Cuatro Cañadas", -17.2, -62.55], ["Warnes", -17.51, -63.17], ["Cotoca", -17.75, -63.02], ["La Guardia", -17.9, -63.33],
    ["El Torno", -17.99, -63.39], ["Portachuelo", -17.35, -63.4], ["Pailón", -17.66, -62.73], ["Buena Vista", -17.46, -63.67],
    ["Okinawa", -17.2, -62.85], ["San Carlos", -17.4, -63.74], ["Santa Rosa del Sara", -17.12, -63.58], ["Mairana", -18.12, -63.95],
    ["Pampa Grande", -18.08, -64.12], ["Cabezas", -18.78, -63.4], ["Gutiérrez", -19.4, -63.55], ["San Ramón", -16.65, -62.57],
    ["San Javier", -16.27, -62.51],
  ], "scz");
  // Santa Cruz y Camiri están en las dos listas: comparten los datos
  SANTA_CRUZ.forEach((c) => { const b = CIUDADES.find((x) => x.nombre === c.nombre); if (b) { c.espejo = b; b.espejo = c; } });
  const TODOS = [...CIUDADES, ...SANTA_CRUZ.filter((c) => !c.espejo)];
  let vista = "scz";
  const visibles = () => (vista === "scz" ? SANTA_CRUZ : CIUDADES);

  const memo = {};
  function clima(lat, lng) {
    const k = lat + "," + lng;
    if (!memo[k]) memo[k] = fetch(`/api/clima?lat=${lat}&lon=${lng}`).then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error || "Sin datos"); return j; }).catch((e) => { delete memo[k]; throw e; });
    return memo[k];
  }
  const colorLluvia = (mm) => (mm == null ? "#cfd8dc" : mm < 600 ? "#e65100" : mm < 1000 ? "#f5c518" : mm < 1500 ? "#43a047" : "#1565c0");

  // Marcador HTML de cada lugar: punto chico + nombre (texto real, con tildes y tamaño fijo)
  function marcador(c) {
    if (c.el) return c.el;
    const b = document.createElement("button");
    b.type = "button"; b.className = "g-pueblo";
    const punto = document.createElement("span"); punto.className = "g-punto";
    const nombre = document.createElement("span"); nombre.className = "g-nombre"; nombre.textContent = c.nombre;
    b.append(punto, nombre);
    b.addEventListener("click", (e) => { e.stopPropagation(); elegir(c.lat, c.lng, c.nombre); });
    c.el = b; c.punto = punto;
    pintarMarcador(c);
    return b;
  }
  function pintarMarcador(c) {
    if (!c.el) return;
    c.punto.style.background = colorLluvia(c.lluvia);
    c.el.title = c.lluvia == null ? c.nombre : `${c.nombre}: ${c.lluvia} mm de lluvia al año, ${c.temp} °C de promedio`;
  }

  const globo = Globe({ rendererConfig: { antialias: true, logarithmicDepthBuffer: true } })(el)
    .globeImageUrl(BASE)
    .bumpImageUrl(RELIEVE)
    .backgroundColor("rgba(0,0,0,0)")
    .atmosphereColor("#7ec8ff").atmosphereAltitude(0.18)
    .htmlElementsData(visibles()).htmlLat("lat").htmlLng("lng").htmlAltitude(0).htmlElement(marcador).htmlTransitionDuration(0)
    .htmlElementVisibilityModifier((e, visible) => { e.dataset.atras = visible ? "" : "1"; })
    .ringsData([]).ringColor(() => (t) => `rgba(255,255,255,${1 - t})`).ringMaxRadius(0.6).ringPropagationSpeed(0.6).ringRepeatPeriod(1400)
    .onGlobeClick(({ lat, lng }) => elegir(lat, lng))
    .onZoom(() => ordenarNombres());
  const ajustar = () => { globo.width(el.clientWidth).height(el.clientHeight); ordenarNombres(); };
  new ResizeObserver(ajustar).observe(el);
  $("globo-estado")?.remove();
  try { globo.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); } catch {}
  const ctl = globo.controls();
  ctl.autoRotate = false; ctl.autoRotateSpeed = 0.6; ctl.minDistance = 100.6; ctl.zoomSpeed = 0.8;

  // Que los nombres no se pisen: se recorre por importancia y se oculta el que choca con uno ya puesto
  let pendiente = false;
  function ordenarNombres() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      const puestos = [];
      visibles().forEach((c) => {
        if (!c.el) return;
        const p = globo.getScreenCoords(c.lat, c.lng, 0);
        const ancho = c.nombre.length * 7 + 14, alto = 18;
        const caja = { x1: p.x - 6, y1: p.y - alto / 2, x2: p.x + ancho, y2: p.y + alto / 2 };
        const choca = c.el.dataset.atras === "1" || puestos.some((o) => caja.x1 < o.x2 && caja.x2 > o.x1 && caja.y1 < o.y2 && caja.y2 > o.y1);
        c.el.classList.toggle("sin-nombre", choca);
        if (!choca) puestos.push(caja);
      });
    });
  }
  ctl.addEventListener("change", ordenarNombres);

  // Capas
  const nota = $("capa-nota");
  function ponerCapa(k) {
    const c = CAPAS[k];
    document.querySelectorAll("[data-capa]").forEach((o) => o.setAttribute("aria-pressed", String(o.dataset.capa === k)));
    globo.globeImageUrl(c.base || BASE).globeTileEngineMaxLevel(c.max).globeTileEngineUrl(c.url);
    nota.textContent = c.nota;
  }
  document.querySelectorAll("[data-capa]").forEach((b) => b.addEventListener("click", () => ponerCapa(b.dataset.capa)));

  // Zoom con botones
  const zoom = (f) => { const p = globo.pointOfView(); globo.pointOfView({ lat: p.lat, lng: p.lng, altitude: Math.max(0.006, Math.min(4, p.altitude * f)) }, 500); };
  $("z-mas").addEventListener("click", () => zoom(0.5));
  $("z-menos").addEventListener("click", () => zoom(2));

  // Giro
  const giro = $("btn-giro");
  const pintaGiro = () => giro.setAttribute("aria-pressed", String(ctl.autoRotate));
  giro.addEventListener("click", () => { ctl.autoRotate = !ctl.autoRotate; pintaGiro(); });
  pintaGiro();

  // Clima de un lugar (backend → NASA POWER)
  let n = 0;
  async function elegir(lat, lng, nombreFijo) {
    const yo = ++n;
    lat = Math.round(lat * 100) / 100; lng = Math.round(lng * 100) / 100;
    globo.ringsData([{ lat, lng }]);
    $("cl-titulo").textContent = nombreFijo || "Buscando…";
    $("cl-sub").textContent = `${lat}°, ${lng}°`;
    ["cl-datos", "cl-meses", "cl-fuente"].forEach((i) => $(i).classList.add("is-hidden"));
    try {
      const [c, rl] = await Promise.all([
        clima(lat, lng),
        nombreFijo ? null : fetch(`/api/lugar?lat=${lat}&lon=${lng}`).catch(() => null),
      ]);
      if (yo !== n) return;
      let nombre = nombreFijo || "Lugar elegido";
      try { if (rl && rl.ok) nombre = (await rl.json()).nombre || nombre; } catch {}
      $("cl-titulo").textContent = nombre;
      $("cl-lluvia").textContent = `${c.escenarios.normal.lluvia_anual_mm} mm`;
      $("cl-alt").textContent = `${c.altitud_m} m`;
      const max = Math.max(...c.meses.map((m) => m.lluvia_mm), 1);
      const caja = $("cl-meses"); caja.replaceChildren();
      c.meses.forEach((m) => {
        const f = document.createElement("div"); f.className = "cl-mes";
        const a = document.createElement("span"); a.textContent = m.mes;
        const bar = document.createElement("span"); bar.className = "cl-barra"; bar.title = `${m.lluvia_mm} mm de lluvia`;
        const s = document.createElement("span"); s.style.width = Math.round((m.lluvia_mm / max) * 100) + "%"; bar.append(s);
        const t = document.createElement("span"); t.className = "cl-temp"; t.textContent = `${Math.round(m.tmin_media)}–${Math.round(m.tmax_media)} °C`;
        f.append(a, bar, t); caja.append(f);
      });
      $("cl-fuente").textContent = `Barras: lluvia por mes. Temperatura mínima–máxima. Fuente: ${c.fuente}.`;
      ["cl-datos", "cl-meses", "cl-fuente"].forEach((i) => $(i).classList.remove("is-hidden"));
    } catch {
      if (yo !== n) return;
      $("cl-titulo").textContent = "Sin datos aquí";
      $("cl-sub").textContent = "La NASA no respondió para este punto (por ejemplo en el mar). Prueba en tierra firme.";
    }
  }

  // Lista de lugares con su lluvia y temperatura
  const lista = $("ciudades-lista");
  function pintarLista() {
    lista.replaceChildren();
    visibles().filter((c) => c.lluvia != null).sort((a, b) => b.lluvia - a.lluvia).forEach((c) => {
      const li = document.createElement("li");
      const b = document.createElement("button"); b.type = "button"; b.className = "ciudad";
      const dot = document.createElement("span"); dot.className = "ciudad-dot"; dot.style.background = colorLluvia(c.lluvia);
      const nm = document.createElement("span"); nm.textContent = c.nombre;
      const v = document.createElement("b"); v.textContent = `${c.lluvia} mm · ${c.temp} °C`;
      b.append(dot, nm, v);
      b.addEventListener("click", () => { globo.pointOfView({ lat: c.lat, lng: c.lng, altitude: 0.12 }, 1000); elegir(c.lat, c.lng, c.nombre); });
      li.append(b); lista.append(li);
    });
  }
  function cambiarVista(v, volar) {
    vista = v;
    document.querySelectorAll("[data-vista]").forEach((o) => { const on = o.dataset.vista === v; o.classList.toggle("is-selected", on); o.setAttribute("aria-pressed", String(on)); });
    $("lista-titulo").textContent = v === "scz" ? "Pueblos de Santa Cruz" : "Ciudades de Bolivia";
    globo.htmlElementsData([...visibles()]);
    pintarLista(); ordenarNombres();
    if (volar) globo.pointOfView(v === "scz" ? SCZ : BOLIVIA, 1400);
  }
  document.querySelectorAll("[data-vista]").forEach((b) => b.addEventListener("click", () => cambiarVista(b.dataset.vista, true)));
  $("btn-scz").addEventListener("click", () => { cambiarVista("scz", true); elegir(-17.78, -63.18, "Santa Cruz de la Sierra"); });
  $("btn-bolivia").addEventListener("click", () => { cambiarVista("bolivia", true); elegir(-17.78, -63.18, "Santa Cruz de la Sierra"); });

  async function cargarLugares() {
    const cola = [...TODOS];
    const trabajador = async () => {
      while (cola.length) {
        const c = cola.shift();
        try {
          const j = await clima(c.lat, c.lng);
          c.lluvia = j.escenarios.normal.lluvia_anual_mm;
          c.temp = Math.round(j.meses.reduce((a, m) => a + (m.tmax_media + m.tmin_media) / 2, 0) / j.meses.length * 10) / 10;
          if (c.espejo) { c.espejo.lluvia = c.lluvia; c.espejo.temp = c.temp; pintarMarcador(c.espejo); }
          pintarMarcador(c); pintarLista();
        } catch {}
      }
    };
    await Promise.all([trabajador(), trabajador(), trabajador()]);
    if (!lista.children.length) { const p = document.createElement("li"); p.textContent = "No se pudieron cargar los datos de los lugares."; lista.append(p); }
  }

  ponerCapa("detalle");
  globo.pointOfView(SCZ, 0);
  ajustar();
  cambiarVista("scz", false);
  elegir(-17.78, -63.18, "Santa Cruz de la Sierra");
  cargarLugares();
  setTimeout(ordenarNombres, 300);
})();
