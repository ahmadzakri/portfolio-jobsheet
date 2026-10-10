/* ============================================================
   KING OF JOBSHEETS · CLOUD ROUNDS
   Jobsheet list for each fighter + PDF / HTML upload to Supabase.
   Only rounds that exist are shown.
   ============================================================ */
(() => {
  const SUPABASE_URL = "https://orkdjfswoszxhhnxrfjv.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ya2RqZnN3b3N6eGhobnhyZmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyODE4MDYsImV4cCI6MjEwMTg1NzgwNn0.vjK5AaJtXZsZXgWexu-r3scGot-laIILLf9CVLOBNpg";
  const BUCKET = "jobsheets";
  const TABLE = "jobsheets";
  const TOTAL = 24;
  const PLAYERS = ["zakri", "redza"];

  // Upload straight to the GitHub repo when a token is connected (GITHUB button).
  const GH = {
    owner: "ahmadzakri",
    repo: "portfolio-jobsheet",
    branch: "main",
    folder: { zakri: "", redza: "REDZA/" }, // zakri → JS4/, redza → REDZA/JS4/
  };
  const GH_KEY = "kof-github-token";
  const ghToken = () => { try { return localStorage.getItem(GH_KEY) || ""; } catch { return ""; } };

  // Jobsheets that already exist in the GitHub repo (shown even if the cloud is offline).
  // A cloud record for the same round replaces these.
  const REPO_ROUNDS = {
    zakri: {
      1: { title: "JOBSHEET 1 - HTML5", description: "Rossi restaurant website with a menu, interior photos and signature dishes.", live: "JS1/", pdf: "JS1/js1.pdf" },
      2: { title: "JOBSHEET 2 - HTML5", description: "Digital camera comparison website with specifications and brand information.", live: "JS2/", pdf: "JS2/js2.pdf" },
      3: { title: "JOBSHEET 3 - HTML5", description: "College information website with navigation links and course details.", live: "JS3/", pdf: "JS3/js3.pdf" },
      4: { title: "JOBSHEET 4 - CSS3", description: "Art gallery website for The Scream by Edvard Munch, styled with external CSS3.", live: "JS4/", pdf: "JS4/js4.pdf", added: "2026-10-10T01:45:00Z" },
      5: { title: "JOBSHEET 5 - CSS3", description: "Creative Arts Store artist registration form (Set 3), styled with external CSS3 styleLab5.css.", live: "JS5/", pdf: "JS5/js5.pdf", added: "2026-10-10T02:10:00Z" },
      6: { title: "JOBSHEET 6 - CSS3", description: "Campus Library mobile web page (Set 3) with a gradient header, rounded navigation lists and a library illustration, styled with external CSS3 style.css.", live: "JS6/", pdf: "JS6/js6.pdf", added: "2026-10-10T02:20:00Z" },
      7: { title: "JOBSHEET 7 - JavaScript Event", description: "Malaysian Heritage photo gallery (Set 3) using JavaScript events: clicking a thumbnail swaps the featured image, and hovering fades its caption in and out, with external Lab8.js.", live: "JS7/", pdf: "JS7/js7.pdf", added: "2026-10-10T02:45:00Z" },
      8: { title: "JOBSHEET 8 - JavaScript Client Side Validation", description: "Event Registration form (Set 3) with JavaScript client-side validation: fields highlight on focus, and empty required fields are flagged in red on submit, with external Lab9.js.", live: "JS8/", pdf: "JS8/js8.pdf", added: "2026-10-10T03:00:00Z" },
    },
    redza: {},
  };

  const page = document.body.dataset.page;
  const player = document.body.dataset.player || "";
  const pad = (n) => String(n).padStart(2, "0");
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
  const publicUrl = (path) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${enc(path)}`;
  const headers = (json) => ({
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    ...(json ? { "Content-Type": "application/json" } : {}),
  });
  const TYPES = { html: "text/html", htm: "text/html", css: "text/css", js: "text/javascript", json: "application/json", pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", mp4: "video/mp4", mp3: "audio/mpeg", txt: "text/plain", woff2: "font/woff2" };
  const typeOf = (file) => file.type || TYPES[(file.name.split(".").pop() || "").toLowerCase()] || "application/octet-stream";
  const safeName = (n) => n.replace(/[^\w.\-]/g, "_");

  /* ---------- DATA ---------- */
  async function fetchRows(name) {
    const q = name ? `player=eq.${encodeURIComponent(name)}&` : "";
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?${q}select=*&order=round.asc`, { cache: "no-store", headers: headers() });
    if (!res.ok) throw new Error(`CLOUD ${res.status}`);
    return res.json();
  }

  function mergeRounds(name, rows) {
    const map = {};
    Object.entries(REPO_ROUNDS[name] || {}).forEach(([round, r]) => {
      map[round] = { round: Number(round), title: r.title, description: r.description, liveUrl: r.live || "", htmlPath: "", pdf: r.pdf || "", updated: r.added || "", added: r.added || "", source: "repo" };
    });
    rows.filter((row) => row.player === name).forEach((row) => {
      const round = Number(row.round);
      if (!(round >= 1 && round <= TOTAL)) return;
      if (row.completed === false) {
        // an old delete record must not hide a repo round added after it
        const repo = map[round];
        if (repo && repo.added && (!row.updated_at || new Date(row.updated_at) < new Date(repo.added))) return;
        delete map[round]; return;
      } // round dipadam
      if (!row.pdf_url && !row.live_url && !row.html_path) return; // old record without files
      const base = map[round] || {};
      map[round] = {
        round,
        title: row.title || base.title || `JOBSHEET ${round}`,
        description: row.description ?? base.description ?? "",
        liveUrl: row.live_url || "",
        htmlPath: row.html_path || "",
        pdf: row.pdf_url || "",
        updated: row.updated_at || "",
        source: "cloud",
      };
    });
    return Object.values(map).sort((a, b) => a.round - b.round);
  }

  async function uploadFile(path, file) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${enc(path)}`, {
      method: "POST",
      headers: { ...headers(), "Content-Type": typeOf(file), "x-upsert": "true", "cache-control": "60" },
      body: file,
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(`${file.name}: ${j.message || j.error || `UPLOAD FAILED (${res.status})`}`);
    }
  }

  async function upsertRound(name, round, patch) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?on_conflict=player,round`, {
      method: "POST",
      headers: { ...headers(true), Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ player: name, round, ...patch, updated_at: new Date().toISOString() }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const msg = j.message || `SAVE FAILED (${res.status})`;
      throw new Error(/column/i.test(msg) ? "Database not updated yet. Run supabase-setup.sql in the Supabase SQL Editor." : msg);
    }
  }

  async function deleteRound(name, round) {
    await upsertRound(name, round, { completed: false, title: null, description: null, pdf_url: null, live_url: null, html_path: null, file_path: null });
  }

  /* ---------- GITHUB ---------- */
  const ghApi = (path) => `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${enc(path)}`;
  const ghHeaders = (token) => ({ Accept: "application/vnd.github+json", Authorization: `Bearer ${token}` });
  const fileToB64 = (file) => new Promise((ok, bad) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1] || "");
    r.onerror = () => bad(new Error(`CANNOT READ ${file.name}`));
    r.readAsDataURL(file);
  });
  async function ghError(res) {
    const j = await res.json().catch(() => ({}));
    return new Error({
      401: "GITHUB TOKEN INVALID / EXPIRED",
      403: "TOKEN LACKS CONTENTS: READ AND WRITE PERMISSION",
      404: "REPO NOT FOUND / TOKEN HAS NO ACCESS TO THIS REPO",
      409: "CONFLICT · TRY AGAIN",
      422: j.message || "GITHUB REJECTED THIS FILE",
    }[res.status] || `GITHUB ${res.status}: ${j.message || "ERROR"}`);
  }
  async function ghPut(path, file, message) {
    const token = ghToken();
    const head = await fetch(`${ghApi(path)}?ref=${GH.branch}`, { headers: ghHeaders(token), cache: "no-store" });
    if (!head.ok && head.status !== 404) throw await ghError(head);
    const sha = head.ok ? (await head.json()).sha : undefined;
    const res = await fetch(ghApi(path), {
      method: "PUT",
      headers: { ...ghHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ message, content: await fileToB64(file), branch: GH.branch, ...(sha ? { sha } : {}) }),
    });
    if (!res.ok) throw await ghError(res);
  }
  async function ghCheck(token) {
    const res = await fetch(`https://api.github.com/repos/${GH.owner}/${GH.repo}`, { headers: ghHeaders(token), cache: "no-store" });
    if (!res.ok) throw await ghError(res);
    const j = await res.json();
    if (!j.permissions || !j.permissions.push) throw new Error("TOKEN IS READ-ONLY · NEEDS CONTENTS: READ AND WRITE");
  }

  let ghPanel;
  function openGithubPanel(onChange) {
    if (!ghPanel) {
      ghPanel = document.createElement("div");
      ghPanel.className = "arena-preview gh-panel";
      ghPanel.hidden = true;
      ghPanel.innerHTML = `
        <form class="preview-panel" role="dialog" aria-modal="true" aria-label="GitHub link">
          <div class="preview-head">
            <div><span class="preview-kind">GITHUB LINK</span><b class="preview-title">${GH.owner}/${GH.repo}</b></div>
            <button class="preview-close" type="button" aria-label="Close">✕</button>
          </div>
          <div class="gh-body">
            <p>Once connected, every upload goes straight into the GitHub repo (folders <b>JS4/</b>, <b>JS5/</b>…). The token is stored in this browser only.</p>
            <label class="job-field"><span>FINE-GRAINED TOKEN</span><input type="password" name="token" autocomplete="off" spellcheck="false" placeholder="github_pat_…"></label>
            <div class="upload-status" data-gh-status></div>
            <div class="gh-actions">
              <button class="job-save job-link-save" type="button" data-gh-unlink>UNLINK</button>
              <button class="job-save" type="submit">LINK GITHUB</button>
            </div>
          </div>
        </form>`;
      document.body.appendChild(ghPanel);
      const close = () => { ghPanel.hidden = true; document.documentElement.classList.remove("preview-lock"); };
      ghPanel.addEventListener("click", (e) => { if (e.target === ghPanel || e.target.closest(".preview-close")) close(); });
      ghPanel.querySelector("[data-gh-unlink]").addEventListener("click", () => {
        try { localStorage.removeItem(GH_KEY); } catch {}
        ghPanel.querySelector("[data-gh-status]").textContent = "GITHUB DISCONNECTED · UPLOADING TO CLOUD ONLY";
        ghPanel.querySelector("input").value = "";
        ghPanel._onChange?.();
      });
      ghPanel.querySelector("form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = ghPanel.querySelector("input");
        const status = ghPanel.querySelector("[data-gh-status]");
        const token = input.value.trim();
        if (!token) { status.textContent = "PASTE TOKEN DULU"; return; }
        status.textContent = "CHECKING…";
        try {
          await ghCheck(token);
          localStorage.setItem(GH_KEY, token);
          status.textContent = "GITHUB LINKED ✓";
          ghPanel._onChange?.();
          setTimeout(close, 700);
        } catch (err) { status.textContent = err.message; }
      });
    }
    ghPanel._onChange = onChange;
    ghPanel.querySelector("input").value = ghToken();
    ghPanel.querySelector("[data-gh-status]").textContent = ghToken() ? "GITHUB LINKED ✓" : "";
    ghPanel.hidden = false;
    document.documentElement.classList.add("preview-lock");
    ghPanel.querySelector("input").focus();
  }

  /* ---------- PREVIEW MODAL ---------- */
  let preview, blobUrl;
  function buildPreview() {
    preview = document.createElement("div");
    preview.className = "arena-preview";
    preview.hidden = true;
    preview.innerHTML = `
      <div class="preview-panel" role="dialog" aria-modal="true" aria-label="Preview">
        <div class="preview-head">
          <div><span class="preview-kind"></span><b class="preview-title"></b></div>
          <a class="preview-open" target="_blank" rel="noreferrer">OPEN TAB ↗</a>
          <button class="preview-close" type="button" aria-label="Close preview">✕</button>
        </div>
        <div class="preview-body"><iframe title="Preview"></iframe><p class="preview-msg"></p></div>
      </div>`;
    document.body.appendChild(preview);
    preview.addEventListener("click", (e) => { if (e.target === preview || e.target.closest(".preview-close")) closePreview(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !preview.hidden) closePreview(); });
  }
  function freshFrame(sandboxed) {
    const old = preview.querySelector("iframe");
    const frame = document.createElement("iframe");
    frame.title = "Preview";
    if (sandboxed) frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-downloads");
    old.replaceWith(frame);
    return frame;
  }
  function closePreview() {
    preview.hidden = true;
    document.documentElement.classList.remove("preview-lock");
    freshFrame(false);
    if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
  }
  async function openPreview(rec, kind) {
    if (!preview) buildPreview();
    const frame = freshFrame(kind !== "pdf" && Boolean(rec.htmlPath));
    const open = preview.querySelector(".preview-open");
    const msg = preview.querySelector(".preview-msg");
    preview.querySelector(".preview-kind").textContent = kind === "pdf" ? "PDF PREVIEW" : "LIVE WEBSITE PREVIEW";
    preview.querySelector(".preview-title").textContent = `ROUND ${pad(rec.round)} · ${rec.title}`;
    msg.textContent = "";
    preview.hidden = false;
    document.documentElement.classList.add("preview-lock");

    if (kind === "pdf") {
      frame.src = rec.pdf;
      open.href = rec.pdf;
      return;
    }
    if (rec.htmlPath) {
      // Supabase serves HTML as plain text, so we render it ourselves with a <base> pointing to the original folder.
      const url = publicUrl(rec.htmlPath);
      const folder = url.slice(0, url.lastIndexOf("/") + 1);
      msg.textContent = "LOADING…";
      try {
        const res = await fetch(`${url}?_=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(res.status);
        let html = await res.text();
        const base = `<base href="${folder}">`;
        html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + base) : base + html;
        frame.srcdoc = html;
        blobUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }));
        open.href = blobUrl;
        msg.textContent = "";
      } catch {
        msg.textContent = "LIVE FILE NOT FOUND · UPLOAD HTML AGAIN";
      }
      return;
    }
    frame.src = rec.liveUrl;
    open.href = rec.liveUrl;
  }

  /* ---------- HOME ---------- */
  async function initHome() {
    let rows = [];
    try { rows = await fetchRows(""); } catch (e) { console.error("Cloud:", e); }
    const counts = Object.fromEntries(PLAYERS.map((p) => [p, mergeRounds(p, rows).length]));
    const total = Math.round(((counts.zakri + counts.redza) / (TOTAL * 2)) * 100);
    const set = (sel, fn) => { const el = document.querySelector(sel); if (el) fn(el); };
    PLAYERS.forEach((p) => {
      set(`#${p}Count`, (el) => { el.textContent = pad(counts[p]); });
      set(`#${p}MissionCount`, (el) => { el.textContent = `${counts[p]}/${TOTAL}`; });
      set(`#${p}Bar`, (el) => { el.style.width = `${counts[p] / TOTAL * 100}%`; });
    });
    set("#totalPercent", (el) => { el.textContent = String(total); });
    set("#dialGlow", (el) => { el.style.strokeDashoffset = String(547 - (547 * total / 100)); });
  }

  /* ---------- PLAYER ---------- */
  function initPlayer() {
    const grid = document.querySelector("#jobsheetGrid");
    if (!grid) return;
    const state = document.querySelector("#cloudState");
    let rounds = [];
    let cloudOk = false;
    let filter = new URLSearchParams(location.search).get("filter") || "all";
    let flipped = null;
    if (!["all", "live", "pdf"].includes(filter)) filter = "all";

    const hasLive = (r) => Boolean(r.htmlPath || r.liveUrl);
    const nextRound = () => {
      const used = new Set(rounds.map((r) => r.round));
      for (let n = 1; n <= TOTAL; n++) if (!used.has(n)) return n;
      return TOTAL;
    };
    const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase() : "GITHUB REPO";

    function form(rec) {
      const id = rec ? rec.round : "new";
      return `<form class="round-form" data-form="${id}" novalidate>
        <div class="back-head"><span>${rec ? `ROUND ${pad(rec.round)} · EDIT` : "NEW ROUND · UPLOAD"}</span><div class="back-tools">${rec ? `<button class="job-delete" type="button" data-delete="${rec.round}">DELETE</button>` : ""}<button class="job-close" type="button" data-flip="${id}" aria-label="Close panel">✕</button></div></div>
        ${rec ? "" : `<label class="job-field"><span>ROUND NO.</span><input type="number" name="round" min="1" max="${TOTAL}" value="${nextRound()}" required></label>`}
        <label class="job-field"><span>TITLE</span><input type="text" name="title" maxlength="80" value="${esc(rec ? rec.title : "")}" placeholder="JOBSHEET 4 - CSS3" required></label>
        <label class="job-field"><span>DESCRIPTION</span><textarea name="description" rows="2" maxlength="240" placeholder="What was built in this jobsheet">${esc(rec ? rec.description : "")}</textarea></label>
        <label class="job-field job-file"><span>PDF REPORT${rec && rec.pdf ? " · REPLACE" : ""}</span><input type="file" name="pdf" accept="application/pdf,.pdf"></label>
        <label class="job-field job-file"><span>HTML FILE${rec && hasLive(rec) ? " · REPLACE" : ""}</span><input type="file" name="html" accept=".html,.htm,text/html"></label>
        <label class="job-field job-file"><span>CSS / JS / IMAGES</span><input type="file" name="extras" multiple></label>
        <label class="job-field"><span>OR LIVE URL</span><input type="url" name="live" value="${esc(rec ? rec.liveUrl : "")}" placeholder="https://..."></label>
        <div class="upload-status" data-status></div>
        <span class="job-target">${ghToken() ? "→ GITHUB REPO" : "→ CLOUD"}</span>
        <button class="job-save" type="submit">${rec ? "SAVE ROUND" : "UPLOAD ROUND"}</button>
      </form>`;
    }

    function card(rec) {
      const live = hasLive(rec);
      return `<article class="jobsheet is-done ${flipped === rec.round ? "is-flipped" : ""}">
        <div class="job-inner">
          <div class="job-face job-front">
            <div class="job-top"><span class="job-number">ROUND ${pad(rec.round)}</span><span class="job-state">MISSION CLEARED</span></div>
            ${live ? `<span class="job-linked">LIVE</span>` : ""}
            <h3>${esc(rec.title)}</h3>
            ${rec.description ? `<p class="job-desc">${esc(rec.description)}</p>` : `<p class="job-desc"></p>`}
            <span class="job-stamp">CLEARED</span>
            <div class="front-links">
              ${live ? `<a href="#" data-preview="live" data-round="${rec.round}">↗ VIEW LIVE</a>` : `<span>LIVE · NONE</span>`}
              ${rec.pdf ? `<a href="#" data-preview="pdf" data-round="${rec.round}">↗ VIEW PDF</a>` : `<span>PDF · NONE</span>`}
            </div>
            <button class="detail-toggle" type="button" data-flip="${rec.round}" aria-expanded="${flipped === rec.round}">EDIT ROUND <span>&#8635;</span></button>
            <div class="job-actions"><span>${fmtDate(rec.updated)}</span><span>${rec.source === "cloud" ? "CLOUD" : "REPO"}</span></div>
          </div>
          <div class="job-face job-back">${form(rec)}</div>
        </div>
      </article>`;
    }

    function newCard() {
      if (rounds.length >= TOTAL) return "";
      return `<article class="jobsheet job-new ${flipped === "new" ? "is-flipped" : ""}" id="newRoundCard">
        <div class="job-inner">
          <div class="job-face job-front">
            <div class="job-top"><span class="job-number">ROUND ${pad(nextRound())}</span><span class="job-state">OPEN SLOT</span></div>
            <h3>NEW<br>ROUND +</h3>
            <p class="job-desc">Upload the PDF and HTML for the next round.</p>
            <button class="detail-toggle" type="button" data-flip="new">UPLOAD ROUND <span>&#8635;</span></button>
            <div class="job-actions"><span>${rounds.length} / ${TOTAL} CLEARED</span><span>READY</span></div>
          </div>
          <div class="job-face job-back">${form(null)}</div>
        </div>
      </article>`;
    }

    function render() {
      const done = rounds.length;
      const percent = Math.round(done / TOTAL * 100);
      document.querySelector("#playerCompleted").textContent = String(done);
      document.querySelector("#playerProgressBar").style.width = `${percent}%`;
      document.querySelector("#playerPercent").textContent = `${percent}% ROUNDS CLEARED`;
      const liveCount = rounds.filter(hasLive).length;
      const pdfCount = rounds.filter((r) => r.pdf).length;
      document.querySelectorAll("[data-filter]").forEach((b) => {
        b.classList.toggle("is-active", b.dataset.filter === filter);
        b.textContent = { all: `ALL ${done}`, live: `LIVE ${liveCount}`, pdf: `PDF ${pdfCount}` }[b.dataset.filter];
      });
      const visible = rounds.filter((r) => filter === "all" || (filter === "live" ? hasLive(r) : r.pdf));
      grid.innerHTML = visible.map(card).join("") + (filter === "all" ? newCard() : "");
      document.querySelector("#emptyLog").hidden = visible.length > 0 || filter === "all";
    }

    async function load() {
      let rows = [];
      try {
        rows = await fetchRows(player);
        cloudOk = true;
        state.textContent = "● CLOUD ONLINE";
        state.classList.remove("is-off");
      } catch (e) {
        console.error("Cloud:", e);
        cloudOk = false;
        state.textContent = "● CLOUD OFFLINE · UPLOAD DISABLED";
        state.classList.add("is-off");
      }
      rounds = mergeRounds(player, rows);
      render();
    }

    grid.addEventListener("click", async (e) => {
      const prev = e.target.closest("[data-preview]");
      if (prev) {
        e.preventDefault();
        const rec = rounds.find((r) => r.round === Number(prev.dataset.round));
        if (rec) openPreview(rec, prev.dataset.preview);
        return;
      }
      const flip = e.target.closest("[data-flip]");
      if (flip) {
        const id = flip.dataset.flip === "new" ? "new" : Number(flip.dataset.flip);
        flipped = flipped === id ? null : id;
        render();
        return;
      }
      const del = e.target.closest("[data-delete]");
      if (del) {
        const round = Number(del.dataset.delete);
        if (!cloudOk) return alert("CLOUD OFFLINE · CANNOT DELETE");
        if (!confirm(`Delete ROUND ${pad(round)} from the list? You can upload it again later.`)) return;
        const status = del.closest("form").querySelector("[data-status]");
        try {
          del.disabled = true;
          del.textContent = "…";
          status.textContent = "DELETING…";
          await deleteRound(player, round);
          flipped = null;
          await load();
        } catch (err) {
          status.textContent = err.message;
          del.disabled = false;
          del.textContent = "DELETE";
        }
      }
    });

    grid.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      const isNew = f.dataset.form === "new";
      const status = f.querySelector("[data-status]");
      const button = f.querySelector("button[type=submit]");
      const say = (t) => { status.textContent = t; };
      if (!cloudOk) return say("CLOUD OFFLINE · SEMAK PROJEK SUPABASE");

      const round = isNew ? Number(f.round.value) : Number(f.dataset.form);
      const rec = rounds.find((r) => r.round === round);
      const title = f.title.value.trim();
      const description = f.description.value.trim();
      const live = f.live.value.trim();
      const pdf = f.pdf.files[0];
      const html = f.html.files[0];
      const extras = [...f.extras.files];

      if (!(round >= 1 && round <= TOTAL)) return say(`ROUND MUST BE 1 TO ${TOTAL}`);
      if (!title) return say("ENTER A TITLE");
      if (pdf && !/\.pdf$/i.test(pdf.name)) return say("PDF ONLY FOR THE REPORT");
      if (html && !/\.html?$/i.test(html.name)) return say("HTML FILE MUST BE .html / .htm");
      if (live && /\s/.test(live)) return say("LIVE URL CANNOT CONTAIN SPACES");
      if ([pdf, html, ...extras].some((x) => x && x.size > 50 * 1024 * 1024)) return say("EACH FILE MAX 50MB");
      if (isNew && !pdf && !html && !live) return say("CHOOSE A PDF, HTML OR LIVE URL");
      if (isNew && rec && !confirm(`ROUND ${pad(round)} already exists. Replace it?`)) return;

      const toGithub = Boolean(ghToken());
      const base = toGithub ? `${GH.folder[player] || ""}JS${round}` : `${player}/round-${pad(round)}`;
      const commitMsg = `${player.toUpperCase()} · Jobsheet ${round}: ${title}`;
      const patch = { title, description, completed: true, live_url: live || null };
      if (!isNew || rec) {
        // keep old files that were not replaced
        if (rec && rec.pdf) patch.pdf_url = rec.pdf;
        if (rec && rec.htmlPath) patch.html_path = rec.htmlPath;
      }
      try {
        button.disabled = true;
        button.textContent = "UPLOADING…";
        if (toGithub) {
          // files go into the repo: JS4/index.html, JS4/js4.pdf, JS4/style.css …
          if (pdf) {
            say("PUSH PDF → GITHUB…");
            await ghPut(`${base}/js${round}.pdf`, pdf, commitMsg);
            patch.pdf_url = `${base}/js${round}.pdf`;
            patch.file_path = `github:${base}/js${round}.pdf`;
          }
          for (const x of extras) {
            say(`PUSH ${x.name.toUpperCase()} → GITHUB…`);
            await ghPut(`${base}/${safeName(x.name)}`, x, commitMsg);
          }
          if (html) {
            say("PUSH HTML → GITHUB…");
            await ghPut(`${base}/index.html`, html, commitMsg);
            patch.live_url = `${base}/`;
            patch.html_path = null;
          }
        } else {
          if (pdf) {
            say("UPLOADING PDF…");
            await uploadFile(`${base}/report.pdf`, pdf);
            patch.pdf_url = `${publicUrl(`${base}/report.pdf`)}?v=${Date.now()}`;
            patch.file_path = `${base}/report.pdf`;
          }
          if (html) {
            say("UPLOADING HTML…");
            await uploadFile(`${base}/site/index.html`, html);
            patch.html_path = `${base}/site/index.html`;
          }
          for (const x of extras) {
            say(`UPLOADING ${x.name.toUpperCase()}…`);
            await uploadFile(`${base}/site/${safeName(x.name)}`, x);
          }
        }
        say("SAVING ROUND…");
        await upsertRound(player, round, patch);
        say(toGithub && (pdf || html || extras.length) ? "SAVED ✓ · GITHUB PAGES LIVE IN ±1 MINUTE" : "ROUND SAVED ✓");
        button.textContent = "SAVED ✓";
        button.classList.add("is-saved");
        flipped = null;
        setTimeout(load, toGithub ? 1600 : 600);
      } catch (err) {
        console.error(err);
        say(err.message || "UPLOAD FAILED");
        button.disabled = false;
        button.textContent = "TRY AGAIN";
      }
    });

    document.querySelector(".log-tools")?.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-filter]");
      if (!b) return;
      filter = b.dataset.filter;
      flipped = null;
      render();
    });

    const ghButton = document.querySelector("#ghLink");
    const paintGh = () => {
      if (!ghButton) return;
      const on = Boolean(ghToken());
      ghButton.textContent = on ? "GITHUB · LINKED ✓" : "LINK GITHUB";
      ghButton.classList.toggle("is-linked", on);
      document.querySelectorAll(".job-target").forEach((el) => { el.textContent = on ? "→ GITHUB REPO" : "→ CLOUD"; });
    };
    ghButton?.addEventListener("click", () => openGithubPanel(() => { paintGh(); render(); }));

    document.querySelector("#newRound")?.addEventListener("click", () => {
      filter = "all";
      flipped = "new";
      render();
      document.querySelector("#newRoundCard")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    render();
    paintGh();
    load();
  }

  if (page === "home") initHome();
  if (page === "player" && player) initPlayer();
})();
