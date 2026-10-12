// Plain-English text that Claude "writes" on screen (parts 2 and 4).

// What Claude writes in the chat (part 2).
export const CODE_P2 = [
  "Scene 1 — The opening",
  "  Four light streaks fly in from the edges.",
  "  They meet in the center: the symbol is born.",
  '  "Good evening, stranger" rises beside it.',
  "  A question box slides up underneath.",
  "  A soft white glow breathes behind it all.",
  "Scene 2 — The title",
  '  "Every frame was made by Claude."',
];

// The prompt card (part 2).
export const CODE_P2_SHORT = [
  "Hey Claude, make an opening:",
  "  light streaks fly in,",
  "  the symbol is born,",
  "  a greeting rises,",
  "  a question box appears,",
  "  everything glows.",
  "Make it feel alive.",
  "Thanks!",
];

// Timeline track names and the sentences that replace them.
export const TRACK_NAMES = ["Streaks", "Symbol", "Greeting", "Box", "Glow"];
export const TRACK_CODE = [
  '"Light streaks fly in"',
  '"The symbol is born"',
  '"A greeting rises"',
  '"A question box appears"',
  '"Everything glows"',
];

// The storyboard Claude writes in part 4: [indent level, text]
export const CODE_P4: [number, string][] = [
  [0, 'Storyboard — "The AI Era"'],
  [0, ""],
  [0, "Scene 1 · The opening"],
  [1, "Light streaks fly in and meet in the center."],
  [1, "The symbol is born from the flash."],
  [1, '"Nobody animated this video." is typed out.'],
  [0, ""],
  [0, "Scene 2 · The reveal"],
  [1, 'The chat asks: "So how did Claude do it?"'],
  [1, "Plain words turn into motion, piece by piece."],
  [0, ""],
  [0, "Scene 3 · The proof"],
  [1, "Videos like this are everywhere now."],
  [1, 'Everyone asks the same thing: "How?"'],
  [0, ""],
  [0, "Scene 4 · The steps"],
  [1, "Open Claude Code."],
  [1, "Paste a prompt, or describe your idea."],
  [2, "Claude does the rest."],
  [0, ""],
  [0, "Scene 5 · The call"],
  [1, 'Comment "ADAPT".'],
  [1, "Adapt, or get left behind."],
];
