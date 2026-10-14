/* A Sacerdotisa da Lanterna — história e personagens originais. */
(window.MMDB = window.MMDB || {}).lanterna = {
  title: 'A Sacerdotisa da Lanterna',
  chapters: [
    {
      title: 'Cap. 1 — Vaga-lumes Perdidos',
      pages: [
        {
          len: 2.5, bg: '#0e1512', wind: 0.4,
          cam: [[0, { s: 1.2 }], [1, { s: 1 }]],
          layers: [
            { art: 'moon', opt: { r: 150 }, x: 800, y: 300, k: [[0, { y: 120, o: 0 }], [0.5, { y: 0, o: 1 }]] },
            { art: 'bamboo', opt: { w: 2000, h: 1100, color: '#050807', node: '#1d2a24' }, x: 800, y: 450, k: [[0, { s: 1.15 }], [1, { s: 1 }]] },
          ],
          fx: [{ type: 'fireflies', count: 40 }],
          text: [{ kind: 'title light', html: 'A SACERDOTISA<br>DA LANTERNA<small>CAPÍTULO 1 · VAGA-LUMES PERDIDOS</small>', at: [0, 0.8], pos: { top: '30%' } }],
        },
        {
          len: 3.5, bg: '#13201b', wind: 0.5,
          cam: [[0, { s: 1.3, y: 60 }], [1, { s: 1 }]],
          layers: [
            { art: 'bamboo', opt: { w: 2000, h: 1100, color: '#0a110e', node: '#24332c', n: 10 }, x: 800, y: 450, k: [[0, { x: 60 }], [1, { x: -60 }]] },
            { art: 'torii', x: 800, y: 880, scale: 1.1, k: [[0, { y: 40 }], [1, { y: 0 }]] },
            { art: 'miko', scale: 0.85, x: 640, y: 880, k: [[0, { x: -400 }], [0.7, { x: 0 }]] },
            { art: 'grass', opt: { w: 2000, n: 140, color: '#050807', ground: '#050807' }, x: 800, y: 920 },
          ],
          fx: [{ type: 'fireflies', count: 60 }],
          text: [
            { kind: 'narr dark', html: 'Toda noite, Hina subia os degraus do santuário com uma lanterna apagada.', at: [0.05, 0.37], pos: { left: '6%', top: '12%' } },
            { kind: 'narr dark', html: 'E toda noite, ela voltava com ela acesa — sem nunca tocar no fogo.', at: [0.4, 0.75], pos: { right: '6%', top: '16%' } },
            { kind: 'think', html: 'Vocês se perderam de novo, não foi?', at: [0.75, 0.98], pos: { right: '10%', bottom: '18%' } },
          ],
        },
        {
          len: 3.5, bg: '#0b0f0d', wind: 0.6,
          cam: [[0, { s: 1.1 }], [1, { s: 1.25, y: -40 }]],
          layers: [
            { art: 'miko', scale: 1.3, x: 520, y: 980 },
            { art: 'spirit', opt: { ph: 0 }, x: 1050, y: 380, k: [[0, { o: 0, x: 200 }], [0.3, { o: 1, x: 0 }]] },
            { art: 'spirit', opt: { ph: 1.5 }, scale: 0.7, x: 1300, y: 520, k: [[0.2, { o: 0, x: 200 }], [0.5, { o: 1, x: 0 }]] },
            { art: 'spirit', opt: { ph: 3 }, scale: 0.5, x: 1180, y: 700, k: [[0.4, { o: 0, x: 200 }], [0.7, { o: 1, x: 0 }]] },
          ],
          fx: [{ type: 'fireflies', count: 80, k: [[0, { i: 0.4 }], [0.8, { i: 1 }]] }],
          text: [
            { kind: 'say', who: 'Espírito', html: 'Moça da lanterna… a gente esqueceu o caminho de casa.', at: [0.3, 0.65], pos: { right: '8%', top: '8%' } },
            { kind: 'say', who: 'Hina', html: 'Então segurem firme na luz. Eu levo vocês.', at: [0.68, 0.98], pos: { left: '6%', top: '12%' } },
          ],
        },
        {
          len: 3, bg: '#f3eee4', wind: 1.2, halftone: true,
          layers: [
            { panel: [70, 60, 700, 780], reveal: [-0.12, 0.15, 'down'], bg: '#13201b', layers: [
              { art: 'moon', opt: { r: 110 }, x: 350, y: 220 },
              { art: 'miko', scale: 1, x: 350, y: 820, k: [[0, { y: 60 }], [0.5, { y: 0 }]] },
            ] },
            { panel: [830, 60, 700, 360], reveal: [0.3, 0.48, 'right'], bg: '#d4161d', layers: [
              { art: 'spirit', x: 350, y: 220, scale: 1.2 },
            ] },
            { panel: [830, 480, 700, 360], reveal: [0.55, 0.72, 'left'], bg: '#0b0f0d', layers: [
              { art: 'bamboo', opt: { w: 900, h: 400, n: 8, color: '#000', node: '#333' }, x: 350, y: 180 },
              { sfx: 'FUWAAA', size: 110, x: 350, y: 180, color: '#f3eee4', k: [[0.6, { o: 0, s: 0.6 }], [0.72, { o: 1, s: 1 }]] },
            ] },
          ],
          fx: [{ type: 'petals', count: 50, k: [[0.5, { i: 0 }], [0.75, { i: 1 }]] }],
          text: [{ kind: 'title', html: 'CONTINUA…', at: [0.86, 1.01], pos: { bottom: '6%' } }],
        },
      ],
    },
  ],
};
