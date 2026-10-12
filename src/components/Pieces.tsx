import React from "react";
import { C } from "../theme";

const LENS = [1, 0.88, 0.95, 0.84, 0.99, 0.9, 0.96, 0.86, 1, 0.89, 0.94, 0.85];
const WIDTHS = [6.4, 5.6, 6.2, 5.4, 6.6, 5.8, 6.2, 5.4, 6.6, 5.6, 6, 5.4];
const DEV = [2, -3, 1.5, -2.5, 3.5, -1, 2.5, -3.5, 1, -2, 3, -1.5];

/** O símbolo: asterisco de 12 pontas. size = lado do quadro em px. */
export const ClaudeSymbol: React.FC<{
  size: number;
  color?: string;
  rotate?: number;
  style?: React.CSSProperties;
}> = ({ size, color = C.cream, rotate = 0, style }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible", display: "block", ...style }}>
    <g transform={`rotate(${rotate} 100 100)`}>
      {LENS.map((l, i) => {
        const a = ((i * 30 + DEV[i]) * Math.PI) / 180;
        const x = 100 + Math.sin(a) * 94 * l;
        const y = 100 - Math.cos(a) * 94 * l;
        return (
          <line key={i} x1={100} y1={100} x2={x} y2={y} stroke={color} strokeWidth={WIDTHS[i]} strokeLinecap="round" />
        );
      })}
    </g>
  </svg>
);

/** Símbolo centrado num ponto (cx, cy) da tela/contêiner. */
export const SymbolAt: React.FC<{
  cx: number;
  cy: number;
  size: number;
  rotate?: number;
  opacity?: number;
  color?: string;
  blur?: number;
  halo?: number;
}> = ({ cx, cy, size, rotate = 0, opacity = 1, color, blur = 0, halo = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: cx - size / 2,
      top: cy - size / 2,
      width: size,
      height: size,
      opacity,
      filter: [blur > 0.05 ? `blur(${blur}px)` : "", halo > 0 ? `drop-shadow(0 0 ${size * 0.18}px rgba(255,255,255,${halo}))` : ""]
        .join(" ")
        .trim() || undefined,
    }}
  >
    <ClaudeSymbol size={size} rotate={rotate} color={color} />
  </div>
);

/** Botão de enviar laranja com seta creme. */
/** Botão de enviar. No escuro: quadrado branco e seta preta. No claro (light): quadrado preto e seta branca. */
export const SendButton: React.FC<{ size: number; scale?: number; style?: React.CSSProperties; light?: boolean }> = ({
  size,
  scale = 1,
  style,
  light = false,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.27,
      background: light ? "#0b0b0b" : "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: `scale(${scale})`,
      ...style,
    }}
  >
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24">
      <path d="M12 19 L12 5 M5.5 11.5 L12 5 L18.5 11.5" stroke={light ? "#ffffff" : "#0b0b0b"} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  </div>
);

/** Seta do Mac. A ponta (3,2) do desenho 24x30 fica no ponto (x, y). height = altura em px. */
export const MacCursor: React.FC<{
  x: number;
  y: number;
  height: number;
  scale?: number;
  opacity?: number;
  fill?: string;
  outline?: string;
}> = ({ x, y, height, scale = 1, opacity = 1, fill = "#000", outline = "#fff" }) => {
  const k = height / 30;
  return (
    <svg
      width={24 * k}
      height={30 * k}
      viewBox="0 0 24 30"
      style={{
        position: "absolute",
        left: x - 3 * k,
        top: y - 2 * k,
        overflow: "visible",
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: `${3 * k}px ${2 * k}px`,
        filter: `drop-shadow(0 ${2 * k}px ${3 * k}px rgba(0,0,0,0.28))`,
      }}
    >
      <path
        d="M3,2 L3,21.5 L7.9,17.2 L11.2,24.6 L14.2,23.3 L10.9,16 L17.5,16 Z"
        fill={outline}
        stroke={outline}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path d="M3,2 L3,21.5 L7.9,17.2 L11.2,24.6 L14.2,23.3 L10.9,16 L17.5,16 Z" fill={fill} />
    </svg>
  );
};

/** Check de pronto. No claro (light): bolinha preta e visto branco. No escuro: bolinha branca e visto preto. */
export const Check: React.FC<{ size: number; light?: boolean }> = ({ size, light = false }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: "block" }}>
    <circle cx={20} cy={20} r={20} fill={light ? "#0b0b0b" : "#ffffff"} />
    <path d="M11.5 20.5 L17.5 26.5 L29 14" stroke={light ? "#ffffff" : "#0b0b0b"} strokeWidth={4.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Estrela da Supernova (x de -54 a 54, y de -64 a 90). height = altura em px. */
export const STAR_PATH = "M0,-64 C5,-23 18,-6 54,0 C18,6 6,30 0,90 C-6,30 -18,6 -54,0 C-18,-6 -5,-23 0,-64Z";
export const SupernovaStar: React.FC<{ height: number; color?: string }> = ({ height, color = C.cream }) => (
  <svg width={(height * 108) / 154} height={height} viewBox="-54 -64 108 154" style={{ display: "block", overflow: "visible" }}>
    <path d={STAR_PATH} fill={color} />
  </svg>
);

/** Avatar do perfil: círculo preto com a estrela branca. */
export const Avatar: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", flexShrink: 0 }}>
    <circle cx={50} cy={50} r={50} fill="#000" />
    <g transform="translate(50 46) scale(0.36)">
      <path d={STAR_PATH} fill="#fff" />
    </g>
  </svg>
);

/** Pessoa sem rosto. */
export const Faceless: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", flexShrink: 0 }}>
    <defs>
      <clipPath id="facelessClip">
        <circle cx={50} cy={50} r={50} />
      </clipPath>
    </defs>
    <circle cx={50} cy={50} r={50} fill="#dbdbdb" />
    <g clipPath="url(#facelessClip)" fill="#fff">
      <circle cx={50} cy={39} r={17} />
      <ellipse cx={50} cy={92} rx={33} ry={28} />
    </g>
  </svg>
);

/** Ícones de traço fino do Instagram. */
type IconProps = { size: number; color?: string; stroke?: number; fill?: string };
const Icon: React.FC<IconProps & { children: React.ReactNode }> = ({ size, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0, overflow: "visible" }}>
    {children}
  </svg>
);
const sp = (color: string, w: number) => ({
  stroke: color,
  strokeWidth: w,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});
export const HEART = "M12 20.5 C10 19 2.8 14.4 2.8 8.6 C2.8 5.6 5 3.5 7.6 3.5 C9.5 3.5 11.1 4.6 12 6.2 C12.9 4.6 14.5 3.5 16.4 3.5 C19 3.5 21.2 5.6 21.2 8.6 C21.2 14.4 14 19 12 20.5 Z";
export const IconHeart: React.FC<IconProps> = ({ size, color = "#000", stroke = 1.8, fill }) => (
  <Icon size={size}>
    <path d={HEART} {...sp(color, stroke)} fill={fill ?? "none"} stroke={fill ?? color} />
  </Icon>
);
export const IconComment: React.FC<IconProps> = ({ size, color = "#000", stroke = 1.8 }) => (
  <Icon size={size}>
    <path d="M20.7 16.6 A9.3 9.3 0 1 0 17.3 20 L21.5 21.4 Z" {...sp(color, stroke)} />
  </Icon>
);
export const IconRepost: React.FC<IconProps> = ({ size, color = "#000", stroke = 1.8 }) => (
  <Icon size={size}>
    <path d="M4 11 V9 A3.5 3.5 0 0 1 7.5 5.5 H19 M16 2.5 L19 5.5 L16 8.5" {...sp(color, stroke)} />
    <path d="M20 13 V15 A3.5 3.5 0 0 1 16.5 18.5 H5 M8 21.5 L5 18.5 L8 15.5" {...sp(color, stroke)} />
  </Icon>
);
export const IconShare: React.FC<IconProps> = ({ size, color = "#000", stroke = 1.8 }) => (
  <Icon size={size}>
    <path d="M21.5 3 L10 13.5 M21.5 3 L14.6 21 L10 13.5 L2.5 9.2 Z" {...sp(color, stroke)} />
  </Icon>
);
export const IconBookmark: React.FC<IconProps> = ({ size, color = "#000", stroke = 1.8 }) => (
  <Icon size={size}>
    <path d="M19 21 L12 15 L5 21 V3.5 H19 Z" {...sp(color, stroke)} />
  </Icon>
);
export const IconPhoto: React.FC<IconProps> = ({ size, color = "#000", stroke = 1.8 }) => (
  <Icon size={size}>
    <rect x={3} y={3} width={18} height={18} rx={4.5} {...sp(color, stroke)} />
    <circle cx={8.5} cy={8.5} r={1.6} {...sp(color, stroke)} />
    <path d="M21 15.5 L15.5 10.5 L6 20" {...sp(color, stroke)} />
  </Icon>
);
export const IconGif: React.FC<IconProps> = ({ size, color = "#000", stroke = 1.8 }) => (
  <Icon size={size}>
    <rect x={2.5} y={4.5} width={19} height={15} rx={3.5} {...sp(color, stroke)} />
    <text x={12} y={15.2} textAnchor="middle" fontSize={7.4} fontWeight={700} fill={color} fontFamily="Arial, sans-serif">
      GIF
    </text>
  </Icon>
);
