// =====================================================================
//  CENTRAL CONFIGURATION
//  Every editable text, number, color and important timing lives here.
//  All frame numbers refer to the GLOBAL timeline (30 fps, 1710 frames).
// =====================================================================

export const VIDEO = {
  id: "Video",
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 1710,
};

export const AUDIO = {
  // Files live in public/audio. Set to null to disable a track.
  narration: "audio/narracao.mp3" as string | null,
  effects: "audio/efeitos.mp3" as string | null,
};

export const COLORS = {
  bg: "#090B10",
  bgDeep: "#05070B",
  text: "#F3F0EB",
  textDim: "#9298A5",
  cyan: "#62E6FF",
  warning: "#FF694F",
  violet: "#A68BFF",
  white: "#FFFFFF",
  // Bright interface (Scene 4)
  paper: "#FCFCFB",
  ink: "#0E1014",
  inkSoft: "#5B606B",
  divider: "#E4E4E1",
  panel: "rgba(18, 22, 30, 0.72)",
  panelBorder: "rgba(146, 152, 165, 0.22)",
};

export const FONTS = {
  serif: "'Source Serif 4', Georgia, serif",
  sans: "Inter, Helvetica, Arial, sans-serif",
  mono: "'JetBrains Mono', Menlo, monospace",
  brand: "Outfit, Inter, sans-serif",
};

// ---------------------------------------------------------------------
//  Scene ranges (overlapping on purpose)
// ---------------------------------------------------------------------
export const SCENES = {
  opening: { from: 0, to: 273 },
  transformation: { from: 264, to: 689 },
  divide: { from: 686, to: 892 },
  adaptation: { from: 886, to: 1507 },
  finale: { from: 1490, to: 1710 },
};

// Moments where the atmospheric light breathes stronger.
export const LIGHT_PULSES = [22, 128, 232, 645, 700, 866, 1540, 1625, 1672];

// ---------------------------------------------------------------------
//  SCENE 1 — THE WORLD IS CHANGING
// ---------------------------------------------------------------------
export const OPENING = {
  wakeUp: "WAKE UP.",
  question: "What if the world is changing faster than you are?",
  realizationLine1: "AI IS CHANGING",
  realizationLine2: "EVERYTHING.",
  statementWords: ["And", "it’s", "happening"],
  statementLastWord: "now.",
  t: {
    trailsEnd: 21,
    flash: 22,
    wakeUpIn: 30,
    wakeUpOut: 56,
    panelIn: 56,
    typeStart: 64,
    typeEnd: 100,
    questionOut: 104,
    realizationIn: 112,
    realizationTypeEnd: 150,
    realizationOut: 186,
    statementIn: 198,
    statementNow: 222,
    statementOut: 252,
  },
};

// ---------------------------------------------------------------------
//  SCENE 2 — AI IS REWRITING THE RULES
// ---------------------------------------------------------------------
export const TRANSFORMATION = {
  windowTitle: "assistant — new session",
  userQuestion: "Is AI really changing the world?",
  thinking: "Thinking",
  answer: "It’s changing how we work, create, learn, and build.",
  highlightWords: ["work", "create", "learn", "build"],
  labels: ["WORK", "CREATE", "LEARN", "BUILD"],
  visTitles: ["Workflows", "Creation", "Knowledge", "Product"],
  code: [
    { t: "const idea = describe(", c: "plain" },
    { t: '  "a tool that plans my week"', c: "string" },
    { t: ");", c: "plain" },
    { t: "const app = await ai.build(idea);", c: "plain" },
    { t: "app.preview();", c: "fn" },
  ],
  productTitle: "Weekly Planner",
  timelineTracks: ["Research", "Design", "Launch"],
  progressLabels: ["Drafts", "Tasks", "Ideas"],
  instructions: ["<Workflows />", "<Ideas />", "<Automation />", "<Creation />", "<Intelligence />"],
  statement: "The rules are being",
  statementKey: "rewritten.",
  t: {
    windowIn: 266,
    userMsg: 276,
    thinkingIn: 292,
    answerStart: 326,
    answerEnd: 392,
    labelsIn: [344, 360, 376, 392],
    labelsOut: 418,
    codeIn: 420,
    codeTypeStart: 426,
    codeTypeEnd: 456,
    connect: 456,
    dissolve: 464,
    productDone: 488,
    dragA: [496, 516],
    dragB: [522, 542],
    instructionsIn: 562,
    zoomOut: 612,
    statementIn: 626,
    rewrittenGlow: 646,
    statementOut: 670,
  },
};

// ---------------------------------------------------------------------
//  SCENE 3 — TWO FUTURES
// ---------------------------------------------------------------------
export const DIVIDE = {
  counterLabels: ["ITERATIONS", "SKILLS IN USE"],
  counterValues: ["01", "02", "03", "04", "05"],
  // frames where each counter steps up (accelerating)
  counterSteps: [694, 720, 736, 748, 757],
  staticLabel: "status: waiting",
  stalledProgress: 0.23,
  comments: ["I’ll learn it later.", "I don’t need AI.", "Things will stay the same."],
  commentHandle: "anonymous",
  finalLine1: "YOU WILL BE",
  finalLine2: "LEFT BEHIND.",
  t: {
    divider: 700,
    countersOut: 776,
    comments: [786, 802, 818],
    commentsFade: 834,
    finalIn: 852,
    finalOut: 880,
  },
};

// ---------------------------------------------------------------------
//  SCENE 4 — ADAPT OR GET LEFT BEHIND
// ---------------------------------------------------------------------
export const ADAPTATION = {
  title: "Adapt or get left behind.",
  promptPlaceholder: "Ask anything…",
  steps: [
    {
      n: "01",
      title: "Learn to use AI.",
      body: "Start with one tool that solves a real problem in your life or work.",
    },
    {
      n: "02",
      title: "Learn by doing.",
      body: "Don't just watch tutorials. Build something. Test it. Improve it.",
      highlights: ["Build", "Test", "Improve"],
    },
    {
      n: "03",
      title: "Use AI to multiply your skills.",
      body: "Combine your creativity, judgment, and experience with AI.",
    },
  ],
  tools: ["Writing", "Research", "Planning"],
  stepTwoPrompt: "Help me turn this idea into something useful.",
  workflow: ["Your idea", "AI-assisted process", "Polished result"],
  humanInputs: ["creativity", "judgment", "experience"],
  buildingStatus: "Building your idea...",
  fileName: "Project.tsx",
  projectCode: [
    "export const Project = () => {",
    "  const p = useProgress();",
    "  return (",
    "    <Scene>",
    '      <Title text="My Idea" />',
    "      <Symbol spin />",
    "      <Progress value={p} />",
    "    </Scene>",
    "  );",
    "};",
  ],
  previewTitles: ["My Idea", "My Idea — v2"],
  doneMessage: "Done. Your idea is now a working prototype.",
  requests: ["Change the design.", "Try a different color.", "Make it faster."],
  corePhrase1: { before: "No need to know ", key: "everything", after: "." },
  corePhrase2: { before: "You need to start ", key: "learning", after: "." },
  journey: ["Learn to use AI", "Learn by doing", "Multiply your skills"],
  challenge: "Your next skill could change",
  challengeKey: "everything.",
  t: {
    symbolIn: 886,
    reveal: [898, 930],
    titleIn: 916,
    promptIn: 930,
    step1In: 924,
    toolPick: 946,
    scroll2: [962, 984],
    prompt2Type: [988, 1016],
    result2: [1016, 1052],
    highlights: [1028, 1040, 1052],
    scroll3: [1064, 1086],
    flow3: 1076,
    scroll4: [1108, 1132],
    codeType: [1134, 1176],
    preview: 1180,
    done: 1206,
    expand: [1246, 1268],
    requests: [1262, 1286, 1310],
    phrase1: 1270,
    phrase2: 1318,
    phrasesCenter: [1340, 1362],
    journey: [1398, 1450],
    challengeIn: 1458,
    challengeKey: 1470,
    toDark: [1486, 1508],
  },
};

// ---------------------------------------------------------------------
//  SCENE 5 — YOUR MOVE
// ---------------------------------------------------------------------
export const FINALE = {
  headline: "Start now.",
  sub: "Learn. Experiment. Adapt.",
  typed: "START",
  postTitle: "Comments",
  existingComments: [
    { handle: "user_4821", text: "Saving this for later." },
    { handle: "user_1307", text: "Already started this week." },
  ],
  accountHandle: "supernova.studio",
  reply1: "The future won’t wait for you.",
  reply2: "Neither should you.",
  line1: "AI IS THE SHIFT.",
  line2: "ADAPT IS THE ADVANTAGE.",
  brand: "SUPERNOVA STUDIO",
  t: {
    phoneIn: 1494,
    headlineIn: 1506,
    typeStart: 1504, // one letter every 4 frames
    typeEvery: 4,
    sendShow: 1522,
    sendTap: 1528,
    posted: 1532,
    reply1: 1544,
    reply2: 1560,
    phoneOut: 1574,
    linesIn: 1585,
    linesOut: 1609,
    symbolsIn: 1616,
    symbolsOut: 1642,
    brandIn: 1650,
    brandSettled: 1666,
    glow: [1672, 1702],
  },
};
