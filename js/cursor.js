(() => {
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  if (!dot || !ring) return;

  // Don’t run on touch devices
  const isCoarse = window.matchMedia("(pointer: coarse)").matches;
  if (isCoarse) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  // ring lags behind
  let ringX = mouseX;
  let ringY = mouseY;

  // smoothness: smaller = more floaty lag
  const ease = 0.14;

  function render() {
    ringX += (mouseX - ringX) * ease;
    ringY += (mouseY - ringY) * ease;

    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;

    requestAnimationFrame(render);
  }

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // click feedback
  window.addEventListener("mousedown", () => document.body.classList.add("cursor--down"));
  window.addEventListener("mouseup", () => document.body.classList.remove("cursor--down"));

  // hover targets: links, buttons, anything clickable + your nav items
  const hoverSelector = `
    a, button, [role="button"], input, textarea, select,
    .btn, .nav-link, .menu a, .social a, .chip, .card
  `;

  function setHover(on) {
    document.body.classList.toggle("cursor--hover", on);
  }

  document.addEventListener(
    "mouseover",
    (e) => {
      if (e.target && e.target.closest(hoverSelector)) setHover(true);
    },
    true
  );

  document.addEventListener(
    "mouseout",
    (e) => {
      // If moving to another hoverable element, keep it on
      const to = e.relatedTarget;
      if (to && to.closest && to.closest(hoverSelector)) return;
      setHover(false);
    },
    true
  );

  // start
  render();
})();
