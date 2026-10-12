import React from "react";
import { AbsoluteFill } from "remotion";
import { config } from "../config";
import { C, INTER, born, ease, easeIn, easeOut, mix, motionBlur, prog, snap } from "../theme";
import { glowGradient } from "../components/Background";
import { Avatar, Faceless, HEART, IconGif, IconPhoto } from "../components/Pieces";

// Câmera do celular: [quadro, aproximação, borda esquerda, topo]
const CAM: [number, number, number, number][] = [
  [1490, 2.2, 120, -330],
  [1505, 3.1, 22, -1195],
  [1531, 3.16, 16, -1215],
  [1543, 3.1, 24, -1120],
  [1606, 3.16, 16, -1140],
];
const camAt = (f: number) => {
  if (f <= CAM[0][0]) return CAM[0];
  for (let i = 1; i < CAM.length; i++) {
    if (f <= CAM[i][0]) {
      const p = prog(f, CAM[i - 1][0], CAM[i][0], ease);
      return CAM[i].map((v, j) => mix(CAM[i - 1][j], v, p)) as [number, number, number, number];
    }
  }
  return CAM[CAM.length - 1];
};

const WORD = config.palavraComentario;
const TYPE_START = 1507;
const TYPE_STEP = 4;
const SEND = 1531;

const Bar: React.FC<{ w: number; h?: number }> = ({ w, h = 9 }) => (
  <div style={{ width: w, height: h, borderRadius: h / 2, background: "#e3e3e3", display: "inline-block" }} />
);

const SmallHeart: React.FC<{ filled?: number }> = ({ filled = 0 }) => (
  <svg width={14} height={14} viewBox="0 0 24 24" style={{ display: "block", overflow: "visible" }}>
    <path d={HEART} fill={filled > 0 ? "#000" : "none"} stroke={filled > 0 ? "#000" : C.igGray} strokeWidth={2} strokeLinejoin="round" />
  </svg>
);

const OtherComment: React.FC<{ text: string; time: string }> = ({ text, time }) => (
  <div style={{ height: 74, display: "flex", padding: "8px 16px 0 16px", boxSizing: "border-box", gap: 12 }}>
    <div style={{ width: 35, height: 35, borderRadius: 18, background: "#dbdbdb", flexShrink: 0 }} />
    <div style={{ flex: 1, fontFamily: INTER, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, height: 16 }}>
        <Bar w={64} />
        <span style={{ fontSize: 12.5, color: C.igGray }}>{time}</span>
      </div>
      <div style={{ fontSize: 15.5, color: "#000", lineHeight: "20px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{text}</div>
      <div style={{ fontSize: 13, color: C.igGray, fontWeight: 500, marginTop: 2 }}>Reply</div>
    </div>
    <div style={{ paddingTop: 14 }}>
      <SmallHeart />
    </div>
  </div>
);

const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const KW = 35.5;
const KH = 46;
const KG = 6;

const Keyboard: React.FC<{ f: number; typedKey: string | null; keyAge: number; suggestion: string }> = ({ typedKey, keyAge, suggestion }) => {
  const press = typedKey && keyAge >= 0 && keyAge < 4 ? Math.sin((Math.PI * keyAge) / 4) : 0;
  const key = (label: string, x: number, y: number, w: number, special = false, font = 22) => {
    const active = label === typedKey && press > 0;
    return (
      <div
        key={`${label}-${x}`}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: KH,
          borderRadius: 6,
          background: active ? "#bdbdbd" : special ? C.kbSpecial : "#ffffff",
          boxShadow: "0 1px 0 rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: INTER,
          fontSize: font,
          color: "#000",
          transform: active ? `scale(${1 + 0.15 * press})` : undefined,
          zIndex: active ? 2 : 1,
        }}
      >
        {label}
      </div>
    );
  };
  const rowX = (n: number) => (430 - (n * KW + (n - 1) * KG)) / 2;
  const keys: React.ReactNode[] = [];
  KEY_ROWS.forEach((row, r) => {
    const x0 = rowX(row.length);
    row.split("").forEach((ch, i) => keys.push(key(ch, x0 + i * (KW + KG), 48 + r * 54, KW)));
  });
  // teclas especiais
  keys.push(key("⇧", 6, 48 + 2 * 54, 44, false, 20));
  keys.push(key("⌫", 430 - 6 - 44, 48 + 2 * 54, 44, true, 18));
  const y4 = 48 + 3 * 54;
  keys.push(key("123", 6, y4, 46, true, 16));
  keys.push(key("☺", 58, y4, 40, true, 20));
  keys.push(key("space", 104, y4, 206, false, 16));
  keys.push(key("@", 316, y4, 52, true, 18));
  keys.push(key("#", 374, y4, 50, true, 18));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 430, height: 932 - 566, background: C.kb }}>
      <div style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontSize: 16, color: "#000" }}>
        {suggestion ? `“${suggestion}”` : ""}
      </div>
      {keys}
    </div>
  );
};

const PhoneScreen: React.FC<{ f: number }> = ({ f }) => {
  const typed = Math.max(0, Math.min(WORD.length, Math.floor((f - TYPE_START) / TYPE_STEP) + 1));
  const typedText = f >= TYPE_START && f < SEND + 1 ? WORD.slice(0, typed) : "";
  const curIdx = typed - 1;
  const typedKey = f < SEND && curIdx >= 0 ? WORD[curIdx] : null;
  const keyAge = f - (TYPE_START + curIdx * TYPE_STEP);
  const open = prog(f, 1532, 1541, ease);
  const sheetTop = mix(280, 373, open);
  const reactY = mix(485, 813, open);
  const fieldY = mix(537, 866, open);
  const kbY = 566 + open * 380;
  const pillIn = prog(f, TYPE_START, TYPE_START + 8, snap) * (1 - prog(f, SEND + 2, SEND + 6, ease));
  const pillPress = f >= SEND - 1 && f <= SEND + 5 ? Math.sin(Math.PI * prog(f, SEND - 1, SEND + 5, (x) => x)) : 0;
  // toque do dedo
  const tap = prog(f, SEND - 4, SEND + 8, (x) => x);
  const newIn = prog(f, 1532, 1541, ease);
  const replyIn = prog(f, 1541, 1549, ease);
  const liked = prog(f, 1560, 1567, snap);
  const part2Age = f - 1570;
  const highlight = 1 - prog(f, 1532, 1557, ease);
  const listTop = sheetTop + 64;
  const reactions = ["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"];
  return (
    <div style={{ position: "relative", width: 430, height: 932, background: "#000", overflow: "hidden", borderRadius: 56 }}>
      {/* Reel encolhido */}
      <div style={{ position: "absolute", left: 138, top: 65, width: 154, height: 206, borderRadius: 18, overflow: "hidden", background: "#0a0a0a" }}>
        <div style={{ position: "absolute", inset: 0, background: glowGradient(0.35, 120, "255,255,255", 154, 206, 0.12) }} />
      </div>
      <div style={{ position: "absolute", left: 34, top: 16, fontFamily: INTER, fontWeight: 600, fontSize: 16, color: "#fff" }}>9:41</div>
      {/* folha de comentários */}
      <div style={{ position: "absolute", left: 0, top: sheetTop, width: 430, height: 932, background: "#fff", borderRadius: "22px 22px 0 0" }}>
        <div style={{ position: "absolute", left: 197, top: 8, width: 36, height: 4.5, borderRadius: 3, background: "#d0d0d0" }} />
        <div style={{ position: "absolute", left: 16, top: 26, fontFamily: INTER, fontSize: 13.5, color: C.igGray, fontWeight: 500 }}>For you ⌄</div>
        <div style={{ position: "absolute", right: 18, top: 20, fontFamily: INTER, fontSize: 18, fontWeight: 700, color: "#000" }}>···</div>
      </div>
      {/* lista */}
      <div style={{ position: "absolute", left: 0, top: listTop, width: 430 }}>
        {/* comentário novo */}
        <div style={{ height: 74 * newIn, overflow: "hidden", background: `rgba(242,242,242,${highlight})` }}>
          <div style={{ height: 74, display: "flex", padding: "8px 16px 0 16px", boxSizing: "border-box", gap: 12, opacity: newIn }}>
            <Faceless size={35} />
            <div style={{ flex: 1, fontFamily: INTER }}>
              <div style={{ fontSize: 12.5, height: 16, display: "flex", alignItems: "center", gap: 4 }}>
                <b style={{ fontWeight: 600, color: "#000" }}>you</b>
                <span style={{ color: C.igGray }}>now</span>
                {liked > 0 && (
                  <span style={{ color: C.igGray, display: "flex", alignItems: "center", gap: 3, opacity: Math.min(1, liked) }}>
                    · <SmallHeart filled={1} /> by author
                  </span>
                )}
              </div>
              <div style={{ fontSize: 15.5, lineHeight: "20px", ...born(f - 1532, "#000", 16, true) }}>{WORD}</div>
              <div style={{ fontSize: 13, color: C.igGray, fontWeight: 500, marginTop: 2 }}>Reply</div>
            </div>
            <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ transform: `scale(${liked > 0 ? liked : 1})` }}>
                <SmallHeart filled={liked > 0.3 ? 1 : 0} />
              </div>
              {liked > 0 && <span style={{ fontFamily: INTER, fontSize: 11, color: C.igGray }}>1</span>}
            </div>
          </div>
        </div>
        {/* resposta do autor */}
        <div style={{ height: 100 * replyIn, overflow: "hidden" }}>
          <div style={{ height: 100, display: "flex", padding: "6px 16px 0 63px", boxSizing: "border-box", gap: 10, opacity: replyIn }}>
            <Avatar size={28} />
            <div style={{ flex: 1, fontFamily: INTER, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, height: 16, display: "flex", alignItems: "center", gap: 4 }}>
                <b style={{ fontWeight: 600, color: "#000" }}>{config.perfilInstagram}</b>
                <span style={{ color: C.igGray }}>now · Author</span>
              </div>
              <div style={{ fontSize: 15.5, lineHeight: "20px", color: "#000" }}>
                <div style={{ whiteSpace: "nowrap" }}>
                  {(() => {
                    const [first, ...rest] = config.respostaAutor1.split(" ");
                    return (
                      <>
                        <b style={{ fontWeight: 700 }}>{first}</b> {rest.join(" ")}
                      </>
                    );
                  })()}
                  {part2Age >= 0 && <span style={born(part2Age, "#000", 16, true)}> {config.respostaAutor2.split(" ").slice(0, 2).join(" ")}</span>}
                </div>
                <div style={{ whiteSpace: "nowrap", minHeight: 20 }}>
                  {part2Age >= 0 && <span style={born(part2Age - 2, "#000", 16, true)}>{config.respostaAutor2.split(" ").slice(2).join(" ")}</span>}
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.igGray, fontWeight: 500, marginTop: 2 }}>Reply</div>
            </div>
          </div>
        </div>
        {config.comentariosPost.map((t, i) => (
          <OtherComment key={i} text={t} time={["2h", "3h", "5h"][i]} />
        ))}
      </div>
      {/* faixa de reações */}
      <div style={{ position: "absolute", left: 0, top: reactY - 26, width: 430, height: 52, background: "#fff", borderTop: `1px solid ${C.igDiv}`, display: "flex", alignItems: "center", justifyContent: "space-around", padding: "0 10px", boxSizing: "border-box" }}>
        {reactions.map((e) => (
          <span key={e} style={{ fontSize: 24, filter: "grayscale(1)" }}>
            {e}
          </span>
        ))}
      </div>
      {/* campo de comentário */}
      <div style={{ position: "absolute", left: 0, top: fieldY - 28, width: 430, height: 932, background: "#fff" }}>
        <div style={{ position: "absolute", left: 16, top: 28 - 21, width: 42, height: 42, borderRadius: 21, background: "#efefef", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconPhoto size={20} color="#000" stroke={1.7} />
        </div>
        <div style={{ position: "absolute", left: 75, top: 28 - 23.5, width: 337, height: 47, borderRadius: 24, border: `1px solid ${C.igBorder}`, boxSizing: "border-box", display: "flex", alignItems: "center", paddingLeft: 16 }}>
          {typedText ? (
            <span style={{ fontFamily: INTER, fontSize: 16, display: "flex" }}>
              {typedText.split("").map((ch, i) => (
                <span key={i} style={born(f - (TYPE_START + i * TYPE_STEP), "#000", 16, true)}>
                  {ch}
                </span>
              ))}
            </span>
          ) : (
            f < SEND && <span style={{ fontFamily: INTER, fontSize: 16, color: C.igGray }}>Add a comment...</span>
          )}
          {f < SEND + 2 && (
            <span style={{ display: "inline-block", width: 2, height: 20, marginLeft: 1, background: "#000", opacity: typedText || Math.floor(f / 15) % 2 === 0 ? 1 : 0 }} />
          )}
          {pillIn < 1 && (
            <div style={{ position: "absolute", right: 12, display: "flex", gap: 12, opacity: 1 - pillIn }}>
              <IconPhoto size={22} color="#000" stroke={1.7} />
              <IconGif size={22} color="#000" stroke={1.7} />
            </div>
          )}
          {pillIn > 0 && (
            <div
              style={{
                position: "absolute",
                right: 6,
                width: 54,
                height: 34,
                borderRadius: 17,
                background: C.igSend,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${pillIn * (1 - 0.14 * pillPress)})`,
              }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24">
                <path d="M12 19 L12 5 M5.5 11.5 L12 5 L18.5 11.5" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
          )}
          {/* toque do dedo */}
          {tap > 0 && tap < 1 && (
            <>
              <div
                style={{
                  position: "absolute",
                  right: 6 + 27 - 17,
                  top: 23.5 - 17,
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  background: `rgba(120,120,120,${0.45 * Math.sin(Math.PI * tap)})`,
                  transform: `scale(${mix(1.4, 0.85, Math.min(1, tap * 2))})`,
                }}
              />
              {tap > 0.35 && (
                <div
                  style={{
                    position: "absolute",
                    right: 6 + 27 - 17 - 20 * (tap - 0.35),
                    top: 23.5 - 17 - 20 * (tap - 0.35),
                    width: 34 + 40 * (tap - 0.35),
                    height: 34 + 40 * (tap - 0.35),
                    borderRadius: "50%",
                    border: `1.5px solid rgba(110,110,110,${1 - tap})`,
                    boxSizing: "border-box",
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
      {/* teclado */}
      <div style={{ position: "absolute", left: 0, top: kbY, width: 430 }}>
        <Keyboard f={f} typedKey={typedKey} keyAge={keyAge} suggestion={typedText} />
      </div>
    </div>
  );
};

export const Part5: React.FC<{ frame: number }> = ({ frame: f }) => {
  if (f < 1490 || f > 1616) return null;
  const [z, left, top] = camAt(f).slice(1) as [number, number, number];
  const enter = prog(f, 1490, 1501, easeOut);
  const enterBlur = motionBlur(f, 1490, 1501, 14, easeOut);
  const out = prog(f, 1604, 1615, easeIn);
  const outBlur = motionBlur(f, 1604, 1615, 14, easeIn);
  const blur = enterBlur + outBlur;
  return (
    <AbsoluteFill
      style={{
        opacity: enter * (1 - out),
        transform: `translateY(${(1 - enter) * 320}px) scale(${1 - 0.06 * out})`,
        transformOrigin: "700px 540px",
        filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 430,
          height: 932,
          transformOrigin: "0 0",
          transform: `translate(${left}px, ${top}px) scale(${z})`,
          borderRadius: 56,
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(255,255,255,0.08)",
        }}
      >
        <PhoneScreen f={f} />
      </div>
    </AbsoluteFill>
  );
};
