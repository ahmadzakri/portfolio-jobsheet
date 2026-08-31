/* ============================================================
   KING OF JOBSHEETS · 3D ENGINE
   Tilt ikut tetikus + parallax berlapis untuk hero.
   ============================================================ */
(() => {
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || calm) return;

  /* ---------- TILT ---------- */
  const TILT = [
    { sel: ".fighter-card",   max: 12, lift: 30, depth: 1500 },
    { sel: ".jobsheet",       max: 10, lift: 20, depth: 1200 },
    { sel: ".progress-module",max: 9,  lift: 16, depth: 1400 },
    { sel: ".player-portrait",max: 13, lift: 24, depth: 1400 },
    { sel: ".mission-links a",max: 7,  lift: 10, depth: 1000 },
  ];
  const SELECTOR = TILT.map((t) => t.sel).join(",");
  const configFor = (el) => TILT.find((t) => el.matches(t.sel));

  let active = null;

  const release = (el) => {
    if (!el) return;
    el.classList.remove("is-tilting");
    el.style.transform = "";
    el.style.removeProperty("--gx");
    el.style.removeProperty("--gy");
  };

  document.addEventListener("pointermove", (event) => {
    const el = event.target.closest?.(SELECTOR) || null;
    if (el !== active) {
      release(active);
      active = el;
      if (el) el.classList.add("is-tilting");
    }
    if (!el) return;
    const cfg = configFor(el);
    if (!cfg) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform =
      `perspective(${cfg.depth}px) ` +
      `rotateX(${(-py * cfg.max).toFixed(2)}deg) ` +
      `rotateY(${(px * cfg.max).toFixed(2)}deg) ` +
      `translate3d(0, ${-cfg.lift}px, 0)`;
    el.style.setProperty("--gx", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${((py + 0.5) * 100).toFixed(1)}%`);
  }, { passive: true });

  document.addEventListener("pointerdown", () => {
    if (active) active.style.transform += " scale(.985)";
  }, { passive: true });

  window.addEventListener("blur", () => { release(active); active = null; });
  document.documentElement.addEventListener("mouseleave", () => { release(active); active = null; });

  /* ---------- PARALLAX HERO ---------- */
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const layers = [
    { el: hero.querySelector(".arena-stars"), depth: 16 },
    { el: hero.querySelector(".arena-grid"),  depth: 26 },
    { el: hero.querySelector(".hero-rings"),  depth: 40 },
    { el: hero.querySelector(".hero-copy"),   depth: -18, rotate: 5 },
  ].filter((layer) => layer.el);

  let targetX = 0, targetY = 0, curX = 0, curY = 0, running = false;

  const frame = () => {
    curX += (targetX - curX) * 0.07;
    curY += (targetY - curY) * 0.07;
    layers.forEach(({ el, depth, rotate }) => {
      el.style.translate = `${(curX * depth).toFixed(2)}px ${(curY * depth).toFixed(2)}px`;
      if (rotate) {
        el.style.transform =
          `rotateX(${(-curY * rotate).toFixed(2)}deg) rotateY(${(curX * rotate).toFixed(2)}deg)`;
      }
    });
    if (Math.abs(targetX - curX) > 0.001 || Math.abs(targetY - curY) > 0.001) {
      requestAnimationFrame(frame);
    } else {
      running = false;
    }
  };

  window.addEventListener("pointermove", (event) => {
    targetX = (event.clientX / innerWidth) * 2 - 1;
    targetY = (event.clientY / innerHeight) * 2 - 1;
    if (!running) { running = true; requestAnimationFrame(frame); }
  }, { passive: true });
})();
