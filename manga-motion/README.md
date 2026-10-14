# Motion Mangá

Site para ler mangá com **animação guiada pelo scroll**. Cada página ocupa a tela inteira e, conforme a pessoa rola para baixo, a cena ganha movimento: o cabelo e a roupa balançam com o vento, os personagens respiram e piscam, a espada é sacada, a câmera faz zoom e tremor, os quadros se revelam, e aparecem efeitos como brasas, chuva, vaga-lumes, linhas de velocidade e transições com manchas de tinta. Os balões e as narrações entram no momento certo da leitura.

> Rolar mais rápido aumenta o vento: cabelos, cachecóis e capas reagem à velocidade do scroll.

## Rodando

Não precisa de build. Basta servir a pasta:

```bash
cd manga-motion
python3 -m http.server 8000
# abra http://localhost:8000
```

Também funciona abrindo `index.html` direto no navegador. Para publicar, pode usar GitHub Pages, Netlify ou Vercel, apontando para a pasta `manga-motion/`.

## Estrutura

```
index.html          Biblioteca: destaque, busca, filtros por gênero, continuar lendo, página da obra
reader.html         Leitor (reader.html?m=<id>&c=<capítulo>)
js/engine.js        Motor: palco sticky, keyframes por scroll, câmera, quadros, textos, efeitos em canvas
js/art.js           Personagens e cenários vetoriais animados (cabelo, roupas, armas, olhos, efeitos)
data/catalog.js     Lista de obras da biblioteca
data/manga/<id>.js  Capítulos e páginas de cada obra
```

## Adicionando um mangá

1. Crie `data/manga/minhaobra.js`:

```js
(window.MMDB = window.MMDB || {}).minhaobra = {
  title: 'Minha Obra',
  chapters: [{
    title: 'Cap. 1 — Início',
    pages: [{
      len: 3,                 // quantas telas de scroll a página dura
      bg: '#f3eee4', wind: 1, // cor de fundo e vento base
      cam: [[0, { s: 1.2 }], [1, { s: 1 }]],          // câmera: zoom/pan/rotação/tremor
      layers: [
        { art: 'sun', x: 800, y: 400, k: [[0, { y: 100 }], [1, { y: 0 }]] },
        { art: 'ronin', x: 800, y: 860, k: [[0.4, { draw: 0 }], [0.6, { draw: 1 }]] },
        { art: 'image', opt: { src: 'img/cap1/cabelo.png', w: 600 }, x: 800, y: 300 },
        { panel: [70, 60, 700, 400], reveal: [0, 0.2, 'left'], bg: '#fff', layers: [ /* ... */ ] },
        { sfx: 'ZAN!!', size: 200, x: 1200, y: 300, k: [[0.5, { o: 0, s: 2 }], [0.6, { o: 1, s: 1 }]] },
      ],
      fx: [{ type: 'embers', count: 80, k: [[0, { i: 0 }], [0.5, { i: 1 }]] }],
      text: [{ kind: 'say', who: 'Kaen', html: 'Fala…', at: [0.2, 0.6], pos: { left: '8%', top: '12%' } }],
    }],
  }],
};
```

2. Adicione a obra em `data/catalog.js` (título, gêneros, sinopse, capítulos e cena da capa).

### Referência

- **Mundo:** 1600×900. `x`/`y` são o ponto de âncora da camada. Personagens usam os pés como âncora.
- **Keyframes `k`:** `[[p, {props}], ...]`, em que `p` é o progresso da página (0 a 1). As props são `x`, `y`, `s` (escala), `r` (rotação), `o` (opacidade), `b` (desfoque) e `shake`, mais props próprias de cada arte: `draw` (sacar a espada), `rage`, `swing`, `curl`, `strike`.
- **Artes:** `ronin`, `oni`, `miko`, `spirit`, `sun`, `moon`, `clouds`, `mountains`, `grass`, `bamboo`, `torii`, `waves`, `birds`, `eyes`, `hand`, `city`, `lightning`, `pillars`, `candles`, `boat`, `block`, `image` e `video`.
- **Efeitos `fx`:** `embers`, `petals`, `rain`, `snow`, `fireflies`, `ash`, `speed`, `flash` (intensidade `i`) e `inkwipe` (progresso `q`).
- **Textos:** `narr`, `narr dark`, `say`, `think`, `shout`, `title` e `title light`. `at: [início, fim]` define quando o texto aparece.
- **Celular:** em tela vertical, os quadros são empilhados automaticamente e as cenas abertas ganham um enquadramento mais largo.

### Usando arte de verdade (mangá desenhado)

Para animar páginas desenhadas à mão, exporte cada elemento como uma camada PNG transparente (fundo, corpo, cabelo, capa, arma, efeitos) e use `art: 'image'` com keyframes. Para movimentos orgânicos complexos, gere um loop curto (MP4/WebM) por quadro e use `art: 'video'`. Use apenas obras que você tem direito de publicar.
