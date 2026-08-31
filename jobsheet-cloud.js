(() => {
  const SUPABASE_URL = "https://orkdjfswoszxhhnxrfjv.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ya2RqZnN3b3N6eGhobnhyZmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyODE4MDYsImV4cCI6MjEwMTg1NzgwNn0.vjK5AaJtXZsZXgWexu-r3scGot-laIILLf9CVLOBNpg";
  const BUCKET = "jobsheets";
  const page = document.body.dataset.page;
  const player = document.body.dataset.player || "";

  const headers = () => ({
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`
  });

  function progressKey(name) {
    return `arena-submitted-${name}`;
  }

  function linksKey(name) {
    return `arena-links-${name}`;
  }

  function readProgress(name) {
    try {
      const value = JSON.parse(localStorage.getItem(progressKey(name)) || "[]");
      return Array.from({ length: 24 }, (_, i) => Boolean(value[i]));
    } catch {
      return Array(24).fill(false);
    }
  }

  function readLinks(name) {
    try {
      const value = JSON.parse(localStorage.getItem(linksKey(name)) || "[]");
      return Array.from({ length: 24 }, (_, i) => ({
        live: value[i]?.live || "",
        pdf: value[i]?.pdf || "",
        filePath: value[i]?.filePath || ""
      }));
    } catch {
      return Array.from({ length: 24 }, () => ({ live: "", pdf: "", filePath: "" }));
    }
  }

  function writeIfChanged(key, value) {
    const next = JSON.stringify(value);
    if (localStorage.getItem(key) === next) return false;
    localStorage.setItem(key, next);
    return true;
  }

  async function fetchRows(name) {
    const query = name
      ? `player=eq.${encodeURIComponent(name)}&`
      : "";
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/jobsheets?${query}select=player,round,completed,live_url,pdf_url,file_path&_=${Date.now()}`,
      { cache: "no-store", headers: headers() }
    );
    if (!res.ok) throw new Error(`Cloud sync failed (${res.status})`);
    return res.json();
  }

  async function syncPlayer(name) {
    const rows = await fetchRows(name);
    const progress = Array(24).fill(false);
    const links = readLinks(name);

    rows.forEach((row) => {
      const i = Number(row.round) - 1;
      if (i < 0 || i >= 24) return;
      progress[i] = Boolean(row.completed);
      if (row.live_url) links[i].live = row.live_url;
      if (row.pdf_url) links[i].pdf = row.pdf_url;
      if (row.file_path) links[i].filePath = row.file_path;
    });

    const pChanged = writeIfChanged(progressKey(name), progress);
    const lChanged = writeIfChanged(linksKey(name), links);
    return pChanged || lChanged;
  }

  async function syncHome() {
    const rows = await fetchRows("");
    const grouped = { zakri: [], redza: [] };
    rows.forEach((row) => {
      if (grouped[row.player]) grouped[row.player].push(row);
    });

    let changed = false;
    for (const name of ["zakri", "redza"]) {
      const progress = Array(24).fill(false);
      grouped[name].forEach((row) => {
        const i = Number(row.round) - 1;
        if (i >= 0 && i < 24) progress[i] = Boolean(row.completed);
      });
      changed = writeIfChanged(progressKey(name), progress) || changed;
    }
    return changed;
  }

  async function upsertRound(name, round, patch) {
    const body = {
      player: name,
      round,
      ...patch,
      updated_at: new Date().toISOString()
    };
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/jobsheets?on_conflict=player,round`,
      {
        method: "POST",
        headers: {
          ...headers(),
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify(body)
      }
    );
    if (!res.ok) throw new Error(`Save failed (${res.status})`);
  }

  async function uploadPdf(name, round, file) {
    if (!file) throw new Error("Choose a PDF first.");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      throw new Error("PDF only.");
    }
    if (file.size > 50 * 1024 * 1024) throw new Error("Maximum file size is 50MB.");

    const path = `${name}/jobsheet-${String(round).padStart(2, "0")}.pdf`;
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
      {
        method: "POST",
        headers: {
          ...headers(),
          "Content-Type": "application/pdf",
          "x-upsert": "true"
        },
        body: file
      }
    );
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);

    return {
      path,
      url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
    };
  }

  function enhanceCards() {
    if (page !== "player" || !player) return;

    document.querySelectorAll(".jobsheet").forEach((card) => {
      const save = card.querySelector("button[data-save]");
      if (!save || card.querySelector("[data-cloud-upload]")) return;

      const index = Number(save.dataset.save);
      const round = index + 1;
      const oldPdfField = card.querySelector('input[data-field="pdf"]');
      if (!oldPdfField) return;

      oldPdfField.closest(".job-field")?.remove();

      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-cloud-upload", "");
      wrapper.innerHTML = `
        <label class="job-field">
          <span>UPLOAD PDF FILE</span>
          <input type="file" accept="application/pdf,.pdf" data-cloud-file>
        </label>
        <div data-cloud-status style="font:7px monospace;letter-spacing:.08em;margin:6px 0 10px;opacity:.8">
          Choose PDF, then upload.
        </div>
        <button type="button" class="job-save" data-cloud-button>UPLOAD PDF</button>
      `;
      save.before(wrapper);
      save.textContent = "SAVE LIVE LINK";

      wrapper.querySelector("[data-cloud-button]").addEventListener("click", async () => {
        const button = wrapper.querySelector("[data-cloud-button]");
        const status = wrapper.querySelector("[data-cloud-status]");
        const file = wrapper.querySelector("[data-cloud-file]").files[0];

        try {
          button.disabled = true;
          button.textContent = "UPLOADING...";
          status.textContent = "Uploading to cloud...";

          const result = await uploadPdf(player, round, file);
          const links = readLinks(player);
          const live = card.querySelector('input[data-field="live"]')?.value.trim() || links[index].live || "";

          links[index] = { live, pdf: result.url, filePath: result.path };
          writeIfChanged(linksKey(player), links);

          const progress = readProgress(player);
          progress[index] = true;
          writeIfChanged(progressKey(player), progress);

          await upsertRound(player, round, {
            live_url: live || null,
            pdf_url: result.url,
            file_path: result.path,
            completed: true
          });

          status.textContent = "UPLOAD COMPLETE ✓ · AUTO TICKED";
          button.textContent = "UPLOADED ✓";
          setTimeout(() => location.reload(), 500);
        } catch (error) {
          console.error(error);
          status.textContent = error.message || "Upload failed.";
          button.textContent = "TRY AGAIN";
          button.disabled = false;
        }
      });
    });
  }

  if (page === "player" && player) {
    document.addEventListener("click", (event) => {
      const roundButton = event.target.closest("button[data-index]");
      if (roundButton) {
        const index = Number(roundButton.dataset.index);
        setTimeout(() => {
          const progress = readProgress(player);
          upsertRound(player, index + 1, { completed: Boolean(progress[index]) }).catch(console.error);
        }, 80);
      }

      const saveLinkButton = event.target.closest("button[data-save]");
      if (saveLinkButton) {
        const index = Number(saveLinkButton.dataset.save);
        setTimeout(() => {
          const links = readLinks(player);
          upsertRound(player, index + 1, {
            live_url: links[index]?.live || null,
            pdf_url: links[index]?.pdf || null,
            file_path: links[index]?.filePath || null,
            completed: readProgress(player)[index]
          }).catch(console.error);
        }, 80);
      }

      if (event.target.closest("#resetProgress")) {
        setTimeout(() => {
          const rows = Array.from({ length: 24 }, (_, i) => ({
            player,
            round: i + 1,
            completed: false,
            updated_at: new Date().toISOString()
          }));
          fetch(`${SUPABASE_URL}/rest/v1/jobsheets?on_conflict=player,round`, {
            method: "POST",
            headers: {
              ...headers(),
              "Content-Type": "application/json",
              Prefer: "resolution=merge-duplicates"
            },
            body: JSON.stringify(rows)
          }).catch(console.error);
        }, 80);
      }
    }, true);

    const grid = document.querySelector("#jobsheetGrid");
    if (grid) {
      new MutationObserver(enhanceCards).observe(grid, { childList: true, subtree: true });
    }
    enhanceCards();

    syncPlayer(player)
      .then((changed) => {
        enhanceCards();
        if (changed) location.reload();
      })
      .catch((error) => console.error("Jobsheet cloud sync:", error));
  }

  if (page === "home") {
    syncHome()
      .then((changed) => {
        if (changed) location.reload();
      })
      .catch((error) => console.error("Home cloud sync:", error));
  }
})();