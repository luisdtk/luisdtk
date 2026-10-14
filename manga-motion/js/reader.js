/* Leitor: carrega o mangá/capítulo da URL e monta as páginas animadas. */
(function () {
  const params = new URLSearchParams(location.search);
  const id = params.get('m') || 'lamina';
  const chap = Math.max(1, parseInt(params.get('c') || '1', 10));
  const meta = window.MMCatalog.find(m => m.id === id);
  const root = document.getElementById('chapter');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  if (!meta) { root.innerHTML = '<div class="chapter-end"><div><h2>Obra não encontrada</h2><a class="btn" href="index.html">Biblioteca</a></div></div>'; return; }

  // Carrega o arquivo da obra sob demanda (funciona até abrindo direto do disco).
  const sc = document.createElement('script');
  sc.src = `data/manga/${encodeURIComponent(id)}.js`;
  sc.onload = start;
  sc.onerror = () => { root.innerHTML = '<div class="chapter-end"><div><h2>Falha ao carregar</h2></div></div>'; };
  document.body.appendChild(sc);

  function start() {
    window.scrollTo(0, 0);
    const book = window.MMDB[id];
    const ch = book.chapters[chap - 1];
    if (!ch) { root.innerHTML = '<div class="chapter-end"><div><h2>Capítulo indisponível</h2><a class="btn" href="index.html">Biblioteca</a></div></div>'; return; }
    document.title = `${book.title} · ${ch.title}`;
    document.getElementById('ttl').innerHTML = `${esc(book.title)}<small>${esc(ch.title)}</small>`;
    try { const h = JSON.parse(localStorage.getItem('mm-history') || '{}'); h[id] = chap; localStorage.setItem('mm-history', JSON.stringify(h)); } catch (e) {}

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prog = document.getElementById('prog'), bar = document.getElementById('bar'), hint = document.getElementById('hint');
    let lastY = 0;
    const engine = MMEngine.mount(root, ch.pages, {
      reduced,
      onProgress(total, st) {
        prog.style.width = (total * 100).toFixed(2) + '%';
        if (st.cur > 40) hint.style.opacity = 0;
        const y = window.scrollY;
        bar.classList.toggle('hide', y > lastY + 4 && y > 200);
        if (y < lastY - 4) bar.classList.remove('hide');
        lastY = y;
      },
    });

    const hasNext = chap < book.chapters.length;
    const end = document.createElement('section');
    end.className = 'chapter-end';
    end.innerHTML = `<div><h2>Fim do ${esc(ch.title.split('—')[0].trim())}</h2>
      <p>${esc(book.title)}</p>
      ${hasNext ? `<a class="btn" href="reader.html?m=${encodeURIComponent(id)}&c=${chap + 1}">PRÓXIMO CAPÍTULO →</a>` : '<p>Novos capítulos em breve.</p>'}
      <a class="btn ghost" href="index.html?m=${encodeURIComponent(id)}">CAPÍTULOS</a>
      <a class="btn ghost" href="index.html">BIBLIOTECA</a></div>`;
    root.appendChild(end);
    engine.relayout();

    const btn = document.getElementById('motion');
    let on = !reduced;
    const sync = () => { btn.textContent = 'Motion: ' + (on ? 'ON' : 'OFF'); btn.classList.toggle('on', on); engine.setReduced(!on); };
    btn.onclick = () => { on = !on; sync(); };
    sync();
  }
})();
