// Idiomas de Chacra: español (original) e inglés.
// El español está escrito en el HTML y en el JavaScript; este archivo tiene su traducción.
// - Textos fijos: traducirPagina() recorre la pantalla y cambia cada texto que esté en EN.
// - Textos que arma el JavaScript: se piden con t("texto en español", { variables }).
// - Textos que redacta el backend: llegan traducidos al pedir con api(url) (agrega ?idioma=en).
// Va en el <head> para que la pantalla no parpadee en español antes de traducirse.
const IDIOMA = (() => {
  try { return localStorage.getItem("chacra-idioma") === "en" ? "en" : "es"; } catch { return "es"; }
})();
document.documentElement.lang = IDIOMA;
if (IDIOMA === "en") {
  const oculto = document.createElement("style");
  oculto.id = "i18n-oculto";
  oculto.textContent = "body { visibility: hidden; }";
  document.head.append(oculto);
  document.addEventListener("DOMContentLoaded", () => oculto.remove()); // por si traducirPagina() no llega a correr
}

const EN = {
  // ---------- Cabecera y pie ----------
  "Chacra, inicio": "Chacra, home",
  "Navegación principal": "Main navigation",
  "Inicio": "Home",
  "Mi chacra": "My farm",
  "Resultado": "Result",
  "Mis terrenos": "My plots",
  "Cambiar idioma": "Change language",
  "Con datos satelitales de NASA. Esta herramienta apoya, no reemplaza a un técnico de tu zona.": "With NASA satellite data. This tool supports, and does not replace, a local agronomist.",
  "Ver versión móvil": "See mobile version",
  "Tierra 3D": "3D Earth",
  "Inicio · Chacra": "Home · Chacra",
  "Mi chacra · Chacra": "My farm · Chacra",
  "Resultado · Chacra": "Result · Chacra",
  "Mis terrenos · Chacra": "My plots · Chacra",

  // ---------- Inicio ----------
  "Paisaje de chacra con colinas verdes y sol": "Farm landscape with green hills and sun",
  "Rueda del año": "Year wheel",
  "Mira cómo le irá a tu chacra antes de sembrar.": "See how your farm will do before you sow.",
  "Compara varias formas de rotar tus cultivos y entiende por qué cada una te conviene o no. Sin escribir, en menos de un minuto.": "Compare several ways to rotate your crops and understand why each one suits you or not. No typing, in under a minute.",
  "Empezar": "Start",
  "Ver un ejemplo": "See an example",
  "Funciona con datos de NASA POWER y MODIS.": "Runs on NASA POWER and MODIS data.",
  "Así funciona": "How it works",
  "Cultivos que conocemos": "Crops we know",
  "Chacra compara rotaciones con los cultivos más comunes de los valles y llanos de Bolivia.": "Chacra compares rotations with the most common crops of Bolivia's valleys and lowlands.",
  "Lo que afecta a las chacras de Bolivia": "What affects Bolivia's farms",
  "Estos problemas son reales y se repiten cada año. Por eso comparamos rotaciones con datos satelitales.": "These problems are real and come back every year. That is why we compare rotations with satellite data.",
  "Incendios en la Chiquitania": "Fires in the Chiquitania",
  "El fuego destruye cultivos, pastos y monte.": "Fire destroys crops, pasture and forest.",
  "Quemas agrícolas": "Agricultural burning",
  "Vistas desde el satélite MODIS de la NASA.": "Seen from NASA's MODIS satellite.",
  "Bosque amenazado": "Threatened forest",
  "Se pierde monte y se seca el suelo.": "Forest is lost and the soil dries out.",
  "Inundaciones": "Floods",
  "Las lluvias fuertes cortan caminos y anegan parcelas.": "Heavy rains cut off roads and flood plots.",
  "Bosque chiquitano amenazado": "Threatened Chiquitano forest",
  "Camino inundado en Bolivia": "Flooded road in Bolivia",
  "Familia campesina boliviana sembrando papa con una yunta de bueyes": "Bolivian farming family sowing potatoes with a team of oxen",
  "Gran incendio forestal en San José de Chiquitos, Santa Cruz": "Large forest fire in San José de Chiquitos, Santa Cruz",
  "Imagen satelital de la NASA con quemas agrícolas en Santa Cruz": "NASA satellite image showing agricultural burning in Santa Cruz",
  "Paso 1": "Step 1",
  "Paso 2": "Step 2",
  "Paso 3": "Step 3",
  "Dices dónde está tu chacra": "You say where your farm is",
  "Con el GPS del celular, eligiendo tu comunidad o tocando el mapa.": "With your phone's GPS, by choosing your community or by tapping the map.",
  "Eliges qué siembras y qué te importa": "You choose what you grow and what matters to you",
  "Tocas el cultivo de hoy y hasta 2 prioridades, como ahorrar agua o cuidar la tierra.": "You tap today's crop and up to 2 priorities, such as saving water or caring for the soil.",
  "Ves 3 opciones comparadas": "You see 3 options compared",
  "Una recomendada, una alternativa y lo que haces hoy, con la rueda del año mes a mes.": "One recommended, one alternative and what you do today, with the year wheel month by month.",

  // ---------- Mi chacra ----------
  "Cuéntanos de tu chacra": "Tell us about your farm",
  "Tres pasos, solo tocando. Puedes volver a cambiar lo que quieras.": "Three steps, just tapping. You can change anything again later.",
  "¿Dónde está tu chacra?": "Where is your farm?",
  "Busca tu comunidad o municipio": "Search for your community or municipality",
  "Por ejemplo: Tarabuco": "For example: Tarabuco",
  "Buscar": "Search",
  "Mapa: toca el lugar donde está tu chacra": "Map: tap the place where your farm is",
  "Toca el mapa para marcar tu chacra, o usa tu ubicación actual.": "Tap the map to mark your farm, or use your current location.",
  "Estoy aquí": "I am here",
  "Usar la ubicación actual": "Use my current location",
  "Todavía no elegiste la ubicación.": "You have not chosen the location yet.",
  "¿Qué siembras hoy?": "What do you grow today?",
  "Toca tu cultivo principal.": "Tap your main crop.",
  "Por ahora la herramienta conoce estos 6 cultivos.": "For now the tool knows these 6 crops.",
  "¿Qué te importa más?": "What matters most to you?",
  "Elige hasta 2.": "Choose up to 2.",
  "0 de 2 elegidas.": "0 of 2 chosen.",
  "{n} de 2 elegidas.": "{n} of 2 chosen.",
  "{n} de {max} elegidas": "{n} of {max} chosen",
  "Tus límites": "Your limits",
  "¿Cuánta agua tienes?": "How much water do you have?",
  "Poca": "Little",
  "Media": "Some",
  "Buena": "Plenty",
  "¿Qué maquinaria tienes?": "What machinery do you have?",
  "Ninguna": "None",
  "Básica": "Basic",
  "Completa": "Full",
  "Guarda este terreno": "Save this plot",
  "Opcional. Si tienes varias parcelas, guarda cada una con su nombre y míralas juntas en Mis terrenos.": "Optional. If you have several plots, save each one with its name and see them together in My plots.",
  "Nombre del terreno": "Plot name",
  "Por ejemplo: La de arriba": "For example: The upper one",
  "Guardar en Mis terrenos": "Save to My plots",
  "Guarda los cambios del terreno": "Save the changes to the plot",
  "Guardar cambios": "Save changes",
  "Tu chacra": "Your farm",
  "Ubicación": "Location",
  "Hoy siembras": "Today you grow",
  "Prioridad 1": "Priority 1",
  "Prioridad 2": "Priority 2",
  "Sin elegir": "Not chosen",
  "Ver mis opciones": "See my options",
  "Con datos satelitales de NASA. Apoya, no reemplaza a un técnico.": "With NASA satellite data. It supports, and does not replace, an agronomist.",
  "Este navegador no permite usar la ubicación. Toca el mapa o busca tu comunidad.": "This browser does not allow using your location. Tap the map or search for your community.",
  "Buscando tu ubicación…": "Finding your location…",
  "No se pudo obtener tu ubicación. Toca el mapa o busca tu comunidad.": "Your location could not be found. Tap the map or search for your community.",
  "Ubicación elegida: {lugar}": "Chosen location: {lugar}",
  "Buscando…": "Searching…",
  "No se encontró ese lugar. Prueba con el municipio o toca el mapa.": "That place was not found. Try the municipality or tap the map.",
  "No se pudo buscar. Toca el mapa para marcar tu chacra.": "The search failed. Tap the map to mark your farm.",
  "Antes de seguir: {faltan}.": "Before you continue: {faltan}.",
  "marca dónde está tu chacra": "mark where your farm is",
  "elige qué siembras hoy": "choose what you grow today",
  " y ": " and ",
  "Para guardar el terreno: {faltan}.": "To save the plot: {faltan}.",
  "marca dónde está": "mark where it is",
  "ponle un nombre": "give it a name",
  "Poca agua": "Little water",
  "Agua media": "Some water",
  "Buena agua": "Plenty of water",
  "sin maquinaria": "no machinery",
  "maquinaria básica": "basic machinery",
  "maquinaria completa": "full machinery",

  // ---------- Cultivos y prioridades ----------
  "Maíz": "Maize",
  "Papa": "Potato",
  "Trigo": "Wheat",
  "Haba": "Faba bean",
  "Cebada": "Barley",
  "Arveja": "Pea",
  "Ahorrar agua": "Save water",
  "Cuidar la tierra": "Care for the soil",
  "Ganar más": "Earn more",
  "Menos erosión": "Less erosion",
  "Alimento para animales": "Feed for animals",
  "Devolver fuerza al suelo": "Restore soil strength",

  // ---------- Meses ----------
  "Ene": "Jan", "Feb": "Feb", "Mar": "Mar", "Abr": "Apr", "May": "May", "Jun": "Jun",
  "Jul": "Jul", "Ago": "Aug", "Sep": "Sep", "Oct": "Oct", "Nov": "Nov", "Dic": "Dec",
  "enero": "January", "febrero": "February", "marzo": "March", "abril": "April", "mayo": "May", "junio": "June",
  "julio": "July", "agosto": "August", "septiembre": "September", "octubre": "October", "noviembre": "November", "diciembre": "December",

  // ---------- Resultado ----------
  "Tus 3 opciones": "Your 3 options",
  "Tus opciones": "Your options",
  "Tus 3 opciones para {lugar}": "Your 3 options for {lugar}",
  "tu chacra": "your farm",
  "mi chacra": "my farm",
  "Con datos reales de la NASA": "With real NASA data",
  "Escuchar": "Listen",
  "Enviar por WhatsApp": "Send by WhatsApp",
  "Cambiar mis respuestas": "Change my answers",
  "Consultando el clima de tu zona en la NASA…": "Getting your area's climate from NASA…",
  "Primero cuéntanos de tu chacra": "First tell us about your farm",
  "Necesitamos saber dónde está y qué siembras para comparar tus opciones.": "We need to know where it is and what you grow to compare your options.",
  "Bien": "Good",
  "Ojo": "Caution",
  "Evitar": "Avoid",
  "Mal": "Poor",
  "Sin dato": "No data",
  "Sin cultivo": "No crop",
  "sin cultivo": "no crop",
  "Agua": "Water",
  "Suelo": "Soil",
  "Heladas": "Frost",
  "Viendo esta opción": "Viewing this option",
  "Ver esta opción": "View this option",
  "Tu año, mes a mes": "Your year, month by month",
  "Campaña": "Season",
  "Anillo de afuera:": "Outer ring:",
  "si el suelo tiene cultivo.": "whether the soil has a crop.",
  "Anillo de adentro:": "Inner ring:",
  "agua y heladas mientras el cultivo crece.": "water and frost while the crop grows.",
  "Leyenda": "Legend",
  "En el anillo de afuera, «Ojo» es suelo sin cultivo en época seca y «Evitar» es suelo sin cultivo en meses de lluvia fuerte, cuando más se lava la tierra.": "In the outer ring, “Caution” is soil without a crop in the dry season and “Avoid” is soil without a crop in months of heavy rain, when the soil washes away the most.",
  "El plan, campaña por campaña": "The plan, season by season",
  "Cultivo": "Crop",
  "Siembra": "Sowing",
  "Cosecha": "Harvest",
  "Lluvia que recibe": "Rain it gets",
  "Agua que necesita": "Water it needs",
  "campaña {n}": "season {n}",
  "Campaña {n}: {cultivo}": "Season {n}: {cultivo}",
  "Rueda del año de {cultivo}, campaña {n}. Suelo con cultivo: {fuera}. Agua y heladas: {dentro}.": "Year wheel for {cultivo}, season {n}. Soil under crop: {fuera}. Water and frost: {dentro}.",
  "¿Y si llueve menos?": "What if it rains less?",
  "Normal": "Normal",
  "Menos": "Less",
  "Mucho menos": "Much less",
  "Lluvia normal: {mm} mm al año ({descripcion}, {periodo}).": "Normal rain: {mm} mm a year ({descripcion}, {periodo}).",
  "En la opción recomendada, Agua se mantiene en {ahora}.": "In the recommended option, Water stays at {ahora}.",
  "En la opción recomendada, Agua pasa de {antes} a {ahora}.": "In the recommended option, Water goes from {antes} to {ahora}.",
  "{descripcion} ({campanias}): {mm} mm al año frente a {normal} de lo normal. {cambio}": "{descripcion} ({campanias}): {mm} mm a year versus the normal {normal}. {cambio}",
  "¿Por qué esta opción?": "Why this option?",
  "Sobre «{titulo}»": "About “{titulo}”",
  "Confianza en la recomendación": "Confidence in the recommendation",
  "Baja": "Low",
  "baja": "low",
  "media": "medium",
  "Confianza {nivel}, {barras} de 3": "Confidence {nivel}, {barras} of 3",
  "Por qué se sugiere": "Why it is suggested",
  "Qué datos la respaldan": "What data supports it",
  "Beneficios": "Benefits",
  "Qué nos falta saber": "What we still do not know",
  "Riesgos: conversa con un técnico": "Risks: talk to an agronomist",
  "Cómo se decide cada color": "How each color is decided",
  "Agua:": "Water:",
  "lluvia del ciclo (más tu riego) frente a lo que necesita el cultivo. 90 % o más, Bien; de 60 a 90 %, Ojo; menos, Evitar.": "rain during the cycle (plus your irrigation) against what the crop needs. 90% or more, Good; 60 to 90%, Caution; less, Avoid.",
  "Heladas:": "Frost:",
  "días bajo cero durante el ciclo. Cultivo sensible: desde 1 día, Ojo; más de 5, Evitar. Cultivo tolerante: desde 5 y más de 15.": "days below zero during the cycle. Sensitive crop: from 1 day, Caution; more than 5, Avoid. Tolerant crop: from 5 and more than 15.",
  "Suelo:": "Soil:",
  "variedad de familias, si hay leguminosa, rastrojo que queda y meses con cultivo.": "variety of families, whether there is a legume, residue left behind and months under crop.",
  "Son reglas simples; falta que un técnico las ajuste a tu zona.": "These are simple rules; an agronomist still has to adjust them to your area.",
  "{fuente}: {periodo}, {usadas} observaciones usadas y {descartadas} descartadas por nubes.": "{fuente}: {periodo}, {usadas} observations used and {descartadas} discarded because of clouds.",
  "El satélite dice, tú dices": "The satellite says, you say",
  "Pidiendo a la NASA el verdor de tu zona. Puede tardar varios minutos; lo demás ya está listo.": "Asking NASA for your area's greenness. It can take several minutes; everything else is ready.",
  "El servicio de verdor de la NASA no respondió. Las opciones no dependen de él; puedes recargar la página para reintentar.": "NASA's greenness service did not respond. The options do not depend on it; you can reload the page to try again.",
  "¿Coincide con lo que ves en tu chacra? Tu respuesta ajusta el cálculo.": "Does it match what you see on your farm? Your answer adjusts the calculation.",
  "Sí, es así": "Yes, that is right",
  "Aquí hiela más": "There is more frost here",
  "Aquí llueve menos": "It rains less here",
  "Tomamos tu observación: contamos más heladas en los meses fríos y recalculamos las opciones.": "We took your observation: we count more frost in the cold months and recalculate the options.",
  "Tomamos tu observación: te mostramos las opciones con el escenario de menos lluvia.": "We took your observation: we show you the options under the less-rain scenario.",
  "Los números de tu zona, mes a mes": "Your area's numbers, month by month",
  "Dato": "Data",
  "Lluvia": "Rain",
  "mm en el mes": "mm in the month",
  "Días con helada": "Frost days",
  "bajo 0 °C": "below 0 °C",
  "Temp. mínima": "Min. temp.",
  "Temp. máxima": "Max. temp.",
  "promedio, °C": "average, °C",
  "Verdor": "Greenness",
  "NDVI, de 0 a 1": "NDVI, from 0 to 1",
  "Clima: {fuente}, {periodo}.": "Climate: {fuente}, {periodo}.",
  " Verdor: {fuente}.": " Greenness: {fuente}.",
  "Revísalo con alguien de tu zona": "Review it with someone from your area",
  "Esto es un apoyo para conversar con un técnico o con otros agricultores, no una receta.": "This is a support for talking with an agronomist or other farmers, not a recipe.",
  "Ver mis terrenos": "See my plots",
  "No se pudo calcular.": "It could not be calculated.",
  "{error} Vuelve a intentarlo o cambia tus respuestas.": "{error} Try again or change your answers.",
  "Chacra: para {lugar}, la opción recomendada es {titulo}. {resumen} Es un apoyo; hay que revisarlo con un técnico.": "Chacra: for {lugar}, the recommended option is {titulo}. {resumen} It is a support; it has to be reviewed with an agronomist.",

  // ---------- Mis terrenos ----------
  "Cada terreno tiene su propia ubicación, cultivo y recomendación.": "Each plot has its own location, crop and recommendation.",
  "Agregar terreno": "Add plot",
  "Buscando tus terrenos…": "Looking for your plots…",
  "Todavía no guardaste ningún terreno": "You have not saved any plot yet",
  "Marca dónde está, elige qué siembras y guárdalo con un nombre. Puedes guardar una parcela por cada cultivo.": "Mark where it is, choose what you grow and save it with a name. You can save one plot for each crop.",
  "Agregar mi primer terreno": "Add my first plot",
  "Mi año completo": "My whole year",
  "Crece": "Growing",
  "Suelo libre": "Bare soil",
  "Calendario anual por terreno": "Yearly calendar by plot",
  "Muestra el cultivo de hoy de cada terreno, con el mes de siembra que mejor aprovecha la lluvia y evita heladas según el clima de la NASA. La carga de trabajo es una regla simple: cuenta las siembras y cosechas de cada mes.": "It shows today's crop on each plot, with the sowing month that makes the best use of rain and avoids frost according to NASA climate data. The workload is a simple rule: it counts the sowings and harvests of each month.",
  "Se juntan épocas de mucho trabajo": "Busy periods overlap",
  "Calculando con el clima de la NASA…": "Calculating with NASA climate data…",
  "{lugar} · hoy siembras {cultivo}": "{lugar} · today you grow {cultivo}",
  "Sugerida: ": "Suggested: ",
  "{nombre}: {estado}": "{nombre}: {estado}",
  "Ver opciones": "See options",
  "Editar": "Edit",
  "Borrar": "Delete",
  "¿Borrar el terreno «{nombre}»? No se puede deshacer.": "Delete the plot “{nombre}”? This cannot be undone.",
  "{error} Recarga la página para reintentar.": "{error} Reload the page to try again.",
  "{error} Revisa que el servidor esté encendido y recarga la página.": "{error} Check that the server is running and reload the page.",
  "No se pudo conectar con el servidor.": "Could not connect to the server.",
  "Carga de trabajo": "Workload",
  "Mucho": "High",
  "Medio": "Medium",
  "Bajo": "Low",
  "siembras": "you sow",
  "cosechas": "you harvest",
  "En {mes} {tareas}.": "In {mes} {tareas}.",
  " Eso pide más gente y más herramientas al mismo tiempo.": " That calls for more people and more tools at the same time.",
  "Una idea: escalonar las siembras": "An idea: stagger the sowings",
  "Sembrar un terreno unas semanas antes que el otro reparte el trabajo y también el riesgo: si una helada daña uno, el otro puede salvarse. Es una idea general; confírmala con un técnico.": "Sowing one plot a few weeks before the other spreads out the work and also the risk: if a frost damages one, the other may be spared. It is a general idea; confirm it with an agronomist.",
  "Agrega otro terreno para comparar": "Add another plot to compare",
  "Con dos o más terrenos, aquí verás si se juntan siembras o cosechas en el mismo mes.": "With two or more plots, here you will see whether sowings or harvests fall in the same month.",
  "El trabajo queda repartido": "The work is spread out",
  "Ningún mes junta siembras o cosechas de dos terrenos. Es un cálculo general; confírmalo con un técnico.": "No month combines sowings or harvests from two plots. It is a general calculation; confirm it with an agronomist.",
};

// Texto en el idioma activo. La clave es el texto en español; {nombre} se reemplaza con vars.nombre.
function t(es, vars) {
  let texto = IDIOMA === "en" && Object.hasOwn(EN, es) ? EN[es] : es;
  if (vars) texto = texto.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
  return texto;
}

// Agrega el idioma a un pedido al backend, que redacta sus textos en ese idioma.
function api(url) {
  return IDIOMA === "en" ? url + (url.includes("?") ? "&" : "?") + "idioma=en" : url;
}

// Traduce los textos fijos de la pantalla. Se llama una vez, al inicio de app.js.
function traducirPagina() {
  if (IDIOMA !== "en") return;
  const traducir = (texto) => {
    const limpio = texto.replace(/\s+/g, " ").trim();
    return limpio && Object.hasOwn(EN, limpio) ? texto.replace(texto.trim(), EN[limpio]) : null;
  };
  const nodos = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement.closest("script, style") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = nodos.nextNode(); n; n = nodos.nextNode()) {
    const nuevo = traducir(n.nodeValue);
    if (nuevo != null) n.nodeValue = nuevo;
  }
  for (const atributo of ["aria-label", "placeholder", "title", "alt"]) {
    document.querySelectorAll(`[${atributo}]`).forEach((el) => {
      const nuevo = traducir(el.getAttribute(atributo));
      if (nuevo != null) el.setAttribute(atributo, nuevo);
    });
  }
  document.title = t(document.title);
  document.getElementById("i18n-oculto")?.remove();
}

// Cambia entre español e inglés y recarga. Una pantalla puede definir window.alCambiarIdioma
// para devolver la dirección con la que conserva lo que la persona ya respondió.
function cambiarIdioma() {
  try { localStorage.setItem("chacra-idioma", IDIOMA === "en" ? "es" : "en"); } catch { return; }
  const destino = typeof window.alCambiarIdioma === "function" ? window.alCambiarIdioma() : null;
  if (destino) location.href = destino;
  else location.reload();
}
