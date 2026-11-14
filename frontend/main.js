const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduce) {
  // Escena isométrica: parallax con el mouse
  const stage = document.getElementById("hero-stage");
  const scene = document.getElementById("iso-scene");
  if (stage && scene) {
    stage.addEventListener("mousemove", (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      scene.style.setProperty("--rz", `${-35 + x * 30}deg`);
      scene.style.setProperty("--rx", `${58 - y * 16}deg`);
    });
    stage.addEventListener("mouseleave", () => {
      scene.style.removeProperty("--rz");
      scene.style.removeProperty("--rx");
    });
  }

  // Tarjetas: inclinación 3D (hasta 10°)
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateX(${(-y * 20).toFixed(1)}deg) rotateY(${(x * 20).toFixed(1)}deg)`;
    });
    card.addEventListener("mouseleave", () => (card.style.transform = ""));
  });
}
