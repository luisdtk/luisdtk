import React from "react";
import { AbsoluteFill, Easing, OffthreadVideo, getStaticFiles, staticFile } from "remotion";
import { config } from "../config";
import { C, INTER, SERIF, ease, easeIn, easeOut, mix, motionBlur, prog, snap } from "../theme";
import { glowGradient } from "../components/Background";
import { Avatar, ClaudeSymbol, IconBookmark, IconComment, IconHeart, IconRepost, IconShare } from "../components/Pieces";

/** 81300 -> "81,3 mil"; 66 -> "66". */
export const formatCount = (n: number) => {
  const v = Math.floor(n);
  if (v < 1000) return String(v);
  const tenths = Math.floor(v / 100) / 10;
  return `${tenths.toFixed(1).replace(".", ",")} mil`;
};

const count = (f: number, a: number, b: number, target: number) => target * prog(f, a, b, easeOut);

const hasPostVideo = () => getStaticFiles().some((s) => s.name === "meu-post.mp4");

const PostVideo: React.FC<{ f: number }> = ({ f }) => {
  if (hasPostVideo()) {
    return <OffthreadVideo src={staticFile("meu-post.mp4")} muted style={{ width: 600, height: 800, objectFit: "cover", filter: "grayscale(1)" }} />;
  }
  return (
    <div style={{ width: 600, height: 800, position: "relative", background: C.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: glowGradient(0.3, 520, "255,255,255", 600, 800, 0.42) }} />
      <div style={{ position: "absolute", left: 300 - 80, top: 400 - 80 }}>
        <ClaudeSymbol size={160} rotate={f * 0.8} />
      </div>
    </div>
  );
};

const GrayBar: React.FC<{ w: number; h?: number; color?: string; style?: React.CSSProperties }> = ({ w, h = 14, color = "#e6e6e6", style }) => (
  <div style={{ width: w, height: h, borderRadius: h / 2, background: color, ...style }} />
);

const Phone: React.FC<{ f: number }> = ({ f }) => {
  const OTHER_H = 66 + 600 + 64;
  const scroll = mix(0, OTHER_H, prog(f, 686, 703, Easing.out(Easing.back(1.15))));
  const likes = count(f, 714, 775, config.curtidas);
  const comments = count(f, 728, 775, config.comentarios);
  return (
    <div
      style={{
        position: "absolute",
        left: 190,
        top: 30,
        width: 600,
        height: 1240,
        borderRadius: 54,
        background: "#fff",
        border: "2px solid #e4e4e4",
        boxSizing: "border-box",
        overflow: "hidden",
        boxShadow: "0 40px 120px rgba(0,0,0,0.55), 0 0 90px rgba(255,255,255,0.14)",
      }}
    >
      {/* feed */}
      <div style={{ position: "absolute", left: 0, top: 74 - scroll, width: 600 }}>
        {/* post coberto de outra pessoa */}
        <div style={{ height: 66, display: "flex", alignItems: "center", padding: "0 16px", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 22, background: "#dbdbdb" }} />
          <div>
            <GrayBar w={150} />
            <GrayBar w={90} h={10} style={{ marginTop: 8 }} />
          </div>
        </div>
        <div style={{ width: 600, height: 600, background: "#e9e9e9" }} />
        <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 16px", gap: 14 }}>
          <GrayBar w={120} />
        </div>
        {/* meu post */}
        <div style={{ height: 66, display: "flex", alignItems: "center", padding: "0 14px", gap: 12 }}>
          <Avatar size={44} />
          <div style={{ fontFamily: INTER, lineHeight: 1.2 }}>
            <div style={{ fontWeight: 600, fontSize: 21, color: "#000" }}>{config.perfilInstagram}</div>
            <div style={{ fontSize: 17, color: "#000" }}>Áudio original</div>
          </div>
          <div style={{ marginLeft: "auto", fontFamily: INTER, fontSize: 24, fontWeight: 700, color: "#000", letterSpacing: 1 }}>···</div>
        </div>
        <PostVideo f={f} />
        <div style={{ height: 58, display: "flex", alignItems: "center", padding: "0 14px", gap: 8, fontFamily: INTER, fontWeight: 600, fontSize: 19, color: "#000" }}>
          <IconHeart size={30} />
          <span style={{ marginRight: 14 }}>{formatCount(likes)}</span>
          <IconComment size={29} />
          <span style={{ marginRight: 14 }}>{formatCount(comments)}</span>
          <IconRepost size={29} />
          <span style={{ marginRight: 14 }}>{config.republicacoes}</span>
          <IconShare size={28} />
          <div style={{ marginLeft: "auto" }}>
            <IconBookmark size={29} />
          </div>
        </div>
        <div style={{ padding: "0 14px", fontFamily: INTER, fontSize: 19, color: "#000" }}>
          <b style={{ fontWeight: 600 }}>{config.perfilInstagram}</b> <span style={{ color: C.igMention, textDecoration: "underline", textDecorationColor: "rgba(0,0,0,0.25)", textUnderlineOffset: 4 }}>{config.legendaPost}</span>
        </div>
      </div>
      {/* barra de cima */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 600, height: 74, background: "#fff", display: "flex", alignItems: "flex-end", paddingBottom: 12, boxSizing: "border-box" }}>
        <span style={{ marginLeft: 22, fontFamily: INTER, fontWeight: 700, fontSize: 30, color: "#000", letterSpacing: -0.5 }}>Instagram</span>
        <div style={{ marginLeft: "auto", marginRight: 22, display: "flex", gap: 22 }}>
          <IconHeart size={30} />
          <IconShare size={29} />
        </div>
      </div>
    </div>
  );
};

const Numbers: React.FC<{ f: number }> = ({ f }) => {
  const out = prog(f, 783, 792, easeIn);
  const outBlur = motionBlur(f, 783, 792, 14, easeIn);
  if (f > 793) return null;
  const views = count(f, 700, 775, config.visualizacoes);
  const likes = count(f, 714, 775, config.curtidas);
  const comments = count(f, 728, 775, config.comentarios);
  const pulse = f >= 775 && f <= 787 ? Math.sin(Math.PI * prog(f, 775, 787, (x) => x)) : 0;
  const row = (start: number) => {
    const p = prog(f, start, start + 12, easeOut);
    const b = motionBlur(f, start, start + 12, 8, easeOut);
    return { opacity: p, transform: `translateY(${(1 - p) * 60}px)`, filter: b > 0.1 ? `blur(${b}px)` : undefined };
  };
  return (
    <div
      style={{
        position: "absolute",
        left: 900,
        top: 250,
        transform: `translateY(${-70 * out}px)`,
        opacity: 1 - out,
        filter: outBlur > 0.1 ? `blur(${outBlur}px)` : undefined,
      }}
    >
      <div style={row(698)}>
        <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 216, lineHeight: "220px", color: C.accent, transform: `scale(${1 + 0.07 * pulse})`, transformOrigin: "0 60%", whiteSpace: "nowrap", letterSpacing: -2 }}>
          {formatCount(views)}
        </div>
        <div style={{ fontFamily: INTER, fontSize: 42, color: "#8a8a8a", marginTop: 4 }}>visualizações</div>
      </div>
      <div style={{ display: "flex", gap: 110, marginTop: 70 }}>
        {[
          { v: likes, l: "curtidas", s: 710 },
          { v: comments, l: "comentários", s: 722 },
        ].map((it) => (
          <div key={it.l} style={row(it.s)}>
            <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 112, lineHeight: "120px", color: C.cream, whiteSpace: "nowrap" }}>{formatCount(it.v)}</div>
            <div style={{ fontFamily: INTER, fontSize: 36, color: "#8a8a8a", marginTop: 4 }}>{it.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Comments: React.FC<{ f: number }> = ({ f }) => {
  if (f < 792) return null;
  return (
    <>
      {config.comentariosPost.map((text, i) => {
        const s = [792, 809, 826][i];
        if (f < s) return null;
        const p = prog(f, s, s + 12, snap);
        const b = motionBlur(f, s, s + 12, 10, easeOut);
        const tilt = [-1.2, 0.9, -0.6][i];
        const drift = -(f - s) * 0.42;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 900 + (i === 1 ? 34 : 0),
              top: [232, 454, 676][i],
              width: 840,
              borderRadius: 34,
              background: "rgba(28,26,28,0.96)",
              border: `1.5px solid ${C.boxBorder}`,
              boxShadow: C.boxShadow,
              boxSizing: "border-box",
              padding: "28px 34px 30px 30px",
              display: "flex",
              gap: 24,
              opacity: Math.min(1, prog(f, s, s + 5)),
              transform: `translateY(${(1 - p) * 70 + drift}px) rotate(${tilt}deg) scale(${mix(0.85, 1, p)})`,
              filter: b > 0.1 ? `blur(${b}px)` : undefined,
            }}
          >
            <div style={{ width: 76, height: 76, borderRadius: 38, background: "#383838", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <GrayBar w={170} h={18} color="#383838" style={{ marginTop: 6, marginBottom: 16 }} />
              <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: i === 0 ? 62 : 44, lineHeight: 1.22, color: C.cream }}>{text}</div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export const Part3: React.FC<{ frame: number }> = ({ frame: f }) => {
  if (f < 686 || f > 892) return null;
  const enter = prog(f, 686, 696, easeOut);
  const enterBlur = motionBlur(f, 686, 696, 14, easeOut);
  const back = prog(f, 849, 862, ease);
  const exit = prog(f, 882, 892, easeIn);
  const exitBlur = motionBlur(f, 882, 892, 14, easeIn);
  const q = prog(f, 851, 862, easeOut);
  const qBlur = motionBlur(f, 851, 862, 14, easeOut);
  const qScale = mix(1.25, 1, q) * mix(1, 1.07, prog(f, 862, 892, (x) => x));
  return (
    <AbsoluteFill
      style={{
        transform: `translateY(${-120 * exit}px)`,
        opacity: 1 - exit,
        filter: exitBlur > 0.1 ? `blur(${exitBlur}px)` : undefined,
      }}
    >
      <AbsoluteFill style={{ opacity: 1 - 0.72 * back, filter: back > 0.01 ? `blur(${8 * back}px)` : undefined }}>
        <AbsoluteFill
          style={{
            opacity: enter,
            transform: `scale(${mix(1.2, 1, enter) * mix(1, 0.95, back)})`,
            transformOrigin: "490px 540px",
            filter: enterBlur > 0.1 ? `blur(${enterBlur}px)` : undefined,
          }}
        >
          <Phone f={f} />
        </AbsoluteFill>
        <Numbers f={f} />
        <Comments f={f} />
      </AbsoluteFill>
      {f >= 851 && (
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: 330,
              letterSpacing: "-0.03em",
              color: C.accent,
              whiteSpace: "nowrap",
              textShadow: "0 0 60px rgba(255,255,255,0.35)",
              transform: `scale(${qScale})`,
              opacity: q,
              filter: qBlur > 0.1 ? `blur(${qBlur}px)` : undefined,
            }}
          >
            {config.perguntaGrande}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
