const TOTAL = 24;

// PUBLIC JOBSHEET LINKS
// IMPORTANT: links stored only in localStorage are visible on one browser/device only.
// Put permanent/public links here so everyone opening the GitHub Pages site can see them.
const publicJobsheetLinks = {
  zakri: {
    1: {
      live: "https://ahmadzakri.github.io/portfolio-jobsheet/JS1/",
      pdf: "https://ahmadzakri.github.io/portfolio-jobsheet/JS1/js1.pdf",
    },
    2: {
      live: "https://ahmadzakri.github.io/portfolio-jobsheet/JS2/",
      pdf: "https://ahmadzakri.github.io/portfolio-jobsheet/JS2/js2.pdf",
    },
    3: {
      live: "https://ahmadzakri.github.io/portfolio-jobsheet/JS3/",
      pdf: "https://ahmadzakri.github.io/portfolio-jobsheet/JS3/js3.pdf",
    },
    4: {
      pdf: "https://ahmadzakri.github.io/portfolio-jobsheet/JS4/js4.pdf",
    },
    5: {
      pdf: "https://ahmadzakri.github.io/portfolio-jobsheet/JS5/js5.pdf",
    },
  },
  redza: {},
};

const jobsheetRecords = Object.fromEntries(["zakri", "redza"].map((player) => [
  player,
  Array.from({ length: TOTAL }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    const publicLink = publicJobsheetLinks[player]?.[index + 1] || {};
    return {
      number,
      title: `Jobsheet ${number}`,
      description: publicLink.live || publicLink.pdf
        ? "Public jobsheet link is available."
        : "Jobsheet link has not been published yet.",
      liveUrl: publicLink.live || null,
      pdfUrl: publicLink.pdf || null,
    };
  }),
]));

function storageKey(player) {
  return `arena-submitted-${player}`;
}

function readProgress(player) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(player)) || "[]");
    return Array.from({ length: TOTAL }, (_, index) => {
      const fallback = Boolean(
        publicJobsheetLinks[player]?.[index + 1]?.live ||
        publicJobsheetLinks[player]?.[index + 1]?.pdf
      );
      return Boolean(parsed[index]) || fallback;
    });
  } catch {
    return Array.from({ length: TOTAL }, (_, index) => Boolean(
      publicJobsheetLinks[player]?.[index + 1]?.live ||
      publicJobsheetLinks[player]?.[index + 1]?.pdf
    ));
  }
}

function linkKey(player) {
  return `arena-links-${player}`;
}

function readLinks(player) {
  try {
    const parsed = JSON.parse(localStorage.getItem(linkKey(player)) || "[]");
    return Array.from({ length: TOTAL }, (_, index) => ({
      live: parsed[index]?.live || "",
      pdf: parsed[index]?.pdf || "",
    }));
  } catch {
    return Array.from({ length: TOTAL }, () => ({ live: "", pdf: "" }));
  }
}

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

function initHomeProgress() {
  if (document.body.dataset.page !== "home") return;
  const zakri = readProgress("zakri").filter(Boolean).length;
  const redza = readProgress("redza").filter(Boolean).length;
  const totalPercent = Math.round(((zakri + redza) / (TOTAL * 2)) * 100);
  document.querySelector("#zakriCount").textContent = String(zakri).padStart(2, "0");
  document.querySelector("#redzaCount").textContent = String(redza).padStart(2, "0");
  document.querySelector("#zakriMissionCount").textContent = `${zakri}/24`;
  document.querySelector("#redzaMissionCount").textContent = `${redza}/24`;
  document.querySelector("#zakriBar").style.width = `${zakri / TOTAL * 100}%`;
  document.querySelector("#redzaBar").style.width = `${redza / TOTAL * 100}%`;
  document.querySelector("#totalPercent").textContent = String(totalPercent);
  document.querySelector("#dialGlow").style.strokeDashoffset = String(547 - (547 * totalPercent / 100));
}

function initPlayerLog() {
  if (document.body.dataset.page !== "player") return;
  const player = document.body.dataset.player;
  const grid = document.querySelector("#jobsheetGrid");
  let submitted = readProgress(player);
  let links = readLinks(player);
  let filter = new URLSearchParams(location.search).get("filter") || "all";
  let expanded = null;
  if (!["all", "completed", "pending"].includes(filter)) filter = "all";
  const render = () => {
    const completed = submitted.filter(Boolean).length;
    const percent = Math.round(completed / TOTAL * 100);
    document.querySelector("#playerCompleted").textContent = String(completed);
    document.querySelector("#playerProgressBar").style.width = `${percent}%`;
    document.querySelector("#playerPercent").textContent = `${percent}% ROUNDS CLEARED`;
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.filter === filter);
      if (button.dataset.filter === "completed") button.textContent = `CLEARED ${completed}`;
      if (button.dataset.filter === "pending") button.textContent = `PENDING ${TOTAL - completed}`;
    });
    const visible = submitted.map((done, index) => ({ done, index })).filter(({ done }) => filter === "all" || (filter === "completed" ? done : !done));
    grid.innerHTML = visible.map(({ done, index }) => {
      const record = jobsheetRecords[player][index];
      const number = record.number;
      const live = links[index].live || record.liveUrl || "";
      const pdf = links[index].pdf || record.pdfUrl || "";
      const isFlipped = expanded === index;
      return `<article class="jobsheet ${done ? "is-done" : ""} ${isFlipped ? "is-flipped" : ""}">
        <div class="job-inner">
          <div class="job-face job-front">
            <div class="job-top"><span class="job-number">${number}</span><span class="job-state">${done ? "MISSION CLEARED" : "READY TO BUILD"}</span></div>
            ${live || pdf ? `<span class="job-linked">LINKED</span>` : ""}
            <h3>${record.title}</h3>
            ${done ? `<span class="job-stamp">CLEARED</span>` : ""}
            <div class="front-links">
              ${live ? `<a href="${esc(live)}" target="_blank" rel="noreferrer">↗ VIEW LIVE</a>` : `<span>LIVE · PENDING</span>`}
              ${pdf ? `<a href="${esc(pdf)}" target="_blank" rel="noreferrer">↗ VIEW PDF</a>` : `<span>PDF · PENDING</span>`}
            </div>
            <button class="detail-toggle" data-details="${index}" aria-expanded="${isFlipped}">EDIT LINK <span>&#8635;</span></button>
            <div class="job-actions"><span>ROUND ${number}</span><button data-index="${index}">${done ? "✓ SUBMITTED" : "MARK DONE"}</button></div>
          </div>
          <div class="job-face job-back">
            <div class="back-head"><span>ROUND ${number} · UPLOAD</span><button class="job-close" data-details="${index}" aria-label="Close panel">✕</button></div>
            <label class="job-field"><span>LIVE URL</span><input type="url" data-field="live" value="${esc(live)}" placeholder="https://nama.github.io/..."></label>
            <label class="job-field"><span>PDF URL</span><input type="url" data-field="pdf" value="${esc(pdf)}" placeholder="https://.../jobsheet.pdf"></label>
            <div class="back-links">
              ${live ? `<a href="${esc(live)}" target="_blank" rel="noreferrer">↗ VIEW LIVE</a>` : `<span>LIVE · PENDING</span>`}
              ${pdf ? `<a href="${esc(pdf)}" target="_blank" rel="noreferrer">↗ VIEW PDF</a>` : `<span>PDF · PENDING</span>`}
            </div>
            <button class="job-save" data-save="${index}">SAVE LINK</button>
          </div>
        </div>
      </article>`;
    }).join("");
    document.querySelector("#emptyLog").hidden = visible.length > 0;
  };
  grid.addEventListener("click", (event) => {
    const saveButton = event.target.closest("button[data-save]");
    if (saveButton) {
      const index = Number(saveButton.dataset.save);
      const card = saveButton.closest(".jobsheet");
      links[index] = {
        live: card.querySelector('input[data-field="live"]').value.trim(),
        pdf: card.querySelector('input[data-field="pdf"]').value.trim(),
      };
      localStorage.setItem(linkKey(player), JSON.stringify(links));
      saveButton.textContent = "SAVED ✓";
      saveButton.classList.add("is-saved");
      window.setTimeout(render, 700);
      return;
    }
    const detailButton = event.target.closest("button[data-details]");
    if (detailButton) {
      const index = Number(detailButton.dataset.details);
      expanded = expanded === index ? null : index;
      render();
      return;
    }
    const button = event.target.closest("button[data-index]");
    if (!button) return;
    const index = Number(button.dataset.index);
    submitted[index] = !submitted[index];
    localStorage.setItem(storageKey(player), JSON.stringify(submitted));
    render();
  });
  document.querySelector(".log-tools")?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    filter = button.dataset.filter;
    expanded = null;
    render();
  });
  document.querySelector("#resetProgress")?.addEventListener("click", () => {
    submitted = Array(TOTAL).fill(false);
    localStorage.setItem(storageKey(player), JSON.stringify(submitted));
    render();
  });
  render();
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
initHomeProgress();
initPlayerLog();
initSound();
