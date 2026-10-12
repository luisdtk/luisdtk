import React from "react";
import { born } from "../theme";

export const CODE_COLORS = {
  string: "#ffffff",
  name: "#e0e0e0",
  close: "#6e6e6e",
  keyword: "#9a9a9a",
  rest: "#bdbdbd",
};

type Tok = { text: string; color: string; italic?: boolean };

/** Separa uma linha de código em pedaços coloridos (tema escuro da parte 2). */
export const tokenizeDark = (line: string): Tok[] => {
  const out: Tok[] = [];
  const re = /("[^"]*")|(\/>)|(<\/?)([A-Za-z]+)|\b(export|const)\b|([^"<\/]+|.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m[1]) out.push({ text: m[1], color: CODE_COLORS.string });
    else if (m[2]) out.push({ text: m[2], color: CODE_COLORS.close });
    else if (m[3]) {
      out.push({ text: m[3], color: CODE_COLORS.rest });
      out.push({ text: m[4], color: CODE_COLORS.name });
    } else if (m[5]) out.push({ text: m[5], color: CODE_COLORS.keyword, italic: true });
    else out.push({ text: m[0], color: CODE_COLORS.rest });
  }
  // separa palavras-chave grudadas em texto comum
  return out.flatMap((t) => {
    if (t.color !== CODE_COLORS.rest) return [t];
    const parts = t.text.split(/\b(export|const)\b/);
    return parts.filter(Boolean).map((p) => ({ text: p, color: p === "export" || p === "const" ? CODE_COLORS.keyword : CODE_COLORS.rest, italic: p === "export" || p === "const" }));
  });
};

/** Linha de código escrita letra a letra: shown = quantas letras aparecem; appearAt(i) = quadro em que a letra i nasce. */
export const CodeLine: React.FC<{
  line: string;
  f: number;
  appearAt: (i: number) => number;
  tokenize?: (l: string) => Tok[];
  bornDur?: number;
  light?: boolean;
}> = ({ line, f, appearAt, tokenize = tokenizeDark, bornDur = 16, light = false }) => {
  const toks = tokenize(line);
  let idx = 0;
  const spans: React.ReactNode[] = [];
  toks.forEach((t, ti) => {
    for (const ch of t.text) {
      const at = appearAt(idx);
      idx++;
      if (f < at) continue;
      spans.push(
        <span key={`${ti}-${idx}`} style={{ ...born(f - at, t.color, bornDur, light), fontStyle: t.italic ? "italic" : undefined }}>
          {ch}
        </span>,
      );
    }
  });
  return <span style={{ whiteSpace: "pre" }}>{spans}</span>;
};
