import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FINALE, FONTS, SCENES } from "../config";
import { EnergySymbol, FourStar } from "../components/EnergySymbol";
import { TypeText } from "../components/TypeText";
import { Avatar } from "../components/UI";
import { IN, OUT, OVERSHOOT, pulse, ramp, SMOOTH } from "../lib/anim";

const T = FINALE.t;
const PHONE = { x: 250, y: 64, w: 450, h: 952 };
const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

const letterFrame = (i: number) => T.typeStart + i * T.typeEvery;

const Keyboard: React.FC<{ frame: number }> = ({ frame }) => {
  // Which key is pressed now?
  const pressed: Record<string, number> = {};
  FINALE.typed.split("").forEach((ch, i) => {
    const age = frame - letterFrame(i);
    if (age >= 0 && age < 5) pressed[ch.toUpperCase()] = 1 - age / 5;
  });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 236, background: "#1A1E26", padding: "14px 6px 0" }}>
      {KEY_ROWS.map((row, r) => (
        <div key={row} style={{ display: "flex", justifyContent: "center", gap: 5, marginBottom: 9 }}>
          {r === 2 && <div style={{ width: 50, height: 44, borderRadius: 7, background: "#2B303A" }} />}
          {row.split("").map((k) => {
            const p = pressed[k] ?? 0;
            return (
              <div key={k} style={{ position: "relative", width: 36, height: 44, borderRadius: 7, background: p > 0 ? COLORS.cyan : "#3A404C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.sans, fontSize: 19, color: p > 0 ? COLORS.bg : COLORS.text, boxShadow: p > 0 ? `0 0 ${18 * p}px ${COLORS.cyan}` : "0 1px 0 rgba(0,0,0,0.4)" }}>
                {k}
                {p > 0 && (
                  <div style={{ position: "absolute", bottom: 48, left: -6, width: 48, height: 58, borderRadius: 10, background: COLORS.cyan, color: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 600, opacity: p }}>{k}</div>
                )}
              </div>
            );
          })}
          {r === 2 && <div style={{ width: 50, height: 44, borderRadius: 7, background: "#2B303A" }} />}
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
        <div style={{ width: 86, height: 44, borderRadius: 7, background: "#2B303A" }} />
        <div style={{ width: 200, height: 44, borderRadius: 7, background: "#3A404C" }} />
        <div style={{ width: 86, height: 44, borderRadius: 7, background: "#2B303A" }} />
      </div>
    </div>
  );
};

const Comment: React.FC<{ handle: string; text: React.ReactNode; brand?: boolean; hue?: string; indent?: number; style?: React.CSSProperties }> = ({ handle, text, brand, hue, indent = 0, style }) => (
  <div style={{ display: "flex", gap: 14, padding: `12px 22px 12px ${22 + indent}px`, ...style }}>
    <Avatar size={brand ? 38 : 40} brand={brand} hue={hue} />
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: FONTS.sans, fontSize: 15, color: brand ? COLORS.cyan : COLORS.textDim, fontWeight: 600, marginBottom: 4 }}>{handle}</div>
      <div style={{ fontFamily: FONTS.sans, fontSize: 21, color: COLORS.text, lineHeight: 1.35 }}>{text}</div>
    </div>
  </div>
);

const Phone: React.FC<{ frame: number }> = ({ frame }) => {
  const posted = ramp(frame, T.posted, T.posted + 10, 0, 1, OUT);
  const r1 = ramp(frame, T.reply1, T.reply1 + 10, 0, 1, OUT);
  const r2 = ramp(frame, T.reply2, T.reply2 + 10, 0, 1, OUT);
  const send = ramp(frame, T.sendShow, T.sendShow + 6, 0, 1, OVERSHOOT);
  const tap = ramp(frame, T.sendTap, T.sendTap + 10, 0, 1, OUT);
  const tapScale = 1 - 0.15 * pulse(frame, T.sendTap + 1, 2);
  const typedVisible = frame < T.posted;
  const newH = 74 * posted;
  const replyH = 112 * r1;
  return (
    <div style={{ position: "absolute", left: PHONE.x, top: PHONE.y, width: PHONE.w, height: PHONE.h, borderRadius: 64, background: "linear-gradient(145deg, #2A2F39, #12151B)", padding: 12, boxShadow: "0 60px 140px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08), 0 0 80px rgba(98,230,255,0.08)" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 53, overflow: "hidden", background: "#0C0F14" }}>
        {/* status bar */}
        <div style={{ position: "absolute", top: 16, left: 34, right: 30, display: "flex", justifyContent: "space-between", fontFamily: FONTS.sans, fontSize: 17, fontWeight: 600, color: COLORS.text }}>
          <span>9:41</span>
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ width: 18, height: 10, borderRadius: 2, background: COLORS.text }} />
            <span style={{ width: 24, height: 12, borderRadius: 3, border: `1.5px solid ${COLORS.text}` }} />
          </span>
        </div>
        <div style={{ position: "absolute", top: 12, left: "50%", marginLeft: -55, width: 110, height: 32, borderRadius: 18, background: "#000" }} />
        {/* fictional post behind the sheet */}
        <div style={{ position: "absolute", top: 60, left: 0, right: 0, height: 240, background: "radial-gradient(ellipse at 50% 80%, rgba(98,230,255,0.25), #0C0F14 70%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <EnergySymbol size={90} rotation={frame * 1.2} glow={1} />
        </div>
        {/* comment sheet */}
        <div style={{ position: "absolute", top: 250, left: 0, right: 0, bottom: 0, background: "#141821", borderRadius: "28px 28px 0 0", boxShadow: "0 -10px 40px rgba(0,0,0,0.5)" }}>
          <div style={{ width: 44, height: 5, borderRadius: 3, background: "#3A404C", margin: "10px auto 0" }} />
          <div style={{ textAlign: "center", fontFamily: FONTS.sans, fontSize: 18, fontWeight: 600, color: COLORS.text, margin: "12px 0 6px" }}>{FINALE.postTitle}</div>
          <div style={{ height: 1, background: "rgba(146,152,165,0.15)" }} />
          <div style={{ position: "relative", height: 300, overflow: "hidden" }}>
            {/* new comment */}
            <div style={{ height: newH, overflow: "hidden", opacity: posted }}>
              <Comment
                handle="you"
                hue="#2E5560"
                text={<span style={{ fontWeight: 700, letterSpacing: "0.06em", color: COLORS.cyan }}>{FINALE.typed}</span>}
                style={{ background: `rgba(98,230,255,${0.08 * (1 - ramp(frame, T.posted + 10, T.posted + 40))})` }}
              />
            </div>
            <div style={{ height: replyH, overflow: "hidden", opacity: r1 }}>
              <Comment
                handle={FINALE.accountHandle}
                brand
                indent={40}
                text={
                  <>
                    <div>{FINALE.reply1}</div>
                    <div style={{ opacity: r2, color: COLORS.cyan, fontWeight: 600, transform: `translateY(${(1 - r2) * 8}px)` }}>{FINALE.reply2}</div>
                  </>
                }
              />
            </div>
            {FINALE.existingComments.map((c, i) => (
              <Comment key={c.handle} handle={c.handle} text={c.text} hue={["#3B4252", "#423B4C"][i]} />
            ))}
          </div>
          {/* input */}
          <div style={{ position: "absolute", left: 16, right: 16, bottom: 250, height: 58, borderRadius: 29, background: "#1E232D", border: `1.5px solid ${frame >= T.typeStart - 4 && typedVisible ? COLORS.cyan : "rgba(146,152,165,0.25)"}`, display: "flex", alignItems: "center", padding: "0 8px 0 18px", gap: 12 }}>
            <Avatar size={34} hue="#2E5560" />
            <div style={{ flex: 1, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 700, letterSpacing: "0.06em", color: COLORS.text }}>
              {typedVisible ? (
                frame >= T.typeStart ? (
                  <TypeText segments={[{ text: FINALE.typed }]} start={T.typeStart} framesPerChar={T.typeEvery} settle={8} cursor />
                ) : (
                  <span style={{ fontWeight: 400, letterSpacing: 0, color: "#6B7180", fontSize: 19 }}>Add a comment…</span>
                )
              ) : (
                <span style={{ fontWeight: 400, letterSpacing: 0, color: "#6B7180", fontSize: 19 }}>Add a comment…</span>
              )}
            </div>
            <div style={{ position: "relative", width: 42, height: 42, borderRadius: 21, background: "#2F80FF", transform: `scale(${send * tapScale})`, opacity: typedVisible ? 1 : 1 - ramp(frame, T.posted, T.posted + 6), display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 18px rgba(47,128,255,0.6)" }}>
              <svg width={20} height={20} viewBox="0 0 24 24">
                <path d="M12 19 V5 M5 12 L12 5 L19 12" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {tap > 0 && tap < 1 && <div style={{ position: "absolute", width: 42, height: 42, borderRadius: 21, border: `2px solid ${COLORS.cyan}`, transform: `scale(${1 + tap * 1.4})`, opacity: 1 - tap }} />}
            </div>
          </div>
          <Keyboard frame={frame} />
        </div>
        {/* tap indicator */}
        {frame >= T.sendTap - 6 && frame < T.sendTap + 10 && (
          <div
            style={{
              position: "absolute",
              left: PHONE.w - 12 - 16 - 8 - 21 - 22 + interpolate(frame, [T.sendTap - 6, T.sendTap], [30, 0], { extrapolateRight: "clamp" }),
              top: PHONE.h - 24 - 250 - 29 - 22 + interpolate(frame, [T.sendTap - 6, T.sendTap], [40, 0], { extrapolateRight: "clamp" }),
              width: 44,
              height: 44,
              borderRadius: 22,
              background: "rgba(255,255,255,0.35)",
              border: "2px solid rgba(255,255,255,0.8)",
              opacity: ramp(frame, T.sendTap - 6, T.sendTap - 2) * (1 - ramp(frame, T.sendTap + 4, T.sendTap + 10)),
            }}
          />
        )}
      </div>
    </div>
  );
};

/** Brand wordmark: two weights, precise tracking. Works with any name. */
const Wordmark: React.FC<{ frame: number }> = ({ frame }) => {
  const name = FINALE.brand.trim();
  const sp = name.indexOf(" ");
  const first = sp > 0 ? name.slice(0, sp) : name;
  const second = sp > 0 ? name.slice(sp + 1) : "";
  const v = ramp(frame, T.brandIn, T.brandSettled, 0, 1, OUT);
  const tracking = 0.34 - 0.14 * v; // em
  const sweep = ramp(frame, T.glow[0], T.glow[1], 0, 1, SMOOTH);
  const size = name.length > 18 ? 84 : 100;
  const text = (
    <>
      <span style={{ fontWeight: 600 }}>{first}</span>
      {second && <span style={{ fontWeight: 250, marginLeft: "0.42em" }}>{second}</span>}
    </>
  );
  const base: React.CSSProperties = {
    fontFamily: FONTS.brand,
    fontSize: size,
    letterSpacing: `${tracking}em`,
    marginRight: `-${tracking}em`, // compensate trailing tracking for true centering
    whiteSpace: "nowrap",
    lineHeight: 1,
  };
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: v }}>
      <div style={{ position: "relative" }}>
        <div style={{ ...base, color: COLORS.text }}>{text}</div>
        {sweep > 0 && sweep < 1 && (
          <div
            style={{
              ...base,
              position: "absolute",
              left: 0,
              top: 0,
              color: "transparent",
              backgroundImage: `linear-gradient(100deg, transparent 0%, transparent 40%, ${COLORS.cyan} 48%, #FFFFFF 50%, ${COLORS.cyan} 52%, transparent 60%, transparent 100%)`,
              backgroundSize: "300% 100%",
              backgroundPosition: `${100 - sweep * 100}% 0`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              filter: `drop-shadow(0 0 10px rgba(98,230,255,0.6))`,
            }}
          >
            {text}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const Finale: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < SCENES.finale.from) return null;

  // Phone + headline
  const phoneIn = ramp(frame, T.phoneIn, T.phoneIn + 18, 0, 1, OUT);
  const phoneOut = ramp(frame, T.phoneOut, T.phoneOut + 11, 0, 1, IN);
  const focus = ramp(frame, T.typeStart - 6, T.typeStart + 8, 0, 1, SMOOTH) * (1 - ramp(frame, T.posted, T.posted + 14, 0, 1, SMOOTH));
  const camScale = (1 + 0.1 * focus) * (1 - 0.18 * phoneOut) * (0.94 + 0.06 * phoneIn);
  const headIn = ramp(frame, T.headlineIn, T.headlineIn + 14, 0, 1, OUT);
  const subIn = ramp(frame, T.headlineIn + 8, T.headlineIn + 22, 0, 1, OUT);
  const headOut = ramp(frame, T.phoneOut - 3, T.phoneOut + 9, 0, 1, IN);

  // Symbol path: beside headline → center top → center-left lockup → aside
  const symIn = ramp(frame, T.headlineIn - 6, T.headlineIn + 10, 0, 1, OVERSHOOT);
  const toTop = ramp(frame, T.phoneOut, T.phoneOut + 16, 0, 1, SMOOTH);
  const toLock = ramp(frame, T.symbolsIn, T.symbolsIn + 18, 0, 1, OVERSHOOT);
  const aside = ramp(frame, T.symbolsOut, T.symbolsOut + 12, 0, 1, IN);
  const symX = interpolate(toTop, [0, 1], [1010, 960]) + (960 - 190 - 960) * toLock - 260 * aside;
  const symY = interpolate(toTop, [0, 1], [430, 300]) + (540 - 300) * toLock;
  const symSize = interpolate(toTop, [0, 1], [84, 110]) + 60 * toLock;
  const symOpacity = symIn * (1 - aside);

  const linesIn1 = ramp(frame, T.linesIn, T.linesIn + 12, 0, 1, OUT);
  const linesIn2 = ramp(frame, T.linesIn + 3, T.linesIn + 15, 0, 1, OUT);
  const linesOut = ramp(frame, T.linesOut, T.linesOut + 8, 0, 1, IN);

  const lock = ramp(frame, T.symbolsIn + 4, T.symbolsIn + 18, 0, 1, OVERSHOOT);
  const lockPulse = pulse(frame, T.symbolsIn + 18, 8);

  return (
    <AbsoluteFill>
      {/* phone */}
      {frame < T.phoneOut + 16 && (
        <AbsoluteFill
          style={{
            opacity: phoneIn * (1 - phoneOut),
            transform: `translateX(${(1 - phoneIn) * -120}px) scale(${camScale})`,
            transformOrigin: `${PHONE.x + PHONE.w / 2}px ${PHONE.y + PHONE.h - 300}px`,
          }}
        >
          <Phone frame={frame} />
        </AbsoluteFill>
      )}

      {/* headline */}
      {frame >= T.headlineIn && frame < T.phoneOut + 10 && (
        <div style={{ position: "absolute", left: 1090, top: 372, opacity: 1 - headOut, transform: `translateY(${-30 * headOut}px)` }}>
          <div style={{ fontFamily: FONTS.serif, fontSize: 76, fontWeight: 600, letterSpacing: "-0.02em", color: COLORS.text, opacity: headIn, transform: `translateY(${(1 - headIn) * 24}px)`, lineHeight: 1.1 }}>
            {FINALE.headline}
          </div>
          <div style={{ marginTop: 22, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 500, color: COLORS.textDim, opacity: subIn, transform: `translateY(${(1 - subIn) * 18}px)` }}>
            {FINALE.sub.split(" ").map((w, i) => (
              <span key={w} style={{ color: i === 2 ? COLORS.cyan : COLORS.textDim, marginRight: "0.35em" }}>
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* the energy symbol */}
      {frame >= T.headlineIn - 6 && symOpacity > 0.001 && (
        <div style={{ position: "absolute", left: symX - symSize / 2, top: symY - symSize / 2, opacity: symOpacity }}>
          <EnergySymbol size={symSize} rotation={frame * 1.5 + toLock * 90} glow={1.2 + lockPulse} />
        </div>
      )}

      {/* AI IS THE SHIFT. / ADAPT IS THE ADVANTAGE. */}
      {frame >= T.linesIn && frame < T.linesOut + 9 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 140, opacity: 1 - linesOut }}>
          <div style={{ fontFamily: FONTS.serif, fontWeight: 600, fontSize: 92, letterSpacing: "-0.01em", textAlign: "center", lineHeight: 1.15 }}>
            <div style={{ color: COLORS.text, opacity: linesIn1, transform: `translateY(${(1 - linesIn1) * 26}px)` }}>{FINALE.line1}</div>
            <div style={{ color: COLORS.cyan, opacity: linesIn2, transform: `translateY(${(1 - linesIn2) * 26}px)`, textShadow: "0 0 36px rgba(98,230,255,0.35)" }}>{FINALE.line2}</div>
          </div>
        </AbsoluteFill>
      )}

      {/* signature: symbol + four-point star */}
      {frame >= T.symbolsIn && frame < T.symbolsOut + 13 && (
        <>
          <div style={{ position: "absolute", left: 960 - 24, top: 540 - 24, width: 48, height: 48, opacity: lock * (1 - aside), transform: `scale(${lock})` }}>
            <div style={{ position: "absolute", left: 22, top: 4, width: 4, height: 40, borderRadius: 2, background: COLORS.text }} />
            <div style={{ position: "absolute", left: 4, top: 22, width: 40, height: 4, borderRadius: 2, background: COLORS.text }} />
          </div>
          <div style={{ position: "absolute", left: 960 + 190 - 85 + 260 * aside, top: 540 - 85, opacity: lock * (1 - aside), transform: `scale(${lock}) rotate(${(1 - lock) * -90}deg)` }}>
            <FourStar size={170} glow={1 + lockPulse} />
          </div>
        </>
      )}

      {/* final brand */}
      {frame >= T.brandIn && <Wordmark frame={frame} />}
    </AbsoluteFill>
  );
};
