(() => {
  const SUPABASE_URL = "https://orkdjfswoszxhhnxrfjv.supabase.co";
  const SUPABASE_KEY = "sb_publishable_xzz-a9majUfAHxFLr6r8iA_yEHUZA1i";
  const BUCKET = "jobsheets";
  const player = document.body.dataset.player;
  if (document.body.dataset.page !== "player" || !player) return;

  const linkKeyCloud = `arena-links-${player}`;

  function readLocalLinks() {
    try {
      const parsed = JSON.parse(localStorage.getItem(linkKeyCloud) || "[]");
      return Array.from({ length: 24 }, (_, i) => ({
        live: parsed[i]?.live || "",
        pdf: parsed[i]?.pdf || "",
        filePath: parsed[i]?.filePath || ""
      }));
    } catch {
      return Array.from({ length: 24 }, () => ({ live: "", pdf: "", filePath: "" }));
    }
  }

  function writeLocalLinks(links) {
    localStorage.setItem(linkKeyCloud, JSON.stringify(links));
  }

  async function syncCompletedFromCloud() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/jobsheets?player=eq.${encodeURIComponent(player)}&select=round,completed`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      if (!res.ok) return;
      const rows = await res.json();
      const submitted = Array.from({ length: 24 }, () => false);
      rows.forEach(row => {
        const i = Number(row.round) - 1;
        if (i >= 0 && i < 24) submitted[i] = Boolean(row.completed);
      });
      localStorage.setItem(`arena-submitted-${player}`, JSON.stringify(submitted));
    } catch {}
  }

  async function saveCompleted(round, completed) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/jobsheets?on_conflict=player,round`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        player,
        round,
        completed: Boolean(completed),
        updated_at: new Date().toISOString()
      })
    });
    if (!res.ok) throw new Error("Could not save completion.");
  }

  async function loadCloudLinks() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/jobsheets?player=eq.${encodeURIComponent(player)}&select=round,live_url,pdf_url,file_path`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (!res.ok) return;
    const rows = await res.json();
    const links = readLocalLinks();
    let changed = false;
    rows.forEach(row => {
      const i = Number(row.round) - 1;
      if (i < 0 || i >= 24) return;
      if (row.live_url && links[i].live !== row.live_url) { links[i].live = row.live_url; changed = true; }
      if (row.pdf_url && links[i].pdf !== row.pdf_url) { links[i].pdf = row.pdf_url; changed = true; }
      if (row.file_path && links[i].filePath !== row.file_path) { links[i].filePath = row.file_path; changed = true; }
    });
    if (changed) {
      writeLocalLinks(links);
      if (!sessionStorage.getItem("cloud-links-synced-" + player)) {
        sessionStorage.setItem("cloud-links-synced-" + player, "1");
        location.reload();
      }
    }
  }

  async function saveRow(round, liveUrl, pdfUrl, filePath) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/jobsheets?on_conflict=player,round`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        player,
        round,
        live_url: liveUrl || null,
        pdf_url: pdfUrl || null,
        file_path: filePath || null,
        updated_at: new Date().toISOString()
      })
    });
    if (!res.ok) throw new Error("Could not save jobsheet record.");
  }

  async function uploadPdf(round, file) {
    if (!file) throw new Error("Choose a PDF first.");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) throw new Error("PDF only.");
    if (file.size > 50 * 1024 * 1024) throw new Error("Maximum file size is 50MB.");
    const path = `${player}/jobsheet-${String(round).padStart(2, "0")}.pdf`;
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/pdf",
        "x-upsert": "true"
      },
      body: file
    });
    if (!res.ok) throw new Error("Upload failed.");
    return {
      path,
      url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
    };
  }

  function enhanceCards() {
    document.querySelectorAll(".jobsheet").forEach(card => {
      const save = card.querySelector("button[data-save]");
      if (!save || card.querySelector("[data-cloud-upload]")) return;
      const index = Number(save.dataset.save);
      const round = index + 1;
      const field = card.querySelector('input[data-field="pdf"]');
      if (!field) return;

      const label = field.closest(".job-field");
      if (label) label.style.display = "none";

      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-cloud-upload", "");
      wrapper.innerHTML = `
        <label class="job-field">
          <span>UPLOAD PDF FILE</span>
          <input type="file" accept="application/pdf,.pdf" data-cloud-file>
        </label>
        <div data-cloud-status style="font:7px monospace;letter-spacing:.08em;margin:6px 0 10px;opacity:.8">Choose PDF, then upload.</div>
        <button type="button" class="job-save" data-cloud-button>UPLOAD PDF</button>
      `;
      save.before(wrapper);

      wrapper.querySelector("[data-cloud-button]").addEventListener("click", async () => {
        const btn = wrapper.querySelector("[data-cloud-button]");
        const status = wrapper.querySelector("[data-cloud-status]");
        const file = wrapper.querySelector("[data-cloud-file]").files[0];
        try {
          btn.disabled = true;
          btn.textContent = "UPLOADING...";
          status.textContent = "Uploading to cloud...";
          const result = await uploadPdf(round, file);
          const links = readLocalLinks();
          links[index].pdf = result.url;
          links[index].filePath = result.path;
          const liveInput = card.querySelector('input[data-field="live"]');
          if (liveInput) links[index].live = liveInput.value.trim();
          writeLocalLinks(links);
          await saveRow(round, links[index].live, result.url, result.path);
          const submitted = JSON.parse(localStorage.getItem(`arena-submitted-${player}`) || "[]");
          while (submitted.length < 24) submitted.push(false);
          submitted[index] = true;
          localStorage.setItem(`arena-submitted-${player}`, JSON.stringify(submitted));
          await saveCompleted(round, true);
          status.textContent = "UPLOAD COMPLETE ✓ · AUTO TICKED";
          btn.textContent = "UPLOADED ✓";
          setTimeout(() => location.reload(), 700);
        } catch (e) {
          status.textContent = e.message || "Upload failed.";
          btn.textContent = "TRY AGAIN";
          btn.disabled = false;
        }
      });
    });
  }

  document.addEventListener("click", async (event) => {
    const btn = event.target.closest("button[data-index]");
    if (!btn) return;
    const index = Number(btn.dataset.index);
    setTimeout(async () => {
      try {
        const submitted = JSON.parse(localStorage.getItem(`arena-submitted-${player}`) || "[]");
        await saveCompleted(index + 1, Boolean(submitted[index]));
      } catch {}
    }, 50);
  }, true);

  const observer = new MutationObserver(enhanceCards);
  const grid = document.querySelector("#jobsheetGrid");
  if (grid) observer.observe(grid, { childList: true, subtree: true });
  enhanceCards();
  Promise.all([
    syncCompletedFromCloud(),
    loadCloudLinks()
  ]).then(() => {
    if (!sessionStorage.getItem("cloud-progress-synced-" + player)) {
      sessionStorage.setItem("cloud-progress-synced-" + player, "1");
      location.reload();
    }
  }).catch(() => {});
})();