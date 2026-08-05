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

  // Team character cards — flip to Contact Us side on tap
  document.querySelectorAll('.char-card[data-select]').forEach(card=>{
    card.addEventListener('click', ()=>{
      playSelectSound();
      card.classList.toggle('flipped');
    });
  });

  // Jobsheet front page: pick a fighter to enter their 24-jobsheet grid
  document.querySelectorAll('.jobsheet-select-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      playSelectSound();
      document.getElementById('jobsheetSelectScreen').classList.add('hidden');
      document.getElementById(`log-${card.dataset.target}`).classList.remove('hidden');
    });
  });
  document.querySelectorAll('[data-back]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      btn.closest('.player-log').classList.add('hidden');
      document.getElementById('jobsheetSelectScreen').classList.remove('hidden');
    });
  });

  // ---- EDIT THESE: one shared repo, one folder per person ----
  const GITHUB_BASE = "https://github.com/your-username/your-repo";
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

  PLAYERS.forEach(player => {
    const fullLink = `${GITHUB_BASE}/${player.folder}`;
    document.getElementById(`repoLinkText-${player.key}`).textContent = fullLink;
    document.getElementById(`repoOpenBtn-${player.key}`).href = fullLink;

    const submitted = loadSubmitted(player.key);
    const grid = document.getElementById(`jobsheetGrid-${player.key}`);
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
      });
      grid.appendChild(card);
    }
    refreshProgress(player.key);
  });

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

  // Cursor slash trail — hit-mark slashes that follow the mouse's motion and fade out
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
    let slashes = [];
    let lastSpawn = 0;
    let lastX = null, lastY = null;

    function spawnSlash(x, y, angle, speed){
      slashes.push({
        x, y, angle,
        life: 1,
        length: 16 + Math.min(speed, 40),
        width: 2 + Math.random() * 1.5,
        color: palette[Math.floor(Math.random() * palette.length)]
      });
      if(slashes.length > 60) slashes.shift();
    }

    function handleMove(x, y){
      const now = performance.now();
      if(lastX === null){ lastX = x; lastY = y; return; }
      const dx = x - lastX, dy = y - lastY;
      const dist = Math.hypot(dx, dy);
      if(dist > 3 && now - lastSpawn > 16){
        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.3;
        spawnSlash(x, y, angle, dist);
        lastSpawn = now;
      }
      lastX = x; lastY = y;
    }

    window.addEventListener('mousemove', (e)=> handleMove(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e)=>{
      const t = e.touches[0];
      if(t) handleMove(t.clientX, t.clientY);
    }, {passive:true});

    function loop(){
      ctx.clearRect(0, 0, w, h);
      slashes.forEach(s=>{
        s.life -= 0.055;
        if(s.life > 0){
          const half = (s.length * s.life) / 2;
          const dx = Math.cos(s.angle) * half;
          const dy = Math.sin(s.angle) * half;
          ctx.globalAlpha = s.life;
          ctx.strokeStyle = s.color;
          ctx.shadowColor = s.color;
          ctx.shadowBlur = 10;
          ctx.lineWidth = s.width * s.life;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(s.x - dx, s.y - dy);
          ctx.lineTo(s.x + dx, s.y + dy);
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;
      slashes = slashes.filter(s => s.life > 0);
      requestAnimationFrame(loop);
    }
    loop();
  })();
