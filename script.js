function esc(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function initIntro() {
  const intro = document.querySelector("#intro");
  if (!intro) return;
  const seconds = document.querySelector("#introSeconds");
  const skip = document.querySelector("#skipIntro");
  let remaining = 5;
  const remove = () => {
    intro.classList.add("is-leaving");
    window.setTimeout(() => intro.remove(), 520);
  };
  const countdown = window.setInterval(() => {
    remaining = Math.max(0, remaining - 1);
    if (seconds) seconds.textContent = String(remaining);
  }, 1000);
  const finish = window.setTimeout(remove, 5000);
  skip?.addEventListener("click", () => {
    window.clearInterval(countdown);
    window.clearTimeout(finish);
    remove();
  });
}

function initClock() {
  const clock = document.querySelector("#liveClock");
  if (!clock) return;
  const format = new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  });
  const update = () => { clock.textContent = format.format(new Date()).toUpperCase(); };
  update();
  window.setInterval(update, 1000);
}

function initCursor() {
  const cursor = document.querySelector(".arena-cursor-main");
  const red = document.querySelector(".trail-red");
  const blue = document.querySelector(".trail-blue");
  if (!cursor || !red || !blue || !matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  let targetX = innerWidth / 2, targetY = innerHeight / 2;
  let x = targetX, y = targetY, redX = x, redY = y, blueX = x, blueY = y;
  document.documentElement.classList.add("arena-cursor-enabled");
  window.addEventListener("pointermove", (event) => {
    targetX = event.clientX; targetY = event.clientY;
    document.documentElement.classList.add("arena-cursor-visible");
  }, { passive: true });
  document.addEventListener("pointerover", (event) => {
    cursor.classList.toggle("is-target", Boolean(event.target.closest("a,button,[data-hover]")));
  }, { passive: true });
  window.addEventListener("pointerdown", () => cursor.classList.add("is-pressed"), { passive: true });
  window.addEventListener("pointerup", () => cursor.classList.remove("is-pressed"), { passive: true });
  document.documentElement.addEventListener("mouseleave", () => document.documentElement.classList.remove("arena-cursor-visible"));
  const animate = () => {
    x += (targetX - x) * .48; y += (targetY - y) * .48;
    redX += (targetX - redX) * .19; redY += (targetY - redY) * .19;
    blueX += (targetX - blueX) * .105; blueY += (targetY - blueY) * .105;
    cursor.style.transform = `translate3d(${x}px,${y}px,0)`;
    red.style.transform = `translate3d(${redX}px,${redY}px,0)`;
    blue.style.transform = `translate3d(${blueX}px,${blueY}px,0)`;
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("in-view"));
  }, { threshold: .14 });
  document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));
}

function initSound() {
  const control = document.querySelector("#soundControl");
  const music = document.querySelector("#bgMusic");
  if (!control || !music) return;
  music.volume = .28;

  // Sambung lagu dari kedudukan terakhir bila tukar halaman.
  const resumeAt = Number(sessionStorage.getItem("arena-music-time") || 0);
  if (resumeAt > 0) {
    music.addEventListener("loadedmetadata", () => {
      if (resumeAt < music.duration) music.currentTime = resumeAt;
    }, { once: true });
  }
  music.addEventListener("timeupdate", () => {
    sessionStorage.setItem("arena-music-time", String(music.currentTime));
  });
  window.addEventListener("pagehide", () => {
    sessionStorage.setItem("arena-music-time", String(music.currentTime));
  });
  const start = async () => {
    try {
      await music.play();
      control.classList.add("is-playing");
      control.querySelector("b").textContent = "SOUND ON";
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    } catch { /* Browser unlocks audio on first interaction. */ }
  };
  const unlock = (event) => {
    if (event.target.closest?.("#soundControl")) return;
    start();
  };
  start();
  document.addEventListener("pointerdown", unlock);
  document.addEventListener("keydown", unlock);
  control.addEventListener("click", async () => {
    if (music.paused) {
      music.volume = .28;
      await music.play();
      control.classList.add("is-playing");
      control.querySelector("b").textContent = "SOUND ON";
    } else {
      music.pause();
      control.classList.remove("is-playing");
      control.querySelector("b").textContent = "PLAY SOUND";
    }
  });
}


initIntro();
initClock();
initCursor();
initReveal();
initSound();
