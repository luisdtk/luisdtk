/* Maré Negra — história e personagens originais. */
(window.MMDB = window.MMDB || {}).mare = {
  title: 'Maré Negra',
  chapters: [
    {
      title: 'Cap. 1 — A Tempestade Tem Dono',
      pages: [
        {
          len: 2.5, bg: '#1a222b', wind: 1.4,
          cam: [[0, { s: 1.2 }], [1, { s: 1 }]],
          layers: [
            { art: 'lightning', x: 1250, y: 380, k: [[0, { strike: 0.3 }]] },
            { art: 'boat', x: 800, y: 600, scale: 1, k: [[0, { y: 80 }], [1, { y: 0 }]] },
            { art: 'waves', opt: { w: 2000, h: 380 }, x: 800, y: 760 },
          ],
          fx: [{ type: 'rain', count: 220 }, { type: 'flash', k: [[0.3, { i: 0 }], [0.32, { i: 0.7 }], [0.36, { i: 0 }]] }],
          text: [{ kind: 'title light', html: 'MARÉ NEGRA<small>CAPÍTULO 1 · A TEMPESTADE TEM DONO</small>', at: [0, 0.8], pos: { top: '14%' } }],
        },
        {
          len: 3.5, bg: '#253140', wind: 2,
          cam: [[0, { s: 1.4, y: 100 }], [0.6, { s: 1.1 }], [1, { s: 1, r: -3 }]],
          layers: [
            { art: 'city', opt: { w: 2000, h: 500, color: '#111820' }, x: 800, y: 520, k: [[0, { y: 60 }], [1, { y: 0 }]] },
            { art: 'boat', x: 760, y: 560, scale: 1.2 },
            { art: 'ronin', scale: 0.38, opt: { flip: true }, x: 840, y: 650 },
            { art: 'waves', opt: { w: 2000, h: 420, rows: 5 }, x: 800, y: 800, k: [[0, { y: 60 }], [1, { y: -20 }]] },
          ],
          fx: [{ type: 'rain', count: 260 }],
          text: [
            { kind: 'narr dark', html: 'O porto de Kurogane fechou quando a maré começou a subir à noite — e não descer mais.', at: [0.05, 0.45], pos: { left: '6%', top: '12%' } },
            { kind: 'shout', html: 'SEGUREM AS CORDAS!!', at: [0.5, 0.95], pos: { right: '6%', top: '14%' } },
          ],
        },
        {
          len: 3, bg: '#0b0e12', wind: 2.4,
          cam: [[0, { s: 1 }], [0.6, { s: 1.3, shake: 0.5 }], [0.8, { shake: 0 }]],
          layers: [
            { art: 'eyes', x: 800, y: 330, scale: 1.3, opt: { iris: '#4c8bb5' }, k: [[0, { o: 0, s: 1.2, shake: 0 }], [0.3, { o: 1, s: 1.3 }], [0.6, { shake: 1 }]] },
            { art: 'waves', opt: { w: 2000, h: 400, rows: 3 }, x: 800, y: 760 },
            { sfx: 'DOOOM', size: 200, x: 800, y: 680, color: '#f3eee4', k: [[0.55, { o: 0, s: 0.4 }], [0.65, { o: 1, s: 1 }], [1, { s: 1.15 }]] },
          ],
          fx: [{ type: 'rain', count: 200 }, { type: 'speed', color: '#e9e4d8', k: [[0.5, { i: 0 }], [0.65, { i: 0.6 }], [0.9, { i: 0 }]] }],
          text: [
            { kind: 'narr dark', html: 'Algo abriu os olhos debaixo d’água.', at: [0.1, 0.5], pos: { left: '6%', bottom: '14%' } },
            { kind: 'title light', html: 'CONTINUA…', at: [0.85, 1.01], pos: { top: '8%' } },
          ],
        },
      ],
    },
  ],
};
