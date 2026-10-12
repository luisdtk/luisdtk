// All the texts and numbers in the video live here.
// To change the profile, the numbers, the phrases or the names, just edit this file.

export const config = {
  // Part 1: opening
  saudacaoAbertura: "Good evening, night owl",
  textoApagadoPergunta: "How can I help you today?",
  modeloEscuro: "Opus 5.5",
  // Each word of the typed sentence and the frame where it appears.
  // "quebra: true" starts a new line before the word; "destaque: true" makes it bold pure white.
  fraseDigitada: [
    { palavra: "Nobody", quadro: 108 },
    { palavra: "animated", quadro: 116 },
    { palavra: "this", quadro: 125 },
    { palavra: "video.", quadro: 130 },
    { palavra: "The", quadro: 156, quebra: true },
    { palavra: "AI", quadro: 164, destaque: true },
    { palavra: "era", quadro: 170, destaque: true },
    { palavra: "is", quadro: 175 },
    { palavra: "here.", quadro: 178 },
  ],
  tituloLinha1: "Every frame was made by",
  tituloLinha2: "Claude",

  // Part 2: how Claude did it
  perguntaChat: "So how did Claude do it?",
  respostaChat: [
    { palavra: "You", quadro: 325 },
    { palavra: "described", quadro: 328 },
    { palavra: "it", quadro: 336 },
    { palavra: "in", quadro: 340 },
    { palavra: "plain", quadro: 344 },
    { palavra: "words.", quadro: 352 },
    { palavra: "I", quadro: 364 },
    { palavra: "turned", quadro: 368 },
    { palavra: "every", quadro: 375 },
    { palavra: "sentence", quadro: 389 },
    { palavra: "into", quadro: 394 },
    { palavra: "motion.", quadro: 410 },
  ],
  etiquetas: ["No editor", "No animator", "Just words"],
  painelTitulo: "Studio",
  painelCena: "Opening",

  // Part 3: videos like this are everywhere
  perfilInstagram: "your.profile",
  frasesProva: ["No camera.", "No studio.", "No team."],
  legendaPost: "#ai #claude #claudecode",
  comentariosPost: ["How do I do this?", "Please teach me how 🙏🏻", "teach me bro, I'm struggling with claude code 🫠"],
  perguntaGrande: "How?",

  // Part 4: the light Claude screen
  saudacaoClara: "Back at it",
  modeloClaro: "Fable 5.1 · Medium · Auto",
  passos: ["Open Claude Code", "Paste a prompt", "Or just describe your idea", "Claude does the rest"],
  promptColado:
    "Create a black-and-white motion graphics video for me, from scratch. I'm not a designer or a programmer: don't ask me to write code or type commands. Install whatever you need, build every scene, check the result and hand me the finished MP4. The video is 57 seconds long and follows this script, scene by scene:",
  balaoMensagem: "Create a black-and-white motion graphics video…",
  enquantoTrabalha: "Planning the scenes and building your video…",
  arquivoCodigo: "storyboard.md",
  entregaTexto: "Done. Here's your video.",
  entregaArquivo: "video.mp4",
  entregaPronto: "File ready",
  tituloExemplo: "My video",
  tituloExemploDepois: "The AI Era",
  frasesSegundaMetade: {
    semCodigo: ["No design skills.", "No code."],
    querMudar: ["Want changes?", "Just ask."],
    final: "Adapt — or fall behind",
  },
  pedidos: ["Change the name", "Invert the colors", "Make it slower"],

  // Part 5: the comment and the signature
  palavraComentario: "ADAPT",
  fraseComentario: "Comment",
  respostaAutor1: "@you welcome to the AI era.",
  respostaAutor2: "Now go build something 🚀",
  fraseFinal: "THE AI ERA IS HERE",
};
