/* =========================================================================
   ENGINE — motor de "motion manga" guiado pelo scroll.
   Cada página ocupa a tela inteira (palco sticky) e tem N telas de rolagem.
   O progresso p (0..1) dentro da página move câmera, camadas, painéis,
   textos e efeitos. Animações "idle" (cabelo, roupa, respiração) rodam
   sempre, e a velocidade do scroll aumenta o vento.
   ========================================================================= */
(function () {
  const WORLD_W = 1600, WORLD_H = 900;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = k => k * k * (3 - 2 * k);
  const DEFAULTS = { x: 0, y: 0, s: 1, r: 0, o: 1, b: 0 };

  /* ---------- keyframes: [[p, {prop: val}], ...] ---------- */
  function tracks(k) {
    const tr = {};
    (k || []).forEach(([p, props]) => { for (const key in props) (tr[key] = tr[key] || []).push([p, props[key]]); });
    for (const key in tr) tr[key].sort((a, b) => a[0] - b[0]);
    return tr;
  }
  function sample(tr, p) {
    const out = {};
    for (const key in tr) {
      const a = tr[key];
      if (p <= a[0][0]) { out[key] = a[0][1]; continue; }
      if (p >= a[a.length - 1][0]) { out[key] = a[a.length - 1][1]; continue; }
      for (let i = 0; i < a.length - 1; i++) {
        if (p >= a[i][0] && p <= a[i + 1][0]) {
          const k = ease((p - a[i][0]) / (a[i + 1][0] - a[i][0] || 1));
          out[key] = a[i][1] + (a[i + 1][1] - a[i][1]) * k;
          break;
        }
      }
    }
    return out;
  }

  /* ---------- construção das camadas ---------- */
  function buildLayer(spec, parent, list) {
    const wrap = document.createElement('div');
    wrap.className = 'mm-layer';
    if (spec.z != null) wrap.style.zIndex = spec.z;
    let art = null, W = 0, H = 0;

    if (spec.panel) {
      const [px, py, pw, ph] = spec.panel;
      wrap.classList.add('mm-panel');
      if (spec.border === false) wrap.classList.add('mm-noborder');
      Object.assign(wrap.style, { width: pw + 'px', height: ph + 'px', background: spec.bg || '#f3eee4' });
      W = pw; H = ph;
      spec = Object.assign({ x: px, y: py, anchor: [0, 0] }, spec);
      (spec.layers || []).forEach(ls => buildLayer(ls, wrap, list));
    } else if (spec.sfx) {
      wrap.classList.add('mm-sfx');
      wrap.innerHTML = spec.sfx;
      wrap.style.fontSize = (spec.size || 160) + 'px';
      if (spec.color) wrap.style.color = spec.color;
      W = 0; H = 0;
      spec = Object.assign({ anchor: [0.5, 0.5] }, spec);
    } else {
      const fn = window.MMArt[spec.art];
      if (!fn) { console.warn('arte desconhecida', spec.art); return; }
      art = fn(spec.opt || {});
      W = art.w * (spec.scale || 1); H = art.h * (spec.scale || 1);
      if (art.el.tagName.toLowerCase() === 'svg') { art.el.setAttribute('width', W); art.el.setAttribute('height', H); }
      else { art.el.style.width = W + 'px'; art.el.style.height = 'auto'; }
      wrap.appendChild(art.el);
    }
    parent.appendChild(wrap);
    const anchor = spec.anchor || (spec.art && /ronin|oni|miko|torii|grass|boat|candles|pillars/.test(spec.art) ? [0.5, 1] : [0.5, 0.5]);
    wrap.style.transformOrigin = `${anchor[0] * 100}% ${anchor[1] * 100}%`;
    const L = { spec, wrap, art, W, H, anchor, tr: tracks(spec.k), base: { x: spec.x || 0, y: spec.y || 0 }, home: { x: spec.x || 0, y: spec.y || 0 }, bs: 1, reveal: spec.reveal, isPanel: !!spec.panel };
    list.push(L);
    return L;
  }

  function applyLayer(L, p, t, wind, dt, frozen) {
    const v = Object.assign({}, DEFAULTS, sample(L.tr, p));
    const X = L.base.x + v.x - L.anchor[0] * L.W, Y = L.base.y + v.y - L.anchor[1] * L.H;
    let sh = '';
    if (v.shake) sh = ` translate(${(Math.random() - 0.5) * v.shake * 20}px,${(Math.random() - 0.5) * v.shake * 20}px)`;
    L.wrap.style.transform = `translate(${X.toFixed(1)}px,${Y.toFixed(1)}px)${sh} rotate(${v.r}deg) scale(${v.s * L.bs})`;
    L.wrap.style.opacity = v.o;
    L.wrap.style.filter = v.b > 0.05 ? `blur(${v.b}px)` : '';
    if (L.reveal) {
      const [a, b, dir] = L.reveal;
      const q = 1 - ease(clamp((p - a) / (b - a), 0, 1));
      const ins = { left: `0 ${q * 100}% 0 0`, right: `0 0 0 ${q * 100}%`, down: `0 0 ${q * 100}% 0`, up: `${q * 100}% 0 0 0` }[dir || 'left'];
      L.wrap.style.clipPath = `inset(${ins})`;
    }
    if (L.art && L.art.update && v.o > 0.01) L.art.update({ t: frozen ? 0 : t, p, v, wind, dt });
  }

  /* ---------- efeitos em canvas ---------- */
  function rnd(a, b) { return a + Math.random() * (b - a); }
  const FX = {
    embers: { make: (w, h) => ({ x: rnd(0, w), y: rnd(0, h), vx: rnd(-20, 20), vy: rnd(-80, -20), r: rnd(1.5, 4), life: rnd(0, 1) }),
      step(pt, dt, w, h, wind) { pt.x += (pt.vx - wind * 60) * dt; pt.y += pt.vy * dt; pt.life += dt * 0.25; if (pt.y < -10 || pt.x < -10 || pt.life > 1) Object.assign(pt, this.make(w, h), { y: h + 10, life: 0 }); },
      draw(c, pt, col) { c.fillStyle = col || '#ff5a1f'; c.globalAlpha *= Math.sin(pt.life * Math.PI); c.beginPath(); c.arc(pt.x, pt.y, pt.r, 0, 7); c.fill(); } },
    petals: { make: (w, h) => ({ x: rnd(0, w * 1.2), y: rnd(-h, h), vx: rnd(-60, -20), vy: rnd(30, 70), r: rnd(5, 9), a: rnd(0, 6) }),
      step(pt, dt, w, h, wind) { pt.x += (pt.vx - wind * 120) * dt; pt.y += pt.vy * dt; pt.a += dt * 3; if (pt.y > h + 20 || pt.x < -20) Object.assign(pt, this.make(w, h), { y: -20, x: rnd(0, w * 1.3) }); },
      draw(c, pt, col) { c.save(); c.translate(pt.x, pt.y); c.rotate(pt.a); c.scale(1, Math.abs(Math.sin(pt.a))); c.fillStyle = col || '#f4a7b9'; c.beginPath(); c.ellipse(0, 0, pt.r, pt.r * 0.55, 0, 0, 7); c.fill(); c.restore(); } },
    rain: { make: (w, h) => ({ x: rnd(-w * 0.2, w * 1.2), y: rnd(-h, h), v: rnd(900, 1400), l: rnd(14, 30) }),
      step(pt, dt, w, h, wind) { pt.y += pt.v * dt; pt.x -= (120 + wind * 200) * dt; if (pt.y > h) Object.assign(pt, this.make(w, h), { y: -30 }); },
      draw(c, pt, col) { c.strokeStyle = col || 'rgba(230,235,245,.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(pt.x, pt.y); c.lineTo(pt.x - 4, pt.y + pt.l); c.stroke(); } },
    snow: { make: (w, h) => ({ x: rnd(0, w), y: rnd(-h, h), v: rnd(30, 80), r: rnd(1.5, 4), ph: rnd(0, 6) }),
      step(pt, dt, w, h, wind, t) { pt.y += pt.v * dt; pt.x += (Math.sin(t + pt.ph) * 20 - wind * 50) * dt; if (pt.y > h) Object.assign(pt, this.make(w, h), { y: -10 }); if (pt.x < -10) pt.x = w + 10; },
      draw(c, pt, col) { c.fillStyle = col || '#fff'; c.beginPath(); c.arc(pt.x, pt.y, pt.r, 0, 7); c.fill(); } },
    fireflies: { make: (w, h) => ({ x: rnd(0, w), y: rnd(h * 0.3, h), ph: rnd(0, 6), sp: rnd(0.5, 1.5) }),
      step(pt, dt, w, h, wind, t) { pt.x += Math.sin(t * pt.sp + pt.ph) * 30 * dt; pt.y += Math.cos(t * pt.sp * 0.8 + pt.ph) * 24 * dt; },
      draw(c, pt, col, t) { const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + pt.ph)); c.globalAlpha *= a; const g = c.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 14); g.addColorStop(0, col || '#fff3a0'); g.addColorStop(1, 'rgba(255,240,150,0)'); c.fillStyle = g; c.beginPath(); c.arc(pt.x, pt.y, 14, 0, 7); c.fill(); } },
    ash: { make: (w, h) => ({ x: rnd(0, w * 1.2), y: rnd(0, h), vx: rnd(-50, -10), vy: rnd(-10, 25), s: rnd(2, 6), a: rnd(0, 6) }),
      step(pt, dt, w, h, wind) { pt.x += (pt.vx - wind * 100) * dt; pt.y += pt.vy * dt; pt.a += dt * 2; if (pt.x < -10 || pt.y > h + 10) Object.assign(pt, this.make(w, h), { x: w + 10 }); },
      draw(c, pt, col) { c.save(); c.translate(pt.x, pt.y); c.rotate(pt.a); c.fillStyle = col || '#222'; c.fillRect(-pt.s / 2, -pt.s / 4, pt.s, pt.s / 2); c.restore(); } },
  };
  // efeitos de tela inteira (sem partículas)
  function drawSpeed(c, w, h, i, t, col) {
    c.save(); c.globalAlpha = i; c.fillStyle = col || '#111';
    const cx = w / 2, cy = h / 2, R = Math.hypot(w, h);
    const n = 90; const seed = Math.floor(t * 18);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + Math.sin(seed * 13.7 + k) * 0.02;
      const r0 = R * (0.28 + 0.12 * Math.abs(Math.sin(seed * 3.1 + k * 7.3)));
      const wd = 0.004 + 0.008 * Math.abs(Math.sin(k * 5.1 + seed));
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      c.lineTo(cx + Math.cos(a - wd) * R, cy + Math.sin(a - wd) * R);
      c.lineTo(cx + Math.cos(a + wd) * R, cy + Math.sin(a + wd) * R);
      c.fill();
    }
    c.restore();
  }
  function drawInkwipe(c, w, h, q, col, t) {
    if (q <= 0) return;
    c.save(); c.fillStyle = col || '#111';
    const n = 70, cw = w / n;
    for (let k = 0; k < n; k++) {
      const delay = Math.abs(Math.sin(k * 12.9898) * 43758.5453) % 1 * 0.5;
      const len = clamp((q * 1.5 - delay) / 0.9, 0, 1) * (h * 1.15);
      if (len <= 0) continue;
      const jitter = Math.sin(k * 3.3 + t * 2) * 6;
      c.beginPath();
      c.moveTo(k * cw - 2, 0);
      c.lineTo(k * cw + cw + 2, 0);
      c.lineTo(k * cw + cw + 2, len * (0.9 + 0.1 * Math.sin(k)));
      c.lineTo(k * cw + cw / 2 + jitter, len + 20);
      c.lineTo(k * cw - 2, len * (0.92 + 0.08 * Math.cos(k * 2)));
      c.fill();
    }
    c.restore();
  }

  function buildFx(specs) {
    return (specs || []).map(sp => ({ sp, tr: tracks(sp.k || [[0, { i: 1 }]]), pts: [] }));
  }
  function drawFx(ctx, fxs, w, h, p, t, dt, wind) {
    ctx.clearRect(0, 0, w, h);
    for (const f of fxs) {
      const v = sample(f.tr, p);
      const i = v.i == null ? 1 : v.i;
      const type = f.sp.type;
      if (type === 'speed') { if (i > 0.01) drawSpeed(ctx, w, h, i, t, f.sp.color); continue; }
      if (type === 'inkwipe') { drawInkwipe(ctx, w, h, v.q || 0, f.sp.color, t); continue; }
      if (type === 'flash') { if (i > 0.01) { ctx.fillStyle = f.sp.color || '#fff'; ctx.globalAlpha = i * (0.6 + Math.random() * 0.4); ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; } continue; }
      const def = FX[type]; if (!def) continue;
      const want = Math.round((f.sp.count || 60) * (w * h) / (1600 * 900) + 10);
      while (f.pts.length < want) f.pts.push(def.make(w, h));
      if (i <= 0.01) continue;
      for (const pt of f.pts) {
        def.step(pt, dt, w, h, wind, t);
        ctx.globalAlpha = i;
        def.draw(ctx, pt, f.sp.color, t);
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ---------- textos (balões, narração, gritos) ---------- */
  function buildTexts(stage, items) {
    const box = document.createElement('div');
    box.className = 'mm-texts';
    stage.appendChild(box);
    return (items || []).map(it => {
      const el = document.createElement('div');
      el.className = 'mm-text mm-' + (it.kind || 'narr');
      el.innerHTML = (it.who ? `<span class="mm-who">${it.who}</span>` : '') + `<span>${it.html}</span>`;
      const pos = it.pos || {};
      for (const k of ['left', 'right', 'top', 'bottom']) if (pos[k] != null) el.style[k] = pos[k];
      if (pos.maxWidth) el.style.maxWidth = pos.maxWidth;
      box.appendChild(el);
      return { it, el };
    });
  }
  function applyTexts(texts, p) {
    for (const { it, el } of texts) {
      const [a, b] = it.at || [0.1, 0.9];
      const fade = 0.06;
      const k = clamp(Math.min((p - a) / fade, (b - p) / fade), 0, 1);
      el.style.opacity = k;
      el.style.transform = `translateY(${(1 - k) * 24}px) scale(${0.96 + k * 0.04})`;
      el.style.visibility = k > 0 ? 'visible' : 'hidden';
    }
  }

  /* ---------- montagem do capítulo ---------- */
  function mount(container, pages, opts = {}) {
    window.MMArt.installDefs();
    const state = { pages: [], cur: window.scrollY, target: window.scrollY, last: performance.now(), t: 0, frozen: !!opts.reduced, vh: window.innerHeight, vw: window.innerWidth };

    pages.forEach((pg, idx) => {
      const sec = document.createElement('section');
      sec.className = 'mm-page';
      sec.style.height = `calc(${(pg.len || 3) * 100}vh + 100vh)`;
      sec.dataset.index = idx;
      const stage = document.createElement('div');
      stage.className = 'mm-stage';
      stage.style.background = pg.bg || '#f3eee4';
      const world = document.createElement('div');
      world.className = 'mm-world';
      world.style.width = WORLD_W + 'px'; world.style.height = WORLD_H + 'px';
      stage.appendChild(world);
      const camEl = document.createElement('div');
      camEl.className = 'mm-cam';
      world.appendChild(camEl);
      const layers = [];
      (pg.layers || []).forEach(ls => buildLayer(ls, camEl, layers));
      const canvas = document.createElement('canvas');
      canvas.className = 'mm-fx';
      stage.appendChild(canvas);
      const texts = buildTexts(stage, pg.text);
      const tex = document.createElement('div');
      tex.className = 'mm-grain' + (pg.halftone ? ' mm-halftone' : '');
      stage.appendChild(tex);
      sec.appendChild(stage);
      container.appendChild(sec);
      state.pages.push({ pg, sec, stage, world, camEl, layers, canvas, ctx: canvas.getContext('2d'), fx: buildFx(pg.fx), texts, camTr: tracks(pg.cam), top: 0, height: 0, visible: false });
    });

    function layout() {
      state.vw = window.innerWidth; state.vh = window.innerHeight;
      const sc = Math.max(state.vw / WORLD_W, state.vh / WORLD_H);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const portrait = state.vw / state.vh < 0.9;
      for (const P of state.pages) {
        P.top = P.sec.offsetTop; P.height = P.sec.offsetHeight;
        const fx = P.pg.focusX == null ? 0.5 : P.pg.focusX;
        let s2 = sc, ox = (state.vw - WORLD_W * sc) * fx, oy = (state.vh - WORLD_H * sc) / 2;
        const panels = P.layers.filter(L => L.isPanel && L.wrap.parentNode === P.camEl);
        // Retrato (celular): quadros empilhados em coluna; cenas abertas com enquadramento mais largo.
        if (portrait && panels.length) {
          const colW = 1000, gap = 50;
          let y = 0;
          for (const L of panels) { L.bs = colW / L.W; L.base = { x: (WORLD_W - colW) / 2, y }; y += L.H * L.bs + gap; }
          const totalH = y - gap;
          s2 = Math.min(state.vw / (colW + 60), (state.vh * 0.86) / totalH);
          ox = state.vw / 2 - (WORLD_W / 2) * s2;
          oy = (state.vh - totalH * s2) / 2;
        } else {
          for (const L of panels) { L.bs = 1; L.base = { x: L.home.x, y: L.home.y }; }
          if (portrait) {
            s2 = Math.max(state.vw / 1000, state.vh / 1500);
            ox = (state.vw - WORLD_W * s2) * fx;
            oy = (state.vh - WORLD_H * s2) * 0.62;
          }
        }
        P.world.style.transform = `translate(${ox}px,${oy}px) scale(${s2})`;
        P.canvas.width = state.vw * dpr; P.canvas.height = state.vh * dpr;
        P.canvas.style.width = state.vw + 'px'; P.canvas.style.height = state.vh + 'px';
        P.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }
    layout();
    window.addEventListener('resize', layout);
    window.addEventListener('load', layout);

    function frame(now) {
      const dt = Math.min((now - state.last) / 1000, 0.05);
      state.last = now;
      if (!state.frozen) state.t += dt;
      state.target = window.scrollY;
      const prev = state.cur;
      state.cur += (state.target - state.cur) * (state.frozen ? 1 : 0.12);
      if (Math.abs(state.target - state.cur) < 0.1) state.cur = state.target;
      const vel = Math.abs(state.cur - prev) / Math.max(dt, 0.001);
      const scrollWind = Math.min(vel / state.vh, 2.5);

      let total = 0;
      for (const P of state.pages) {
        const span = P.height - state.vh;
        const vis = state.cur + state.vh > P.top - 50 && state.cur < P.top + P.height + 50;
        if (vis !== P.visible) { P.visible = vis; P.stage.style.visibility = vis ? 'visible' : 'hidden'; }
        if (!vis) continue;
        const p = clamp((state.cur - P.top) / span, 0, 1);
        const wind = (P.pg.wind == null ? 0.6 : P.pg.wind) + scrollWind;
        const cam = Object.assign({ x: 0, y: 0, s: 1, r: 0 }, sample(P.camTr, p));
        let shake = '';
        if (cam.shake) shake = ` translate(${(Math.random() - 0.5) * cam.shake * 30}px,${(Math.random() - 0.5) * cam.shake * 30}px)`;
        P.camEl.style.transform = `translate(${WORLD_W / 2}px,${WORLD_H / 2}px) scale(${cam.s}) rotate(${cam.r}deg) translate(${-WORLD_W / 2 + cam.x}px,${-WORLD_H / 2 + cam.y}px)${shake}`;
        for (const L of P.layers) applyLayer(L, p, state.t, wind, dt, state.frozen);
        drawFx(P.ctx, P.fx, state.vw, state.vh, p, state.t, state.frozen ? 0 : dt, wind);
        applyTexts(P.texts, p);
      }
      const max = document.documentElement.scrollHeight - state.vh;
      total = max > 0 ? clamp(state.cur / max, 0, 1) : 0;
      if (opts.onProgress) opts.onProgress(total, state);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return {
      setReduced(r) { state.frozen = r; },
      relayout: layout,
    };
  }

  // Renderiza uma cena estática/animada dentro de um cartão (capas da biblioteca).
  function cover(el, scene) {
    window.MMArt.installDefs();
    const world = document.createElement('div');
    world.className = 'mm-world';
    world.style.width = WORLD_W + 'px'; world.style.height = WORLD_H + 'px';
    el.style.background = scene.bg || '#f3eee4';
    el.appendChild(world);
    const layers = [];
    (scene.layers || []).forEach(ls => buildLayer(ls, world, layers));
    const fit = () => {
      const r = el.getBoundingClientRect();
      const sc = Math.max(r.width / WORLD_W, r.height / WORLD_H);
      world.style.transform = `translate(${(r.width - WORLD_W * sc) * (scene.focusX == null ? 0.5 : scene.focusX)}px,${(r.height - WORLD_H * sc) / 2}px) scale(${sc})`;
    };
    fit(); window.addEventListener('resize', fit);
    let t = 0, last = performance.now(), on = true;
    const io = new IntersectionObserver(es => { on = es[0].isIntersecting; });
    io.observe(el);
    (function loop(now) {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      if (on) { t += dt; for (const L of layers) applyLayer(L, scene.p == null ? 0.5 : scene.p, t, scene.wind == null ? 0.7 : scene.wind, dt, false); }
      requestAnimationFrame(loop);
    })(last);
  }

  window.MMEngine = { mount, cover, WORLD_W, WORLD_H };
})();
