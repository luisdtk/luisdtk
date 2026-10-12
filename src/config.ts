// Todos os textos e números do vídeo ficam aqui.
// Para trocar perfil, números, frases ou nomes, basta mudar este arquivo.

export const config = {
  // Parte 1: abertura
  saudacaoAbertura: "Boa noite, coruja noturna",
  textoApagadoPergunta: "Como posso ajudar você hoje?",
  modeloEscuro: "Opus 5.5",
  // Cada palavra da frase digitada e o quadro em que ela nasce.
  // "quebra: true" passa para a linha de baixo antes da palavra.
  fraseDigitada: [
    { palavra: "Ninguém", quadro: 108 },
    { palavra: "animou", quadro: 116 },
    { palavra: "este", quadro: 125 },
    { palavra: "vídeo.", quadro: 130 },
    { palavra: "Chegou", quadro: 156, quebra: true },
    { palavra: "a", quadro: 164 },
    { palavra: "era", quadro: 167 },
    { palavra: "da", quadro: 172 },
    { palavra: "IA.", quadro: 177, destaque: true },
  ],
  tituloLinha1: "Esse vídeo foi todo feito pelo",
  tituloLinha2: "Claude",

  // Parte 2: o que é o Remotion
  perguntaChat: "Mas como o Claude fez isso?",
  respostaChat: [
    { palavra: "Usei", quadro: 325 },
    { palavra: "o", quadro: 328 },
    { palavra: "Remotion,", quadro: 331 },
    { palavra: "um", quadro: 340 },
    { palavra: "programa", quadro: 344 },
    { palavra: "gratuito", quadro: 352 },
    { palavra: "e", quadro: 360 },
    { palavra: "de", quadro: 364 },
    { palavra: "código", quadro: 368 },
    { palavra: "aberto", quadro: 375 },
    { palavra: "que", quadro: 389 },
    { palavra: "transforma", quadro: 394 },
    { palavra: "código", quadro: 410 },
    { palavra: "em", quadro: 416 },
    { palavra: "vídeo.", quadro: 421 },
  ],
  etiquetas: ["Gratuito", "Código aberto", "Feito pelo Claude"],

  // Parte 3: a prova
  perfilInstagram: "ssupernova.studio",
  visualizacoes: 81300,
  curtidas: 4600,
  comentarios: 66,
  republicacoes: 40,
  legendaPost: "#ia #claude #claudecode",
  comentariosPost: [
    "Como faço?",
    "Quero aprender ensina por favor 🙏🏻",
    "ensina irmao, to sofrendo no claude code 🫠",
  ],
  perguntaGrande: "Como faz?",

  // Parte 4: a tela clara do Claude
  saudacaoClara: "De volta à ação",
  modeloClaro: "Fable 5.1 · Médio · Auto",
  passos: [
    "Abra o Claude Code",
    "Cole o prompt",
    "Eu te envio no fim deste vídeo",
    "O Claude faz o resto",
  ],
  promptColado:
    "Quero que você crie um vídeo de motion graphics em preto e branco com o Remotion, do zero. Eu não sou programador: não me peça para escrever código nem digitar comando. Instale o que precisar, monte cada cena, confira o resultado e me entregue o arquivo pronto em MP4. O vídeo tem 54 segundos e segue este roteiro, cena por cena:",
  balaoMensagem: "Quero que você crie um vídeo de motion…",
  enquantoTrabalha: "Instalando o Remotion e montando as cenas…",
  arquivoCodigo: "Video.tsx",
  entregaTexto: "Pronto. Aqui está o seu vídeo.",
  entregaArquivo: "video.mp4",
  entregaPronto: "Arquivo pronto",
  tituloExemplo: "Meu vídeo",
  tituloExemploDepois: "Supernova",
  frasesSegundaMetade: {
    semCodigo: ["Sem escrever", "uma linha de código"],
    querMudar: ["Quer mudar?", "Pede em português"],
    final: "Faz o que você quiser",
  },
  pedidos: ["Troca o nome", "Inverte as cores", "Deixa mais lento"],

  // Parte 5: o comentário e a assinatura
  palavraComentario: "PROMPT",
  fraseComentario: "Comenta",
  respostaAutor1: "@voce te mandei o Remotion",
  respostaAutor2: "e o prompt que fez esse vídeo 📩",
  nomeFinal: "SUPERNOVA STUDIO",
};
