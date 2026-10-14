/* =========================================================================
   ART — personagens e cenários vetoriais animados (todos originais).
   Cada builder retorna { el, w, h, update(ctx) }.
   ctx = { t (segundos), p (progresso da página 0..1), v (valores keyframe),
           wind (vento base + velocidade do scroll), dt }
   ========================================================================= */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#111', PAPER = '#f3eee4', RED = '#d4161d', SKIN = '#f6efe2';

  function s(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function svgRoot(w, h) {
    const svg = s('svg', { viewBox: `0 0 ${w} ${h}`, width: w, height: h, overflow: 'visible' });
    return svg;
  }
  const lerp = (a, b, k) => a + (b - a) * k;

  /* ---------- RIBBON: base de cabelo, cachecol, capa, correntes ---------- */
  // Gera uma fita afunilada que ondula ao longo do comprimento.
  function ribbonD(o, t, wind) {
    const seg = o.seg || 12;
    let x = o.x, y = o.y;
    const L = [], R = [];
    const step = o.len / seg;
    for (let i = 0; i <= seg; i++) {
      const u = i / seg;
      let dx = Math.cos(o.a), dy = Math.sin(o.a);
      dy += (o.grav || 0) * u;
      dx += (o.wx || 0) * wind * u;
      const n = Math.hypot(dx, dy); dx /= n; dy /= n;
      const wave = Math.sin(t * (o.freq || 3) - u * (o.k || 4) + (o.ph || 0)) * (o.amp || 0.3) * Math.pow(u, 1.2) * (0.5 + wind * 0.5);
      const c = Math.cos(wave), sn = Math.sin(wave);
      const rx = dx * c - dy * sn, ry = dx * sn + dy * c;
      const w = lerp(o.w0, o.w1 == null ? 0 : o.w1, u) / 2;
      L.push([x - ry * w, y + rx * w]);
      R.push([x + ry * w, y - rx * w]);
      x += rx * step; y += ry * step;
    }
    const pts = L.concat(R.reverse());
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      d += `Q${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
    }
    return d + 'Z';
  }
  function ribbons(parent, list, style) {
    return list.map(o => ({ o, el: s('path', Object.assign({ fill: INK }, style, o.style || {}), parent) }));
  }
  function updRibbons(arr, t, wind) { for (const r of arr) r.el.setAttribute('d', ribbonD(r.o, t, wind)); }

  /* ======================== PERSONAGENS ======================== */

  // KAEN — ronin de cabelo longo, cachecol vermelho, katana.
  function ronin(opt = {}) {
    const W = 320, H = 620;
    const svg = svgRoot(W, H);
    const g = s('g', {}, svg);
    if (opt.flip) g.setAttribute('transform', `translate(${W},0) scale(-1,1)`);
    const back = s('g', {}, g);
    // cachecol (atrás)
    const scarf = ribbons(back, [
      { x: 150, y: 182, a: Math.PI - 0.15, len: 260, w0: 26, w1: 8, grav: 0.25, wx: -0.6, amp: 0.55, freq: 4.2, k: 5, ph: 0 },
      { x: 150, y: 188, a: Math.PI + 0.05, len: 200, w0: 20, w1: 4, grav: 0.4, wx: -0.6, amp: 0.6, freq: 4.6, k: 5, ph: 1.4 },
    ], { fill: RED, stroke: INK, 'stroke-width': 3 });
    // rabo de cavalo
    const pony = ribbons(back, [
      { x: 128, y: 98, a: Math.PI - 0.35, len: 230, w0: 34, w1: 2, grav: 0.9, wx: -0.5, amp: 0.4, freq: 3.2, k: 3.5, ph: 0.6 },
      { x: 130, y: 104, a: Math.PI - 0.2, len: 180, w0: 18, w1: 1, grav: 1.0, wx: -0.5, amp: 0.5, freq: 3.6, k: 4, ph: 2.1 },
    ]);
    // bainha
    s('line', { x1: 205, y1: 318, x2: 30, y2: 392, stroke: INK, 'stroke-width': 13, 'stroke-linecap': 'round' }, g);
    s('line', { x1: 205, y1: 318, x2: 30, y2: 392, stroke: '#3a3a3a', 'stroke-width': 3, 'stroke-dasharray': '4 18' }, g);
    // pernas / hakama
    const legs = s('g', {}, g);
    s('path', { d: 'M108,330 L70,602 L142,602 L158,430 L170,602 L236,602 L200,330 Z', fill: INK }, legs);
    s('path', { d: 'M128,360 L105,590 M180,360 L205,590 M155,345 L157,420', stroke: '#555', 'stroke-width': 3, fill: 'none' }, legs);
    s('path', { d: 'M66,602 L146,602 L146,612 L60,612 Z M166,602 L240,602 L246,612 L166,612 Z', fill: INK }, legs);
    // tronco (respira)
    const torso = s('g', {}, g);
    s('path', { d: 'M100,192 Q154,172 206,192 L214,338 L96,338 Z', fill: PAPER, stroke: INK, 'stroke-width': 5 }, torso);
    s('path', { d: 'M132,186 L154,252 L176,186', fill: 'none', stroke: INK, 'stroke-width': 5 }, torso);
    s('path', { d: 'M100,196 L84,340 L126,340 L134,204 Z M206,196 L222,340 L184,340 L176,204 Z', fill: INK }, torso);
    s('rect', { x: 96, y: 300, width: 118, height: 30, fill: RED, stroke: INK, 'stroke-width': 4 }, torso);
    s('path', { d: 'M110,315 L200,315', stroke: INK, 'stroke-width': 2, 'stroke-dasharray': '6 6' }, torso);
    // braço traseiro
    s('path', { d: 'M110,206 Q92,262 112,312 L134,306 Q120,262 132,214 Z', fill: INK }, torso);
    // cabeça
    const head = s('g', {}, g);
    s('path', { d: 'M140,150 L140,184 L168,184 L166,150 Z', fill: SKIN, stroke: INK, 'stroke-width': 4 }, head);
    s('path', { d: 'M122,112 Q124,72 160,70 Q192,72 196,110 Q198,128 190,140 L184,158 Q172,170 156,166 Q132,160 126,140 Z', fill: SKIN, stroke: INK, 'stroke-width': 4 }, head);
    const eye = s('g', { transform: 'translate(178,116)' }, head);
    const eyeIn = s('path', { d: 'M-12,0 Q0,-7 12,-2 L10,4 Q0,2 -12,3 Z', fill: INK }, eye);
    s('path', { d: 'M-16,-12 L14,-14', stroke: INK, 'stroke-width': 4 }, head);
    s('path', { d: 'M186,140 L196,138', stroke: INK, 'stroke-width': 3 }, head);
    s('path', { d: 'M118,118 Q110,60 160,52 Q206,52 204,104 L196,96 L194,118 L184,92 L176,112 L170,88 L160,106 L150,84 L144,108 L136,96 Z', fill: INK }, head);
    s('rect', { x: 118, y: 74, width: 82, height: 10, fill: RED, transform: 'rotate(-6 160 80)' }, head);
    const bandTails = ribbons(head, [
      { x: 120, y: 82, a: Math.PI + 0.1, len: 120, w0: 10, w1: 4, grav: 0.2, wx: -0.8, amp: 0.7, freq: 5, k: 5, ph: 0.3 },
      { x: 120, y: 84, a: Math.PI + 0.3, len: 95, w0: 9, w1: 3, grav: 0.3, wx: -0.8, amp: 0.8, freq: 5.4, k: 5, ph: 2 },
    ], { fill: RED, stroke: INK, 'stroke-width': 2 });
    const strands = ribbons(head, Array.from({ length: 8 }, (_, i) => ({
      x: 126 + i * 3, y: 70 + i * 9, a: Math.PI - 0.1 + i * 0.06, len: 60 + (i % 3) * 22, w0: 10, w1: 0, grav: 0.4, wx: -0.7, amp: 0.6, freq: 4 + i * 0.3, k: 4, ph: i * 0.9,
    })));
    // braço da frente + espada
    const arm = s('g', {}, g);
    s('path', { d: 'M190,200 Q228,246 236,296 L212,304 Q200,256 176,214 Z', fill: INK }, arm);
    const blade = s('g', { transform: 'translate(226,302)' }, arm);
    const bladeInner = s('g', {}, blade);
    s('path', { d: 'M0,0 L-6,-6 L250,-30 Q270,-30 278,-26 L254,-20 L0,6 Z', fill: '#fff', stroke: INK, 'stroke-width': 3 }, bladeInner);
    const glint = s('path', { d: 'M40,-8 L70,-11', stroke: '#fff', 'stroke-width': 0 }, bladeInner);
    s('line', { x1: -4, y1: 0, x2: -62, y2: 6, stroke: INK, 'stroke-width': 12, 'stroke-linecap': 'round' }, bladeInner);
    s('ellipse', { cx: 0, cy: 0, rx: 5, ry: 14, fill: '#c9a24a', stroke: INK, 'stroke-width': 3 }, bladeInner);
    s('circle', { cx: 226, cy: 302, r: 13, fill: SKIN, stroke: INK, 'stroke-width': 4 }, arm);

    return {
      el: svg, w: W, h: H,
      update(c) {
        const t = c.t, wind = c.wind, v = c.v;
        const br = Math.sin(t * 2.2) * 0.012;
        torso.setAttribute('transform', `translate(0,${338 * -br}) scale(1,${1 + br})`);
        head.setAttribute('transform', `translate(${Math.sin(t * 1.1) * 1.5},${Math.sin(t * 2.2 + 0.5) * 2.5})`);
        const bl = (t % 4.2) < 0.13 ? 0.1 : 1;
        eyeIn.setAttribute('transform', `scale(1,${bl})`);
        updRibbons(scarf, t, wind); updRibbons(pony, t, wind); updRibbons(bandTails, t, wind); updRibbons(strands, t, wind);
        const draw = v.draw || 0;
        arm.setAttribute('transform', `rotate(${-draw * 80} 192 206)`);
        bladeInner.setAttribute('transform', `rotate(${lerp(170, 8, draw)})`);
        blade.style.opacity = draw > 0.02 ? 1 : 0;
        const gl = ((t * 0.6) % 1);
        glint.setAttribute('d', `M${20 + gl * 220},${-4 - gl * 18} l30,-3`);
        glint.setAttribute('stroke-width', draw > 0.5 ? 3 : 0);
      },
    };
  }

  // ONI — o carrasco mascarado.
  function oni(opt = {}) {
    const W = 460, H = 760;
    const svg = svgRoot(W, H);
    const g = s('g', {}, svg);
    if (opt.flip) g.setAttribute('transform', `translate(${W},0) scale(-1,1)`);
    const hair = ribbons(g, Array.from({ length: 16 }, (_, i) => ({
      x: 210 + (i % 5) * 10, y: 120 + (i % 4) * 8, a: -Math.PI / 2 - 1.2 + i * 0.16, len: 120 + (i * 37) % 110, w0: 16, w1: 0, grav: 0.25, wx: 0.6, amp: 0.7, freq: 2.5 + (i % 5) * 0.4, k: 3, ph: i * 1.3,
    })), { fill: '#eee', stroke: INK, 'stroke-width': 3 });
    const cloakTails = ribbons(g, Array.from({ length: 9 }, (_, i) => ({
      x: 90 + i * 34, y: 600, a: Math.PI / 2 + (i - 4) * 0.08, len: 110 + (i % 3) * 40, w0: 46, w1: 0, grav: 0, wx: 0.5, amp: 0.35, freq: 2.4, k: 3, ph: i * 0.8,
    })));
    s('path', { d: 'M150,200 Q230,170 310,200 L410,620 L50,620 Z', fill: INK }, g);
    s('path', { d: 'M180,240 L150,600 M280,240 L320,600 M230,250 L232,610', stroke: '#2b2b2b', 'stroke-width': 6, fill: 'none' }, g);
    s('path', { d: 'M150,200 Q230,260 310,200 L300,236 Q230,300 160,236 Z', fill: RED, stroke: INK, 'stroke-width': 4 }, g);
    // corrente
    const chains = ribbons(g, [
      { x: 120, y: 420, a: Math.PI / 2 + 0.3, len: 220, w0: 8, w1: 6, grav: 0.2, wx: 0.3, amp: 0.25, freq: 2, k: 2, ph: 0, style: { fill: 'none', stroke: '#888', 'stroke-width': 7, 'stroke-dasharray': '10 5' } },
    ]);
    // máscara
    const mask = s('g', {}, g);
    s('path', { d: 'M180,70 L150,10 L196,58 Z M280,70 L312,8 L266,58 Z', fill: PAPER, stroke: INK, 'stroke-width': 4 }, mask);
    s('path', { d: 'M178,64 Q230,30 284,64 L292,150 Q232,200 168,150 Z', fill: RED, stroke: INK, 'stroke-width': 5 }, mask);
    s('path', { d: 'M190,150 L206,170 L218,152 L232,174 L246,152 L258,170 L274,150', fill: PAPER, stroke: INK, 'stroke-width': 3 }, mask);
    s('path', { d: 'M196,92 L224,104 M266,92 L238,104', stroke: INK, 'stroke-width': 6 }, mask);
    const eyes = s('g', {}, mask);
    s('path', { d: 'M198,112 L224,114 L214,124 Z M264,112 L238,114 L248,124 Z', fill: '#ffd23a' }, eyes);
    // arma (naginata)
    const weapon = s('g', {}, g);
    s('line', { x1: 380, y1: 700, x2: 360, y2: 130, stroke: '#3a2a1a', 'stroke-width': 12 }, weapon);
    s('path', { d: 'M360,130 Q330,40 380,-20 Q378,60 372,130 Z', fill: '#fff', stroke: INK, 'stroke-width': 4 }, weapon);
    s('circle', { cx: 368, cy: 360, r: 22, fill: INK }, weapon);
    s('circle', { cx: 368, cy: 360, r: 9, fill: PAPER }, weapon);
    return {
      el: svg, w: W, h: H,
      update(c) {
        const t = c.t, wind = c.wind;
        updRibbons(hair, t, wind); updRibbons(cloakTails, t, wind); updRibbons(chains, t, wind);
        mask.setAttribute('transform', `translate(0,${Math.sin(t * 1.4) * 3}) rotate(${Math.sin(t * 0.7) * 2} 230 110)`);
        eyes.style.opacity = 0.6 + Math.abs(Math.sin(t * 3)) * 0.4 + (c.v.rage || 0);
        eyes.style.filter = `drop-shadow(0 0 ${6 + (c.v.rage || 0) * 20}px #ffcc00)`;
        weapon.setAttribute('transform', `rotate(${Math.sin(t * 0.9) * 2 + (c.v.swing || 0) * -40} 368 360)`);
      },
    };
  }

  // HINA — sacerdotisa com lanterna.
  function miko(opt = {}) {
    const W = 300, H = 600;
    const svg = svgRoot(W, H);
    const g = s('g', {}, svg);
    if (opt.flip) g.setAttribute('transform', `translate(${W},0) scale(-1,1)`);
    const hair = ribbons(g, Array.from({ length: 10 }, (_, i) => ({
      x: 130 + i * 3, y: 90 + i * 4, a: Math.PI / 2 + 0.35 - i * 0.02, len: 300 + (i % 3) * 30, w0: 24, w1: 4, grav: 0.2, wx: -0.35, amp: 0.22, freq: 1.6 + i * 0.1, k: 3, ph: i * 0.7,
    })));
    s('path', { d: 'M110,320 L80,592 L224,592 L196,320 Z', fill: RED, stroke: INK, 'stroke-width': 4 }, g);
    s('path', { d: 'M130,340 L118,585 M176,340 L190,585 M153,330 L153,590', stroke: '#8d0c10', 'stroke-width': 3 }, g);
    const torso = s('g', {}, g);
    s('path', { d: 'M108,180 Q152,164 196,180 L200,326 L104,326 Z', fill: '#fff', stroke: INK, 'stroke-width': 4 }, torso);
    s('path', { d: 'M132,176 L152,240 L172,176', fill: 'none', stroke: RED, 'stroke-width': 5 }, torso);
    const sleeves = ribbons(torso, [
      { x: 112, y: 200, a: Math.PI / 2 + 0.25, len: 200, w0: 70, w1: 60, grav: 0.1, wx: -0.4, amp: 0.15, freq: 1.8, k: 2, ph: 0, style: { fill: '#fff', stroke: INK, 'stroke-width': 4 } },
    ]);
    const head = s('g', {}, g);
    s('path', { d: 'M126,108 Q128,66 160,64 Q190,66 192,104 Q194,124 186,138 Q172,160 152,156 Q130,150 128,132 Z', fill: SKIN, stroke: INK, 'stroke-width': 4 }, head);
    const eye = s('path', { d: 'M168,110 Q176,104 184,110 Q176,116 168,110 Z', fill: INK }, head);
    s('path', { d: 'M120,120 Q108,52 162,46 Q208,48 200,108 L190,84 Q170,98 150,80 Q140,96 124,100 Z', fill: INK }, head);
    s('circle', { cx: 132, cy: 74, r: 10, fill: RED, stroke: INK, 'stroke-width': 3 }, head);
    const lantern = s('g', {}, g);
    s('line', { x1: 214, y1: 300, x2: 220, y2: 360, stroke: INK, 'stroke-width': 3 }, lantern);
    const glow = s('circle', { cx: 220, cy: 400, r: 70, fill: 'url(#lanternGlow)' }, lantern);
    s('rect', { x: 196, y: 360, width: 48, height: 74, rx: 20, fill: '#ffe7a8', stroke: INK, 'stroke-width': 4 }, lantern);
    s('path', { d: 'M200,384 L240,384 M200,410 L240,410', stroke: RED, 'stroke-width': 3 }, lantern);
    s('path', { d: 'M196,300 Q206,320 216,300 L214,316 Z', fill: SKIN, stroke: INK, 'stroke-width': 3 }, g);
    return {
      el: svg, w: W, h: H,
      update(c) {
        const t = c.t, wind = c.wind;
        updRibbons(hair, t, wind); updRibbons(sleeves, t, wind);
        const br = Math.sin(t * 2) * 0.01;
        torso.setAttribute('transform', `translate(0,${326 * -br}) scale(1,${1 + br})`);
        head.setAttribute('transform', `translate(0,${Math.sin(t * 2 + 0.4) * 2})`);
        eye.setAttribute('transform', (t % 3.7) < 0.12 ? 'translate(0,110) scale(1,0.1) translate(0,-110)' : '');
        lantern.setAttribute('transform', `rotate(${Math.sin(t * 1.6) * 6} 214 300)`);
        glow.setAttribute('r', 62 + Math.sin(t * 9) * 4 + Math.sin(t * 23) * 3);
      },
    };
  }

  /* ======================== CENÁRIO ======================== */

  function sun(opt = {}) {
    const r = opt.r || 260, W = r * 2 + 40;
    const svg = svgRoot(W, W);
    const c = s('circle', { cx: W / 2, cy: W / 2, r, fill: opt.color || RED, filter: 'url(#rough)' }, svg);
    const tex = s('g', { opacity: 0.18 }, svg);
    for (let i = 0; i < 9; i++) s('ellipse', { cx: W / 2, cy: W / 2, rx: r * (0.2 + i * 0.09), ry: r * (0.18 + i * 0.085), fill: 'none', stroke: INK, 'stroke-width': 3, filter: 'url(#rough)' }, tex);
    return { el: svg, w: W, h: W, update(x) { tex.setAttribute('transform', `rotate(${x.t * 6} ${W / 2} ${W / 2})`); c.setAttribute('r', r * (1 + Math.sin(x.t * 1.3) * 0.008)); } };
  }

  function moon(opt = {}) {
    const r = opt.r || 120, W = r * 2 + 120;
    const svg = svgRoot(W, W);
    s('circle', { cx: W / 2, cy: W / 2, r: r + 50, fill: 'url(#moonGlow)' }, svg);
    s('circle', { cx: W / 2, cy: W / 2, r, fill: opt.color || '#f6f1e3', stroke: INK, 'stroke-width': 3 }, svg);
    s('path', { d: `M${W / 2 - r * 0.4},${W / 2 - r * 0.2} q20,-14 40,0 M${W / 2 + r * 0.2},${W / 2 + r * 0.3} q16,-10 30,4`, stroke: '#bbb', 'stroke-width': 4, fill: 'none' }, svg);
    return { el: svg, w: W, h: W };
  }

  function clouds(opt = {}) {
    const W = opt.w || 900, H = opt.h || 260;
    const svg = svgRoot(W, H);
    const groups = [];
    const n = opt.n || 4;
    for (let k = 0; k < n; k++) {
      const gg = s('g', {}, svg);
      const cx = (W / n) * k + 60, base = H - 30 - (k % 2) * 30;
      for (let i = 0; i < 6; i++) {
        const rr = 34 + ((i * 17 + k * 11) % 30);
        s('circle', { cx: cx + i * 34, cy: base - Math.sin(i / 5 * Math.PI) * 50, r: rr, fill: opt.fill || '#fff', stroke: INK, 'stroke-width': 4 }, gg);
      }
      s('rect', { x: cx - 30, y: base, width: 250, height: 40, fill: opt.fill || '#fff' }, gg);
      groups.push(gg);
    }
    return { el: svg, w: W, h: H, update(c) { groups.forEach((gg, i) => gg.setAttribute('transform', `translate(${Math.sin(c.t * 0.3 + i) * 18},${Math.sin(c.t * 0.5 + i * 2) * 4})`)); } };
  }

  function mountains(opt = {}) {
    const W = opt.w || 1800, H = opt.h || 500;
    const svg = svgRoot(W, H);
    const cols = opt.colors || ['#cfc8bb', '#9b958a', '#4a4743'];
    cols.forEach((col, k) => {
      let d = `M0,${H}`;
      const peaks = 6 + k * 2, base = H * (0.25 + k * 0.22);
      for (let i = 0; i <= peaks; i++) {
        const x = (W / peaks) * i, y = base + ((i * 53 + k * 31) % 90) - (i % 2 ? 0 : 70);
        d += ` L${x},${y}`;
      }
      d += ` L${W},${H} Z`;
      s('path', { d, fill: col, stroke: INK, 'stroke-width': 3, filter: 'url(#rough)' }, svg);
    });
    return { el: svg, w: W, h: H };
  }

  function grass(opt = {}) {
    const W = opt.w || 1800, H = opt.h || 160, n = opt.n || 90;
    const svg = svgRoot(W, H);
    s('rect', { x: 0, y: H - 30, width: W, height: 40, fill: opt.ground || INK }, svg);
    const blades = [];
    for (let i = 0; i < n; i++) {
      const x = (W / n) * i + ((i * 37) % 13), h = 50 + ((i * 71) % 90);
      blades.push({ x, h, ph: i * 0.37, el: s('path', { fill: opt.color || INK }, svg) });
    }
    return {
      el: svg, w: W, h: H,
      update(c) {
        for (const b of blades) {
          const bend = Math.sin(c.t * 2 + b.ph + b.x * 0.004) * 14 * (0.6 + c.wind * 0.6) - c.wind * 10;
          b.el.setAttribute('d', `M${b.x - 4},${H - 25} Q${b.x + bend * 0.4},${H - 25 - b.h * 0.6} ${b.x + bend},${H - 25 - b.h} Q${b.x + bend * 0.4 + 2},${H - 25 - b.h * 0.6} ${b.x + 4},${H - 25} Z`);
        }
      },
    };
  }

  function bamboo(opt = {}) {
    const W = opt.w || 1800, H = opt.h || 1000, n = opt.n || 14;
    const svg = svgRoot(W, H);
    const stalks = [];
    for (let i = 0; i < n; i++) {
      const x = (W / n) * i + ((i * 47) % 60), w = 18 + ((i * 13) % 20);
      const gg = s('g', {}, svg);
      s('rect', { x: x - w / 2, y: 0, width: w, height: H, fill: opt.color || INK }, gg);
      for (let y = 80 + (i * 29) % 100; y < H; y += 160) s('rect', { x: x - w / 2 - 3, y, width: w + 6, height: 6, fill: opt.node || '#555' }, gg);
      for (let k = 0; k < 3; k++) {
        const ly = 120 + k * 260 + (i * 31) % 80;
        s('path', { d: `M${x},${ly} q${40 + k * 10},-10 ${90},${20} q-50,0 -90,-20 Z`, fill: opt.color || INK }, gg);
      }
      stalks.push({ gg, x, ph: i * 0.8 });
    }
    return { el: svg, w: W, h: H, update(c) { for (const st of stalks) st.gg.setAttribute('transform', `rotate(${Math.sin(c.t * 0.8 + st.ph) * 1.2 * (0.5 + c.wind)} ${st.x} ${H})`); } };
  }

  function torii(opt = {}) {
    const W = 600, H = 520;
    const svg = svgRoot(W, H);
    const col = opt.color || RED;
    s('path', { d: 'M20,40 Q300,0 580,40 L570,74 Q300,40 30,74 Z', fill: INK }, svg);
    s('rect', { x: 70, y: 110, width: 460, height: 30, fill: col, stroke: INK, 'stroke-width': 4 }, svg);
    s('rect', { x: 120, y: 60, width: 40, height: 460, fill: col, stroke: INK, 'stroke-width': 4 }, svg);
    s('rect', { x: 440, y: 60, width: 40, height: 460, fill: col, stroke: INK, 'stroke-width': 4 }, svg);
    s('rect', { x: 280, y: 70, width: 40, height: 40, fill: INK }, svg);
    const rope = s('path', { fill: 'none', stroke: '#e8dcc0', 'stroke-width': 10 }, svg);
    return { el: svg, w: W, h: H, update(c) { const sg = 24 + Math.sin(c.t * 1.5) * 6; rope.setAttribute('d', `M160,170 Q300,${170 + sg * 2} 440,170`); } };
  }

  function waves(opt = {}) {
    const W = opt.w || 1800, H = opt.h || 360, rows = opt.rows || 4;
    const svg = svgRoot(W, H);
    const paths = [];
    for (let r = 0; r < rows; r++) paths.push(s('path', { fill: r % 2 ? (opt.c2 || '#1b2a3a') : (opt.c1 || INK), stroke: '#e9e4d8', 'stroke-width': 3 }, svg));
    return {
      el: svg, w: W, h: H,
      update(c) {
        paths.forEach((p, r) => {
          const base = 40 + r * (H / rows);
          let d = `M0,${H}`;
          for (let x = 0; x <= W; x += 30) {
            const y = base + Math.sin(x * 0.012 + c.t * (1.2 + r * 0.3) + r) * (18 + r * 4) * (0.7 + c.wind * 0.6) + Math.sin(x * 0.03 - c.t * 2) * 5;
            d += ` L${x},${y.toFixed(1)}`;
          }
          p.setAttribute('d', d + ` L${W},${H} Z`);
        });
      },
    };
  }

  function birds(opt = {}) {
    const W = 600, H = 300, n = opt.n || 6;
    const svg = svgRoot(W, H);
    const bs = Array.from({ length: n }, (_, i) => ({ x: 60 + i * 80 + (i % 2) * 20, y: 80 + ((i * 53) % 120), ph: i, el: s('path', { fill: 'none', stroke: INK, 'stroke-width': 4, 'stroke-linecap': 'round' }, svg) }));
    return { el: svg, w: W, h: H, update(c) { for (const b of bs) { const f = Math.sin(c.t * 8 + b.ph) * 14; const x = b.x + ((c.t * 30 + b.ph * 40) % 200) - 100; b.el.setAttribute('d', `M${x - 22},${b.y - f} Q${x - 10},${b.y - 4} ${x},${b.y} Q${x + 10},${b.y - 4} ${x + 22},${b.y - f}`); } } };
  }

  // Close dos olhos (estilo quadro de tensão).
  function eyes(opt = {}) {
    const W = 1200, H = 360;
    const svg = svgRoot(W, H);
    s('rect', { x: 0, y: 0, width: W, height: H, fill: SKIN }, svg);
    for (let i = 0; i < 40; i++) s('line', { x1: i * 30, y1: 0, x2: i * 30 + 40, y2: H, stroke: '#d8cfbf', 'stroke-width': 2 }, svg);
    const parts = [];
    [[360, 1], [840, -1]].forEach(([cx, dir]) => {
      const gg = s('g', {}, svg);
      s('path', { d: `M${cx - 190},${120} Q${cx},${40 - 20} ${cx + 190},${110}`, stroke: INK, 'stroke-width': 26, fill: 'none', 'stroke-linecap': 'round', transform: dir < 0 ? `translate(${cx * 2},0) scale(-1,1)` : '' }, svg);
      const lid = s('g', {}, gg);
      s('path', { d: `M${cx - 160},${200} Q${cx},${110} ${cx + 160},${196} Q${cx},${260} ${cx - 160},${200} Z`, fill: '#fff', stroke: INK, 'stroke-width': 8 }, lid);
      const iris = s('g', {}, lid);
      s('circle', { cx, cy: 196, r: 52, fill: opt.iris || '#b5864c', stroke: INK, 'stroke-width': 6 }, iris);
      s('circle', { cx, cy: 196, r: 22, fill: INK }, iris);
      s('circle', { cx: cx + 16, cy: 178, r: 10, fill: '#fff' }, iris);
      s('path', { d: `M${cx - 170},${200} Q${cx},${100} ${cx + 170},${192}`, stroke: INK, 'stroke-width': 14, fill: 'none' }, lid);
      parts.push({ lid, iris, cx });
    });
    return {
      el: svg, w: W, h: H,
      update(c) {
        const shake = (c.v.shake || 0) * 6;
        const bl = (c.t % 3.2) < 0.12 ? 0.08 : 1;
        for (const pt of parts) {
          pt.lid.setAttribute('transform', `translate(0,196) scale(1,${bl}) translate(0,-196)`);
          pt.iris.setAttribute('transform', `translate(${Math.sin(c.t * 0.7) * 14 + (Math.random() - 0.5) * shake},${(Math.random() - 0.5) * shake})`);
        }
      },
    };
  }

  // Mão que se estende (close dramático).
  function hand(opt = {}) {
    const W = 700, H = 360;
    const svg = svgRoot(W, H);
    const g = s('g', {}, svg);
    s('path', { d: 'M700,210 L420,170 L420,250 L700,300 Z', fill: PAPER, stroke: INK, 'stroke-width': 6 }, g);
    for (let i = 0; i < 5; i++) s('circle', { cx: 640 - i * 2, cy: 220 + i * 18, r: 10, fill: 'none', stroke: INK, 'stroke-width': 4 }, g);
    s('path', { d: 'M640,206 L640,300', stroke: INK, 'stroke-width': 10 }, g);
    s('path', { d: 'M430,170 Q340,150 300,180 Q270,210 290,240 Q330,260 430,250 Z', fill: SKIN, stroke: INK, 'stroke-width': 6 }, g);
    const fingers = [];
    [[300, 182, -2.6], [292, 200, -2.9], [292, 222, 3.0], [300, 240, 2.7]].forEach(([x, y, a], i) => {
      const f = s('path', { fill: SKIN, stroke: INK, 'stroke-width': 5 }, g);
      fingers.push({ x, y, a, i, f });
    });
    s('path', { d: 'M360,170 Q330,120 290,110 Q300,140 340,180 Z', fill: SKIN, stroke: INK, 'stroke-width': 5 }, g);
    return {
      el: svg, w: W, h: H,
      update(c) {
        const curl = (c.v.curl || 0) + Math.sin(c.t * 2) * 0.05;
        for (const fg of fingers) {
          const a = fg.a + (fg.a < 0 ? curl : -curl) * 0.8, L = 70 - fg.i * 4;
          const x2 = fg.x + Math.cos(a) * L, y2 = fg.y + Math.sin(a) * L * 0.5;
          const x3 = x2 + Math.cos(a + (fg.a < 0 ? curl * 1.6 : -curl * 1.6)) * 34, y3 = y2 + Math.sin(a + (fg.a < 0 ? curl * 1.6 : -curl * 1.6)) * 34;
          fg.f.setAttribute('d', `M${fg.x},${fg.y - 9} L${x2},${y2 - 7} L${x3},${y3} L${x2},${y2 + 7} L${fg.x},${fg.y + 9} Z`);
        }
      },
    };
  }

  // Silhueta de cidade (para manga moderno).
  function city(opt = {}) {
    const W = opt.w || 1800, H = opt.h || 600;
    const svg = svgRoot(W, H);
    const lights = [];
    let x = 0, i = 0;
    while (x < W) {
      const bw = 60 + ((i * 37) % 90), bh = 180 + ((i * 113) % 380);
      s('rect', { x, y: H - bh, width: bw, height: bh, fill: opt.color || INK }, svg);
      for (let wy = H - bh + 20; wy < H - 20; wy += 26) for (let wx = x + 10; wx < x + bw - 12; wx += 18) {
        if (((wx * 7 + wy * 3) | 0) % 5 === 0) lights.push(s('rect', { x: wx, y: wy, width: 8, height: 12, fill: opt.light || '#ffd86b' }, svg));
      }
      x += bw + 6; i++;
    }
    return { el: svg, w: W, h: H, update(c) { if (Math.random() < 0.08) { const l = lights[(Math.random() * lights.length) | 0]; if (l) l.style.opacity = Math.random() < 0.5 ? 0.2 : 1; } } };
  }

  // Raio.
  function lightning(opt = {}) {
    const W = 400, H = 900;
    const svg = svgRoot(W, H);
    const bolt = s('path', { fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-linejoin': 'bevel', filter: 'url(#glowWhite)' }, svg);
    let next = 0;
    return {
      el: svg, w: W, h: H,
      update(c) {
        if (c.t > next) {
          let x = 200, d = `M${x},0`;
          for (let y = 60; y <= H; y += 60) { x += (Math.random() - 0.5) * 120; d += ` L${x.toFixed(0)},${y}`; }
          bolt.setAttribute('d', d);
          next = c.t + 0.08 + Math.random() * 0.25;
        }
        bolt.style.opacity = Math.random() < (c.v.strike == null ? 0.5 : c.v.strike) ? 1 : 0;
      },
    };
  }

  // Bloco de cor / forma simples.
  function block(opt = {}) {
    const W = opt.w || 400, H = opt.h || 300;
    const svg = svgRoot(W, H);
    s('rect', { x: 0, y: 0, width: W, height: H, fill: opt.fill || RED, filter: opt.rough ? 'url(#rough)' : null }, svg);
    return { el: svg, w: W, h: H };
  }

  // Colunas (salão do templo).
  function pillars(opt = {}) {
    const W = opt.w || 1800, H = opt.h || 900, n = opt.n || 9;
    const svg = svgRoot(W, H);
    s('rect', { x: 0, y: 0, width: W, height: H, fill: opt.bg || RED }, svg);
    for (let i = 0; i < n; i++) {
      const x = (W / n) * i + 40;
      s('rect', { x, y: 0, width: 44, height: H, fill: INK, filter: 'url(#rough)' }, svg);
      for (let k = 0; k < 6; k++) s('line', { x1: x + 20 + ((k * 31) % 60), y1: k * 160, x2: x + 26 + ((k * 31) % 60), y2: k * 160 + 120, stroke: INK, 'stroke-width': 3 }, svg);
    }
    s('rect', { x: 0, y: H - 120, width: W, height: 120, fill: INK }, svg);
    return { el: svg, w: W, h: H };
  }

  // Velas com chama tremulando.
  function candles(opt = {}) {
    const W = 260, H = 160, n = opt.n || 3;
    const svg = svgRoot(W, H);
    s('rect', { x: 10, y: 120, width: 240, height: 20, fill: INK }, svg);
    s('rect', { x: 30, y: 140, width: 12, height: 20, fill: INK }, svg);
    s('rect', { x: 218, y: 140, width: 12, height: 20, fill: INK }, svg);
    const flames = [];
    for (let i = 0; i < n; i++) {
      const x = 90 + i * 40;
      s('rect', { x: x - 8, y: 70, width: 16, height: 50, fill: PAPER, stroke: INK, 'stroke-width': 3 }, svg);
      flames.push({ x, el: s('path', { fill: '#ffcc33', stroke: '#e0541b', 'stroke-width': 2 }, svg) });
    }
    return { el: svg, w: W, h: H, update(c) { flames.forEach((f, i) => { const h = 26 + Math.sin(c.t * 13 + i * 2) * 5, sw = Math.sin(c.t * 7 + i) * 4; f.el.setAttribute('d', `M${f.x - 7},68 Q${f.x - 8},${60 - h / 2} ${f.x + sw},${66 - h} Q${f.x + 8},${60 - h / 2} ${f.x + 7},68 Z`); }); } };
  }

  // Espírito flutuante (manga 2).
  function spirit(opt = {}) {
    const W = 220, H = 300;
    const svg = svgRoot(W, H);
    const tail = ribbons(svg, [{ x: 110, y: 130, a: Math.PI / 2, len: 160, w0: 110, w1: 0, grav: 0, wx: 0.4, amp: 0.5, freq: 2, k: 3, ph: 0, style: { fill: 'rgba(255,255,255,.85)', stroke: INK, 'stroke-width': 3 } }]);
    s('circle', { cx: 110, cy: 110, r: 60, fill: 'rgba(255,255,255,.9)', stroke: INK, 'stroke-width': 4 }, svg);
    const eyesG = s('g', {}, svg);
    s('ellipse', { cx: 88, cy: 104, rx: 8, ry: 14, fill: INK }, eyesG);
    s('ellipse', { cx: 132, cy: 104, rx: 8, ry: 14, fill: INK }, eyesG);
    s('path', { d: 'M96,134 Q110,146 124,134', stroke: INK, 'stroke-width': 4, fill: 'none' }, svg);
    return { el: svg, w: W, h: H, update(c) { updRibbons(tail, c.t, c.wind); svg.style.transform = `translateY(${Math.sin(c.t * 1.5 + (opt.ph || 0)) * 16}px)`; eyesG.setAttribute('transform', (c.t + (opt.ph || 0)) % 3 < 0.12 ? 'translate(0,104) scale(1,.1) translate(0,-104)' : ''); } };
  }

  // Barco (manga 3).
  function boat(opt = {}) {
    const W = 520, H = 420;
    const svg = svgRoot(W, H);
    const sail = s('path', { fill: PAPER, stroke: INK, 'stroke-width': 5 }, svg);
    s('line', { x1: 250, y1: 20, x2: 250, y2: 320, stroke: INK, 'stroke-width': 10 }, svg);
    s('path', { d: 'M30,300 L490,300 L430,380 L90,380 Z', fill: INK }, svg);
    s('path', { d: 'M60,320 L460,320', stroke: '#444', 'stroke-width': 4 }, svg);
    const flag = ribbons(svg, [{ x: 250, y: 26, a: Math.PI, len: 110, w0: 30, w1: 22, grav: 0.1, wx: -0.5, amp: 0.6, freq: 6, k: 4, ph: 0, style: { fill: RED, stroke: INK, 'stroke-width': 3 } }]);
    return {
      el: svg, w: W, h: H,
      update(c) {
        updRibbons(flag, c.t, c.wind);
        const b = 30 + Math.sin(c.t * 2) * 10 + c.wind * 15;
        sail.setAttribute('d', `M256,40 Q${256 + 120 + b},160 256,290 L256,40 Z`);
        svg.style.transform = `rotate(${Math.sin(c.t * 1.3) * 4}deg) translateY(${Math.sin(c.t * 1.7) * 8}px)`;
        svg.style.transformOrigin = '50% 90%';
      },
    };
  }

  // Imagem externa (para mangás reais com camadas recortadas).
  function image(opt = {}) {
    const img = new Image();
    img.src = opt.src; img.draggable = false;
    img.style.width = (opt.w || 400) + 'px';
    if (opt.h) img.style.height = opt.h + 'px';
    return { el: img, w: opt.w || 400, h: opt.h || 400 };
  }

  // Vídeo em loop (ex.: quadro animado por IA).
  function video(opt = {}) {
    const v = document.createElement('video');
    Object.assign(v, { src: opt.src, muted: true, loop: true, autoplay: true, playsInline: true });
    v.style.width = (opt.w || 800) + 'px';
    return { el: v, w: opt.w || 800, h: opt.h || 450 };
  }

  // Definições globais de filtros SVG.
  function installDefs() {
    if (document.getElementById('mm-defs')) return;
    const svg = s('svg', { id: 'mm-defs', width: 0, height: 0, style: 'position:absolute' });
    svg.innerHTML = `
      <defs>
        <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="12"/>
        </filter>
        <filter id="glowWhite" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="lanternGlow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".9"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
        <radialGradient id="moonGlow"><stop offset=".6" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      </defs>`;
    document.body.appendChild(svg);
  }

  window.MMArt = { ronin, oni, miko, sun, moon, clouds, mountains, grass, bamboo, torii, waves, birds, eyes, hand, city, lightning, block, pillars, candles, spirit, boat, image, video, installDefs };
})();
