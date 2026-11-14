// Parallax con el mouse en cada opción
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.querySelectorAll(".mock-stage").forEach((stage) => {
    const scene = stage.querySelector(".iso-scene");
    stage.addEventListener("mousemove", (e) => {
      const r = stage.getBoundingClientRect();
      scene.style.setProperty("--rz", `${-35 + ((e.clientX - r.left) / r.width - 0.5) * 30}deg`);
      scene.style.setProperty("--rx", `${58 - ((e.clientY - r.top) / r.height - 0.5) * 16}deg`);
    });
    stage.addEventListener("mouseleave", () => {
      scene.style.removeProperty("--rz");
      scene.style.removeProperty("--rx");
    });
  });
}
