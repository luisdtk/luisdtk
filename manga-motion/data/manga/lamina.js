/* Lâmina do Crepúsculo — história e personagens originais. */
(window.MMDB = window.MMDB || {}).lamina = {
  title: 'Lâmina do Crepúsculo',
  chapters: [
    {
      title: 'Cap. 1 — O Sol que Sangra',
      pages: [
        /* 1. Abertura */
        {
          len: 2.5, bg: '#f3eee4', wind: 0.5,
          cam: [[0, { s: 1.15 }], [1, { s: 1 }]],
          layers: [
            { art: 'sun', opt: { r: 230 }, x: 800, y: 470, k: [[0, { y: 260, o: 0 }], [0.4, { y: 0, o: 1 }], [1, { y: -60, s: 1.1 }]] },
            { art: 'birds', x: 1150, y: 260, k: [[0, { o: 0 }], [0.3, { o: 1 }], [1, { x: -300 }]] },
            { art: 'clouds', opt: { w: 1800, h: 300, n: 6 }, x: 800, y: 780, k: [[0, { y: 0 }], [1, { y: 160 }]] },
            { art: 'clouds', opt: { w: 1800, h: 260, n: 5 }, x: 700, y: 860, k: [[0, { y: 0 }], [1, { y: 260 }]] },
          ],
          text: [
            { kind: 'title', html: 'LÂMINA DO<br>CREPÚSCULO<small>CAPÍTULO 1 · O SOL QUE SANGRA</small>', at: [0, 0.75], pos: { top: '16%' } },
          ],
        },
        /* 2. O andarilho */
        {
          len: 3.5, bg: '#efe7d8', wind: 1,
          cam: [[0, { s: 1.25, y: 40 }], [0.6, { s: 1.05 }], [1, { s: 1, x: -60 }]],
          layers: [
            { art: 'sun', opt: { r: 300 }, x: 820, y: 360, k: [[0, { y: 60 }], [1, { y: -40 }]] },
            { art: 'mountains', opt: { w: 2000, h: 520 }, x: 800, y: 680, k: [[0, { x: 40 }], [1, { x: -40 }]] },
            { art: 'ronin', scale: 0.62, x: 600, y: 812, k: [[0, { x: -320 }], [1, { x: 260 }]] },
            { art: 'grass', opt: { w: 2000, h: 200, n: 120 }, x: 800, y: 920, k: [[0, { x: 80 }], [1, { x: -120 }]] },
          ],
          fx: [{ type: 'ash', count: 70, k: [[0, { i: 0 }], [0.2, { i: 1 }]] }],
          text: [
            { kind: 'narr', html: 'Quando o sol ficou vermelho, as aldeias do vale pararam de acender lanternas.', at: [0.06, 0.38], pos: { left: '6%', top: '12%' } },
            { kind: 'narr', html: 'Diziam que ele vinha à noite. Que levava os nomes de quem dormia.', at: [0.41, 0.68], pos: { right: '6%', top: '18%' } },
            { kind: 'narr', html: 'Mas um andarilho subiu a montanha <b>ao contrário</b> de todos os outros.', at: [0.71, 0.98], pos: { left: '8%', bottom: '14%' } },
          ],
        },
        /* 3. Quadros */
        {
          len: 3.5, bg: '#f3eee4', wind: 0.8, halftone: true,
          layers: [
            { panel: [70, 60, 1460, 300], reveal: [-0.12, 0.12, 'left'], bg: '#f6efe2', layers: [
              { art: 'eyes', x: 730, y: 150, scale: 1.25, k: [[0.1, { s: 1.15 }], [0.5, { s: 1 }]] },
            ] },
            { panel: [70, 400, 760, 440], reveal: [0.3, 0.46, 'down'], bg: '#d4161d', layers: [
              { art: 'hand', x: 420, y: 230, scale: 1.15, k: [[0.3, { x: 160, curl: 0 }], [0.6, { x: 0, curl: 0.8 }], [0.8, { curl: 0.2 }]] },
            ] },
            { panel: [870, 400, 660, 440], reveal: [0.55, 0.72, 'right'], bg: '#e9e1d0', layers: [
              { art: 'sun', opt: { r: 190 }, x: 330, y: 200 },
              { art: 'ronin', scale: 0.95, x: 360, y: 640, k: [[0.55, { y: 60 }], [1, { y: 0 }]] },
            ] },
          ],
          fx: [{ type: 'ash', count: 40, color: '#444' }],
          text: [
            { kind: 'think', html: '…O cheiro de ferro chegou antes dele.', at: [0.12, 0.4], pos: { left: '8%', top: '44%' } },
            { kind: 'say', who: 'Kaen', html: 'Saia. Eu sei que está aí.', at: [0.62, 0.95], pos: { right: '8%', top: '8%' } },
          ],
        },
        /* 4. O Carrasco Rubro */
        {
          len: 3.5, bg: '#d4161d', wind: 1.2,
          cam: [[0, { s: 1.2 }], [0.7, { s: 1 }], [0.75, { shake: 0.6 }], [0.82, { shake: 0 }]],
          layers: [
            { art: 'pillars', opt: { w: 1800, h: 900 }, x: 800, y: 900, k: [[0, { s: 1.05 }], [1, { s: 1 }]] },
            { art: 'lightning', x: 300, y: 450, k: [[0, { o: 0, strike: 0 }], [0.5, { o: 0 }], [0.55, { o: 1, strike: 0.6 }], [0.85, { strike: 0.2 }]] },
            { art: 'lightning', x: 1300, y: 450, k: [[0.55, { o: 0 }], [0.6, { o: 1, strike: 0.5 }], [0.9, { strike: 0.15 }]] },
            { art: 'oni', scale: 1.1, x: 800, y: 860, k: [[0, { o: 0, y: 80, s: 0.9 }], [0.35, { o: 0.15 }], [0.65, { o: 1, y: 0, s: 1, rage: 0 }], [0.8, { rage: 1 }]] },
            { art: 'candles', x: 800, y: 900, scale: 1.4 },
            { sfx: 'GOOOO…', size: 150, x: 1300, y: 200, color: '#111', k: [[0.6, { o: 0, s: 0.5, r: -8 }], [0.7, { o: 1, s: 1 }], [0.95, { o: 1, s: 1.1 }], [1, { o: 0 }]] },
          ],
          fx: [
            { type: 'embers', count: 90, k: [[0, { i: 0.3 }], [0.6, { i: 1 }]] },
            { type: 'flash', k: [[0.54, { i: 0 }], [0.56, { i: 0.9 }], [0.6, { i: 0 }]] },
          ],
          text: [
            { kind: 'narr', html: 'No salão de mil colunas, as velas queimavam sem ninguém para acendê-las.', at: [0.05, 0.4], pos: { left: '6%', top: '10%' } },
            { kind: 'shout', html: 'VOCÊ TROUXE SEU NOME ATÉ MIM, ANDARILHO?', at: [0.68, 0.98], pos: { left: '6%', bottom: '12%' } },
          ],
        },
        /* 5. O golpe */
        {
          len: 3, bg: '#f3eee4', wind: 2,
          cam: [[0, { s: 1.3, y: 150 }], [0.5, { s: 1.1, y: 60 }], [0.62, { shake: 1 }], [0.7, { shake: 0, s: 1, y: 0 }]],
          layers: [
            { art: 'ronin', scale: 1.25, x: 760, y: 900, k: [[0, { draw: 0, x: -80 }], [0.45, { draw: 0 }], [0.6, { draw: 1, x: 40 }], [1, { draw: 1 }]] },
            { sfx: 'SHIIN!!', size: 230, x: 1200, y: 300, color: '#d4161d', k: [[0.55, { o: 0, s: 2.2, r: 10 }], [0.62, { o: 1, s: 1, r: -6 }], [0.9, { s: 1.08 }], [1, { o: 0 }]] },
          ],
          fx: [
            { type: 'speed', k: [[0.3, { i: 0 }], [0.55, { i: 0.9 }], [0.8, { i: 0.4 }], [1, { i: 0 }]] },
            { type: 'flash', k: [[0.58, { i: 0 }], [0.6, { i: 1 }], [0.66, { i: 0 }]] },
          ],
          text: [
            { kind: 'say', who: 'Kaen', html: 'Meu nome eu deixei no pé da montanha.', at: [0.08, 0.42], pos: { left: '8%', top: '14%' } },
          ],
        },
        /* 6. Transição de tinta + duelo */
        {
          len: 3.5, bg: '#f3eee4', wind: 1.6,
          cam: [[0.3, { s: 1.3 }], [1, { s: 1 }]],
          layers: [
            { art: 'block', opt: { w: 1800, h: 1000, fill: '#d4161d' }, x: 800, y: 450, k: [[0.3, { o: 0 }], [0.4, { o: 1 }]] },
            { art: 'sun', opt: { r: 330, color: '#f3eee4' }, x: 800, y: 430, k: [[0.3, { o: 0, s: 0.6 }], [0.6, { o: 1, s: 1 }]] },
            { art: 'oni', scale: 0.9, opt: { flip: true }, x: 1040, y: 820, k: [[0.4, { o: 0, x: 200 }], [0.65, { o: 1, x: 0, swing: 0 }], [0.85, { swing: 1 }]] },
            { art: 'ronin', scale: 0.95, x: 560, y: 840, k: [[0.4, { o: 0, x: -200, draw: 1 }], [0.65, { o: 1, x: 0 }]] },
          ],
          fx: [
            { type: 'inkwipe', color: '#111', k: [[0, { q: 0 }], [0.3, { q: 1 }], [0.31, { q: 0 }]] },
            { type: 'embers', count: 80, color: '#111', k: [[0.4, { i: 0 }], [0.6, { i: 1 }]] },
          ],
          text: [
            { kind: 'narr dark', html: 'Duas sombras. Um único sol.', at: [0.5, 0.95], pos: { left: '6%', top: '10%' } },
          ],
        },
        /* 7. Fim */
        {
          len: 2.5, bg: '#111', wind: 0.4,
          cam: [[0, { s: 1.1 }], [1, { s: 1 }]],
          layers: [
            { art: 'moon', opt: { r: 140 }, x: 1150, y: 260, k: [[0, { y: 60 }], [1, { y: 0 }]] },
            { art: 'mountains', opt: { w: 2000, h: 420, colors: ['#2a2826', '#1c1b1a', '#0a0a0a'] }, x: 800, y: 720 },
            { art: 'ronin', scale: 0.55, opt: { flip: true }, x: 760, y: 800, k: [[0, { draw: 1 }], [0.6, { draw: 0 }]] },
          ],
          fx: [{ type: 'snow', count: 120 }],
          text: [
            { kind: 'narr dark', html: 'Naquela noite, pela primeira vez em anos, uma lanterna foi acesa no vale.', at: [0.1, 0.6], pos: { left: '6%', top: '14%' } },
            { kind: 'title light', html: 'CONTINUA…', at: [0.55, 1.01], pos: { bottom: '18%' } },
          ],
        },
      ],
    },
  ],
};
