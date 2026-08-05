// ---- Synthesized "select" blip (no external audio file, generated in-browser) ----
  function playSelectSound(){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }catch(e){ /* audio not available, fail silently */ }
  }

  // ---- Lighter synthesized "tick" for general clicks (buttons, links, toggles) ----
  function playClickSound(){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    }catch(e){ /* audio not available, fail silently */ }
  }

  // Every clickable thing gets a sound — delegated so it also covers
  // elements created dynamically (jobsheet cards, check buttons, etc).
  // Excludes .char-card / .jobsheet-select-card since those already play
  // their own (bigger) select sound above, to avoid double-firing.
  document.addEventListener('click', (e)=>{
    const el = e.target.closest('button, a, .hud-mini, [contenteditable="true"]');
    if(el && !el.closest('.char-card[data-select]') && !el.closest('.jobsheet-select-card')){
      playClickSound();
    }
  });

  // Team character cards — flip to Contact Us side on tap
  document.querySelectorAll('.char-card[data-select]').forEach(card=>{
    card.addEventListener('click', ()=>{
      playSelectSound();
      card.classList.toggle('flipped');
    });
  });

  // Jobsheet select cards now navigate to a real page (zakri.html / redza.html) —
  // just play the select sound on the way out, let the link do the navigating.
  document.querySelectorAll('.jobsheet-select-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      playSelectSound();
    });
  });

  // ---- EDIT THESE: one shared repo, one folder per person ----
  const GITHUB_BASE = "https://github.com/ahmadzakri/portfolio-jobsheet";
  const PLAYERS = [
    { key: "zakri", folder: "tree/main/zakri" },
    { key: "redza", folder: "tree/main/shah-redza" }
  ];

  function loadSubmitted(key){
    try{
      const raw = localStorage.getItem(`arena-submitted-${key}`);
      return raw ? JSON.parse(raw) : Array(24).fill(false);
    }catch(e){ return Array(24).fill(false); }
  }
  function saveSubmitted(key, arr){
    try{ localStorage.setItem(`arena-submitted-${key}`, JSON.stringify(arr)); }catch(e){}
  }
  function refreshProgress(key){
    const submitted = loadSubmitted(key);
    const count = submitted.filter(Boolean).length;
    const pct = Math.round((count/24)*100);
    const fill = document.getElementById(`progressFill-${key}`);
    const pctText = document.getElementById(`progressPct-${key}`);
    const selectText = document.getElementById(`selectProgress-${key}`);
    if(fill) fill.style.width = pct + '%';
    if(pctText) pctText.textContent = `${count} / 24 · ${pct}%`;
    if(selectText) selectText.textContent = `${count} / 24 · ${pct}%`;
  }

  // Hero HUD panel — combined overall status for both fighters, switchable per player
  const GAUGE_CIRCUMFERENCE = 515;
  let heroView = 'overall'; // 'overall' | 'zakri' | 'redza'

  function refreshHeroPanel(){
    const zakriSubmitted = loadSubmitted('zakri');
    const redzaSubmitted = loadSubmitted('redza');
    const zakriCount = zakriSubmitted.filter(Boolean).length;
    const redzaCount = redzaSubmitted.filter(Boolean).length;
    const totalDone = zakriCount + redzaCount;
    const overallPct = Math.round((totalDone / 48) * 100);

    const miniZakri = document.getElementById('miniZakri');
    const miniRedza = document.getElementById('miniRedza');
    const segmentRow = document.getElementById('segmentRow');

    if(miniZakri) miniZakri.textContent = `${zakriCount} / 24`;
    if(miniRedza) miniRedza.textContent = `${redzaCount} / 24`;

    // Combat log segments always reflect combined progress
    if(segmentRow){
      if(!segmentRow.children.length){
        for(let i = 0; i < 24; i++){
          const seg = document.createElement('div');
          seg.className = 'segment';
          segmentRow.appendChild(seg);
        }
      }
      const filledSegments = Math.round((overallPct / 100) * 24);
      Array.from(segmentRow.children).forEach((seg, i)=>{
        seg.classList.toggle('filled', i < filledSegments);
      });
    }

    renderGauge({ zakriCount, redzaCount, overallPct });
  }

  function renderGauge(counts){
    const gaugeFill = document.getElementById('gaugeFill');
    const gaugePct = document.getElementById('gaugePct');
    const gaugeLabel = document.getElementById('gaugeLabel');
    const boxZakri = document.getElementById('miniBox-zakri');
    const boxRedza = document.getElementById('miniBox-redza');

    let pct, label;
    if(heroView === 'zakri'){
      pct = Math.round((counts.zakriCount / 24) * 100);
      label = 'ZAKRI';
    }else if(heroView === 'redza'){
      pct = Math.round((counts.redzaCount / 24) * 100);
      label = 'REDZA';
    }else{
      pct = counts.overallPct;
      label = 'OVERALL';
    }

    if(gaugeFill){
      const offset = GAUGE_CIRCUMFERENCE - (pct / 100) * GAUGE_CIRCUMFERENCE;
      gaugeFill.style.strokeDashoffset = offset;
    }
    if(gaugePct) gaugePct.textContent = pct + '%';
    if(gaugeLabel) gaugeLabel.textContent = label;
    if(boxZakri) boxZakri.classList.toggle('active', heroView === 'zakri');
    if(boxRedza) boxRedza.classList.toggle('active', heroView === 'redza');
  }

  document.querySelectorAll('.hud-mini[data-player]').forEach(box=>{
    box.addEventListener('click', ()=>{
      const player = box.dataset.player;
      heroView = (heroView === player) ? 'overall' : player;
      refreshHeroPanel();
    });
  });

  PLAYERS.forEach(player => {
    const fullLink = `${GITHUB_BASE}/${player.folder}`;
    const linkTextEl = document.getElementById(`repoLinkText-${player.key}`);
    const openBtnEl = document.getElementById(`repoOpenBtn-${player.key}`);
    if(linkTextEl) linkTextEl.textContent = fullLink;
    if(openBtnEl) openBtnEl.href = fullLink;

    const grid = document.getElementById(`jobsheetGrid-${player.key}`);
    if(grid){
      const submitted = loadSubmitted(player.key);
      for(let i = 1; i <= 24; i++){
        const idx = i - 1;
        const num = String(i).padStart(2,'0');
        const card = document.createElement('a');
        card.className = 'jobsheet-card' + (submitted[idx] ? ' submitted' : '');
        card.href = fullLink;
        card.target = '_blank';
        card.rel = 'noopener';
        card.innerHTML = `
          <div class="jobsheet-hit">${num}</div>
          <div class="jobsheet-name">Jobsheet ${num}</div>
          <div class="jobsheet-open mono">OPEN FOLDER →</div>
          <button class="jobsheet-check mono" type="button">${submitted[idx] ? '✓ SUBMITTED' : 'MARK SUBMITTED'}</button>
        `;
        const checkBtn = card.querySelector('.jobsheet-check');
        checkBtn.addEventListener('click', (e)=>{
          e.preventDefault();
          e.stopPropagation();
          const current = loadSubmitted(player.key);
          current[idx] = !current[idx];
          saveSubmitted(player.key, current);
          card.classList.toggle('submitted', current[idx]);
          checkBtn.textContent = current[idx] ? '✓ SUBMITTED' : 'MARK SUBMITTED';
          refreshProgress(player.key);
          refreshHeroPanel();
        });
        grid.appendChild(card);
      }
    }
    refreshProgress(player.key);
  });

  refreshHeroPanel();

  // Floating ember particles in the hero
  const emberField = document.getElementById('emberField');
  const emberCount = 30;
  for(let i = 0; i < emberCount; i++){
    const ember = document.createElement('div');
    ember.className = 'ember';
    const left = Math.random() * 100;
    const duration = 6 + Math.random() * 6;
    const delay = Math.random() * 10;
    const drift = (Math.random() * 60 - 30).toFixed(0) + 'px';
    const size = (3 + Math.random() * 3).toFixed(1) + 'px';
    ember.style.left = left + '%';
    ember.style.width = size;
    ember.style.height = size;
    ember.style.setProperty('--drift', drift);
    ember.style.animationDuration = duration + 's';
    ember.style.animationDelay = delay + 's';
    emberField.appendChild(ember);
  }

  // Scroll-reveal: fade + rise content blocks into view
  document.querySelectorAll('.about-grid, .select-grid, .jobsheet-select-screen, .sec-head').forEach(el=>{
    el.classList.add('reveal');
  });
  const revealObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {threshold:0.15});
  document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));

  // Fighter Profile stats — click a number to edit, saved so it persists on reload
  function loadStat(key, fallback){
    try{
      const raw = localStorage.getItem(`arena-stat-${key}`);
      return raw !== null ? Number(raw) : fallback;
    }catch(e){ return fallback; }
  }
  function saveStat(key, value){
    try{ localStorage.setItem(`arena-stat-${key}`, String(value)); }catch(e){}
  }
  document.querySelectorAll('.stat-value').forEach(el=>{
    const key = el.dataset.key;
    const fallback = Number(el.textContent);
    const saved = loadStat(key, fallback);
    el.textContent = saved;
    const track = document.querySelector(`.stat-fill[data-key="${key}"]`);
    if(track) track.dataset.value = saved;

    function commit(){
      let val = parseInt(el.textContent.replace(/[^0-9-]/g,''), 10);
      if(isNaN(val)) val = fallback;
      val = Math.max(0, Math.min(100, val));
      el.textContent = val;
      saveStat(key, val);
      if(track){
        track.dataset.value = val;
        track.style.width = val + '%';
      }
    }
    el.addEventListener('blur', commit);
    el.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter'){ e.preventDefault(); el.blur(); }
    });
  });

  // Background music play/pause toggle
  const bgMusic = document.getElementById('bgMusic');
  const musicToggle = document.getElementById('musicToggle');
  const musicIcon = document.getElementById('musicIcon');
  const musicLabel = document.getElementById('musicLabel');
  bgMusic.volume = 0.5;

  musicToggle.addEventListener('click', ()=>{
    if(bgMusic.paused){
      bgMusic.play().catch(()=>{
        musicLabel.textContent = 'ADD bg-music.mp3';
      });
    }else{
      bgMusic.pause();
    }
  });
  bgMusic.addEventListener('play', ()=>{
    musicToggle.classList.add('playing');
    musicIcon.textContent = '❙❙';
    musicLabel.textContent = 'PAUSE MUSIC';
  });
  bgMusic.addEventListener('pause', ()=>{
    musicToggle.classList.remove('playing');
    musicIcon.textContent = '♪';
    musicLabel.textContent = 'PLAY MUSIC';
  });

  // Try to autoplay on load. Browsers block audio-with-sound autoplay until
  // the user has interacted with the page, so if it's blocked, start it on
  // the very first click/tap/keypress anywhere instead.
  function tryAutoplay(){
    bgMusic.play().catch(()=>{
      const startOnInteract = ()=>{
        bgMusic.play().catch(()=>{});
        window.removeEventListener('click', startOnInteract);
        window.removeEventListener('keydown', startOnInteract);
        window.removeEventListener('touchstart', startOnInteract);
      };
      window.addEventListener('click', startOnInteract);
      window.addEventListener('keydown', startOnInteract);
      window.addEventListener('touchstart', startOnInteract);
    });
  }
  tryAutoplay();

  // Live date & time in the HUD
  const liveClock = document.getElementById('liveClock');
  function updateClock(){
    const now = new Date();
    const datePart = now.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
    const timePart = now.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    liveClock.textContent = `${datePart} • ${timePart}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // HUD scroll progress
  const hudFill = document.getElementById('hudFill');
  function updateHud(){
    if(!hudFill) return;
    const scrolled = window.scrollY;
    const max = document.body.scrollHeight - window.innerHeight;
    const pct = Math.min(100, (scrolled / max) * 100);
    hudFill.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateHud);
  updateHud();

  // Active nav state
  const sections = document.querySelectorAll('section');
  const navButtons = document.querySelectorAll('.hud-nav button');
  navButtons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.getElementById(btn.dataset.target).scrollIntoView({behavior:'smooth'});
    });
  });
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        navButtons.forEach(b=>b.classList.remove('active'));
        const active = document.querySelector(`.hud-nav button[data-target="${entry.target.id}"]`);
        if(active) active.classList.add('active');
      }
    });
  }, {threshold:0.4});
  sections.forEach(sec=>observer.observe(sec));

  // Animate stat bars — grow to their value once the About section is reachable
  function animateStats(){
    document.querySelectorAll('.stat-fill').forEach(el=>{
      el.style.width = el.dataset.value + '%';
    });
  }
  const aboutSection = document.getElementById('about');
  if(aboutSection){
    const statObserver = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          animateStats();
          statObserver.disconnect();
        }
      });
    }, {threshold:0, rootMargin:'0px 0px -10% 0px'});
    statObserver.observe(aboutSection);

    // Fallback: if About is already on screen at load (short pages, no scroll needed)
    window.addEventListener('load', ()=>{
      const rect = aboutSection.getBoundingClientRect();
      if(rect.top < window.innerHeight && rect.bottom > 0){
        animateStats();
        statObserver.disconnect();
      }
    });
  }

  // Cursor spark trail — small glowing dots that follow the mouse and fade out
  (function(){
    const canvas = document.createElement('canvas');
    canvas.id = 'cursorTrail';
    Object.assign(canvas.style, {
      position:'fixed', inset:'0', zIndex:'2',
      pointerEvents:'none', mixBlendMode:'screen'
    });
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let w, h;
    function resize(){ w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    const palette = ['#FF5A1F', '#FFD23F', '#2FD8FF', '#E1122D'];
    let sparks = [];
    let lastSpawn = 0;

    function spawnSpark(x, y){
      sparks.push({
        x, y,
        vx: (Math.random() - 0.5) * 1.4,
        vy: (Math.random() - 0.5) * 1.4 - 0.3,
        life: 1,
        size: 2 + Math.random() * 2.5,
        color: palette[Math.floor(Math.random() * palette.length)]
      });
      if(sparks.length > 120) sparks.shift();
    }

    window.addEventListener('mousemove', (e)=>{
      const now = performance.now();
      if(now - lastSpawn > 20){ // throttle spawn rate
        spawnSpark(e.clientX, e.clientY);
        lastSpawn = now;
      }
    });
    window.addEventListener('touchmove', (e)=>{
      const t = e.touches[0];
      if(t) spawnSpark(t.clientX, t.clientY);
    }, {passive:true});

    function loop(){
      ctx.clearRect(0, 0, w, h);
      sparks.forEach(s=>{
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.025;
        if(s.life > 0){
          ctx.globalAlpha = s.life;
          ctx.beginPath();
          ctx.fillStyle = s.color;
          ctx.shadowColor = s.color;
          ctx.shadowBlur = 8;
          ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
      sparks = sparks.filter(s => s.life > 0);
      requestAnimationFrame(loop);
    }
    loop();
  })();