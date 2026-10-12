// Código que aparece na tela (parte 2 e parte 4).

export const CODE_P2 = [
  "export const Motion = () => (",
  "  <>",
  '    <Riscos entram="bordas" />',
  '    <Simbolo nasce="centro" />',
  '    <Saudacao texto="Boa noite" />',
  '    <Caixa pergunta="Como posso ajudar?" />',
  "  </>",
  ");",
];

export const CODE_P2_SHORT = [
  "export const Motion = () => (",
  "  <>",
  "    <Riscos />",
  "    <Simbolo />",
  "    <Saudacao />",
  "    <Caixa />",
  "  </>",
  ");",
];

// As linhas que substituem as faixas da linha do tempo.
export const TRACK_CODE = [
  '<Riscos entram="bordas" />',
  '<Simbolo nasce="centro" />',
  '<Saudacao texto="Boa noite" />',
  '<Caixa pergunta="Como posso ajudar?" />',
  '<Brilho cor="laranja" />',
];

// [nível de recuo, texto]
export const CODE_P4: [number, string][] = [
  [0, 'import { Easing, interpolate, useCurrentFrame } from "remotion";'],
  [0, ""],
  [0, "type Props = { text: string; delay: number };"],
  [0, ""],
  [0, "export const Title: React.FC<Props> = ({ text, delay }) => {"],
  [1, "const frame = useCurrentFrame() - delay;"],
  [1, "const opacity = interpolate(frame, [0, 18], [0, 1], {"],
  [2, 'extrapolateLeft: "clamp",'],
  [2, 'extrapolateRight: "clamp",'],
  [1, "});"],
  [1, "const rise = interpolate(frame, [0, 24], [40, 0], {"],
  [2, "easing: Easing.out(Easing.cubic),"],
  [2, 'extrapolateLeft: "clamp",'],
  [2, 'extrapolateRight: "clamp",'],
  [1, "});"],
  [1, "const blur = Math.max(0, 12 - frame);"],
  [0, ""],
  [1, "return ("],
  [2, "<h1 style={{ opacity, top: rise, filter: `blur(${blur}px)` }}>"],
  [3, "{text}"],
  [2, "</h1>"],
  [1, ");"],
  [0, "};"],
];
