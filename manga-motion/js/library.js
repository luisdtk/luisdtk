/* Biblioteca: destaque, continuar lendo, filtros por gênero, busca e página da obra. */
(function () {
  const app = document.getElementById('app');
  const q = document.getElementById('q');
  const params = new URLSearchParams(location.search);
  const cat = window.MMCatalog;
  let genre = 'Todos';

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const readerUrl = (id, c) => `reader.html?m=${encodeURIComponent(id)}&c=${c}`;
  function history() { try { return JSON.parse(localStorage.getItem('mm-history') || '{}'); } catch (e) { return {}; } }

  function card(m) {
    return `<a class="card" href="?m=${encodeURIComponent(m.id)}">
      <div class="cover-scene" data-cover="${esc(m.id)}"><span class="badge">MOTION</span></div>
      <div class="meta"><span class="tag">${esc(m.genres[0])}</span>
        <h3>${esc(m.title)}</h3><div class="sub">${m.chapters.length} cap. · ${esc(m.status)}</div></div>
    </a>`;
  }

  function mountCovers() {
    app.querySelectorAll('[data-cover]').forEach(el => {
      const m = cat.find(x => x.id === el.dataset.cover);
      if (m && !el.dataset.done) { el.dataset.done = 1; MMEngine.cover(el, m.cover); }
    });
  }

  function renderHome() {
    const term = q.value.trim().toLowerCase();
    const feat = cat.find(m => m.featured) || cat[0];
    const genres = ['Todos', ...new Set(cat.flatMap(m => m.genres))];
    const list = cat.filter(m => (genre === 'Todos' || m.genres.includes(genre)) &&
      (!term || [m.title, m.author, ...m.genres].join(' ').toLowerCase().includes(term)));
    const h = history();
    const cont = Object.keys(h).map(id => ({ m: cat.find(x => x.id === id), c: h[id] })).filter(x => x.m);

    app.innerHTML = `
      ${term ? '' : `<section class="hero">
        <div class="cover-scene" data-cover="${esc(feat.id)}"></div>
        <div class="hero-info"><span class="tag">Destaque</span><span class="tag">${esc(feat.genres.join(' · '))}</span>
          <h1>${esc(feat.title)}</h1><p>${esc(feat.synopsis)}</p>
          <a class="btn" href="${readerUrl(feat.id, 1)}">LER AGORA</a></div>
      </section>`}
      ${cont.length && !term ? `<section class="section"><h2>Continuar lendo</h2><div class="continue">
        ${cont.map(x => `<a href="${readerUrl(x.m.id, x.c)}">${esc(x.m.title)} · cap. ${x.c}</a>`).join('')}</div></section>` : ''}
      <section class="section">
        <h2>Biblioteca <small>${list.length} obra(s)</small></h2>
        <div class="chips">${genres.map(g => `<button class="chip ${g === genre ? 'on' : ''}" data-g="${esc(g)}">${esc(g)}</button>`).join('')}</div>
        <div class="grid">${list.map(card).join('') || '<p class="empty">Nada encontrado.</p>'}</div>
      </section>`;
    app.querySelectorAll('.chip').forEach(b => b.onclick = () => { genre = b.dataset.g; renderHome(); });
    mountCovers();
  }

  function renderDetail(m) {
    document.title = `${m.title} — Motion Mangá`;
    app.innerHTML = `<section class="section"><div class="detail">
      <div class="cover-scene" data-cover="${esc(m.id)}"></div>
      <div><span class="tag">${esc(m.genres.join(' · '))}</span>
        <h1 style="font-family:'Noto Serif JP',serif;font-size:clamp(32px,5vw,56px);margin:8px 0">${esc(m.title)}</h1>
        <p class="sub" style="color:var(--muted)">${esc(m.author)} · ${esc(m.status)}</p>
        <p style="line-height:1.6;max-width:640px">${esc(m.synopsis)}</p>
        <a class="btn" href="${readerUrl(m.id, 1)}">LER CAPÍTULO 1</a> <a class="btn ghost" href="index.html">VOLTAR</a>
        <h2 style="margin-top:32px;font-family:'Noto Serif JP',serif">Capítulos</h2>
        <div class="chapters">${m.chapters.map((c, i) => `<a href="${readerUrl(m.id, i + 1)}"><span>${esc(c)}</span><span>→</span></a>`).join('')}</div>
      </div></div></section>`;
    mountCovers();
  }

  const m = params.get('m') && cat.find(x => x.id === params.get('m'));
  if (m) { renderDetail(m); q.onkeydown = e => { if (e.key === 'Enter') location.href = 'index.html'; }; }
  else { renderHome(); q.oninput = renderHome; }
})();
