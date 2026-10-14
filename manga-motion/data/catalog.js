/* Catálogo da biblioteca. Para adicionar uma obra:
   1) crie data/manga/<id>.js (veja README.md para o formato das páginas);
   2) adicione uma entrada aqui com o mesmo id. */
window.MMCatalog = [
  {
    id: 'lamina', title: 'Lâmina do Crepúsculo', author: 'Estúdio Motion', status: 'Em lançamento',
    genres: ['Ação', 'Samurai', 'Sobrenatural'], chapters: ['Cap. 1 — O Sol que Sangra'], featured: true,
    synopsis: 'Quando o sol do vale fica vermelho, um carrasco mascarado começa a levar o nome de quem dorme. Kaen, um andarilho sem nome, sobe a montanha para enfrentá-lo.',
    cover: { bg: '#efe7d8', layers: [
      { art: 'sun', opt: { r: 300 }, x: 800, y: 380 },
      { art: 'mountains', opt: { w: 2000, h: 520 }, x: 800, y: 700 },
      { art: 'ronin', scale: 1.05, x: 800, y: 900 },
    ] },
  },
  {
    id: 'lanterna', title: 'A Sacerdotisa da Lanterna', author: 'Estúdio Motion', status: 'Em lançamento',
    genres: ['Fantasia', 'Slice of life', 'Sobrenatural'], chapters: ['Cap. 1 — Vaga-lumes Perdidos'],
    synopsis: 'Hina guia espíritos perdidos de volta para casa usando uma lanterna que só acende na presença deles.',
    cover: { bg: '#13201b', wind: 0.4, layers: [
      { art: 'moon', opt: { r: 160 }, x: 800, y: 260 },
      { art: 'bamboo', opt: { w: 2000, h: 1100, color: '#050807', node: '#1d2a24', n: 10 }, x: 800, y: 450 },
      { art: 'miko', scale: 1.15, x: 800, y: 900 },
    ] },
  },
  {
    id: 'mare', title: 'Maré Negra', author: 'Estúdio Motion', status: 'Em lançamento',
    genres: ['Aventura', 'Mistério', 'Ação'], chapters: ['Cap. 1 — A Tempestade Tem Dono'],
    synopsis: 'Em Kurogane, a maré sobe toda noite e não desce mais. Um barco desafia a tempestade para descobrir o que vive debaixo d’água.',
    cover: { bg: '#253140', wind: 1.6, layers: [
      { art: 'lightning', x: 1100, y: 300 },
      { art: 'boat', x: 800, y: 560, scale: 1.3 },
      { art: 'waves', opt: { w: 2000, h: 420 }, x: 800, y: 780 },
    ] },
  },
];
