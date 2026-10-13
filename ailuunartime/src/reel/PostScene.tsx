import { AbsoluteFill, Img, staticFile } from "remotion";

import { step, track } from "../kit/spring";
import { clamp01, progress } from "../kit/time";
import { cue } from "./cues";
import { Embers, Logo } from "./fx";
import { animSrc } from "./rig";
import { Gust, Smoke } from "./Smoke";
import { color, easeIn, easeInOut, easeOut, font, FRAME, seeded } from "./tokens";

/**
 * Scene 4, the reaction: a generic social post of the animated page, its comment sheet open,
 * new comments arriving on top and pushing the older ones down, likes climbing, hearts rising.
 * (A generic post layout: no platform's name or logo.)
 */

type Comment = { at: number; user: string; text: string; accent?: string; likes: number; brief?: boolean };

const r = cue.reaction;
// The four comments from the brief arrive in order, with other readers' comments between them.
const COMMENTS: Comment[] = [
  { at: r + 0.12, user: "yuki.panels", text: "wait, is this manga or anime?", likes: 214 },
  { at: r + 0.32, user: "kenji.reads", text: "How is this possible?", likes: 1203, brief: true },
  { at: r + 0.58, user: "rin_ink", text: "the smoke is actually moving", likes: 388 },
  { at: r + 0.82, user: "mari_draws", text: "How did you make this?", likes: 962, brief: true },
  { at: r + 1.06, user: "shonen.daily", text: "need this for every chapter", likes: 517 },
  { at: r + 1.3, user: "otaku.lens", text: "I want to read manga like this.", likes: 2410, brief: true },
  { at: r + 1.56, user: "asta.fan", text: "my jaw actually dropped", likes: 143 },
  { at: r + 1.8, user: "panelzero", text: "Is the AI era here?", accent: "AI era", likes: 3077, brief: true },
  { at: r + 2.08, user: "lumen.reads", text: "watched it five times already", likes: 96 },
];

const W = FRAME.width;
const MEDIA = { x: 0, y: 330, w: W, h: 520 };
// Yami placed in the post's media: upper body, the cigarette near the middle (measured on tools/yami.py output)
const YAMI = (() => {
  const w = 700;
  const h = (w * 1282) / 1152;
  const left = MEDIA.w / 2 - 0.66 * w;
  const top = 24;
  return { w, h, left, top, tip: { x: left + 0.6 * w, y: top + 0.205 * h } };
})();
/** Below Yami: the Asta vs Yuno spread, and nothing else. */
const FEED = [{ name: "spread", h: (MEDIA.w * 1172) / 1600 }] as const;
const FEED_GAP = 16;
const feedTop = (i: number) => MEDIA.h + FEED_GAP + FEED.slice(0, i).reduce((sum, f) => sum + f.h + FEED_GAP, 0);
const STRIP_H = feedTop(FEED.length);
const r0 = cue.reaction;
/** Scroll keys: hold on Yami, scroll down to the spread, then drift slowly down it (faces, then coats). */
const FEED_KEYS = [
  [r0, 0],
  [r0 + 0.9, feedTop(0)],
  [r0 + 1.8, feedTop(0) + FEED[0].h - MEDIA.h],
] as const;
const feedAt = (t: number) => track(t, FEED_KEYS, { stiffness: 90, damping: 18 });
const SHEET_TOP = 1010;
const ROW = 128;
const LIST_BOTTOM = 1640;

function Heart({ size, filled, fill = color.red }: { size: number; filled: boolean; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill={filled ? fill : "none"} stroke={filled ? fill : color.white} strokeWidth={1.8} />
    </svg>
  );
}

function Bubble({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.2A8 8 0 1 1 20 11.5z" fill="none" stroke={color.white} strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}

function Send({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7z" fill="none" stroke={color.white} strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${Math.round(n)}`);

/** Hearts floating up the right edge, like a live post. */
function FloatingHearts({ t, start, end }: { t: number; start: number; end: number }) {
  const rand = seeded(91);
  return (
    <>
      {Array.from({ length: 16 }, (_, i) => {
        const born = start + rand() * (end - start - 0.6);
        const life = progress(t, born, 1.1);
        if (life <= 0 || life >= 1) return null;
        const x = W - 150 + Math.sin((t - born) * 6 + i) * 26 + rand() * 40;
        const y = 900 - life * 480;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, opacity: Math.sin(life * Math.PI), scale: `${0.6 + 0.6 * easeOut(clamp01(life * 4))}` }}>
            <Heart size={44} filled fill={i % 4 === 0 ? color.white : color.red} />
          </div>
        );
      })}
    </>
  );
}

function Row({ c, t, index, total }: { c: Comment; t: number; index: number; total: Comment[] }) {
  // every comment that arrives after this one pushes it down a row
  const pushed = total.slice(index + 1).reduce((sum, later) => sum + step(t - later.at, { stiffness: 520, damping: 46 }), 0);
  // a new row waits for the others to make room, then drops into the gap
  const enter = step(t - c.at - 0.07, { stiffness: 420, damping: 34 });
  if (t < c.at) return null;
  const y = SHEET_TOP + 150 + pushed * ROW;
  if (y > LIST_BOTTOM) return null;
  const highlight = 1 - clamp01((t - c.at) / 0.6);
  const likes = c.likes * (0.6 + 0.4 * clamp01((t - c.at) / 1.2));
  const parts = c.accent ? c.text.split(c.accent) : [c.text];
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: y - (1 - enter) * 40,
        width: W,
        height: ROW,
        opacity: clamp01(enter * 2),
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "0 56px",
        boxSizing: "border-box",
        background: `rgba(226,38,43,${0.14 * highlight})`,
      }}
    >
      <div style={{ width: 72, height: 72, borderRadius: 36, flexShrink: 0, background: color.surfaceRaised, border: `2px solid ${c.brief ? color.red : color.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.mono, fontWeight: 500, fontSize: 26, color: color.white, textTransform: "uppercase" }}>
        {c.user.slice(0, 1)}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <span style={{ fontFamily: font.mono, fontSize: 24, color: color.muted }}>@{c.user}</span>
        <span style={{ fontFamily: font.ui, fontWeight: c.brief ? 600 : 400, fontSize: c.brief ? 42 : 38, color: color.white, whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
          {parts.length > 1 ? (
            <>
              {parts[0]}
              <span style={{ color: color.red }}>{c.accent}</span>
              {parts[1]}
            </>
          ) : (
            c.text
          )}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <Heart size={34} filled={Boolean(c.brief)} />
        <span style={{ fontFamily: font.mono, fontSize: 20, color: color.muted }}>{fmt(likes)}</span>
      </div>
    </div>
  );
}

/** When each comment lands, for the sound design (the brief's four get the louder pop). */
export const COMMENT_CUES = COMMENTS.map((c) => [c.at, Boolean(c.brief)] as const);

export function PostScene({ t }: { t: number }) {
  if (t < cue.readerOut || t > cue.final + 0.1) return null;

  // the post scrolls up from below as the reader leaves, like the next item in a feed
  const enter = easeInOut(progress(t, cue.readerOut, cue.reaction - cue.readerOut + 0.15));
  const sheet = step(t - cue.reaction - 0.08, { stiffness: 210, damping: 26 });
  const out = easeIn(progress(t, cue.reactionOut, 0.14));
  const likes = 9800 + 2600 * easeOut(progress(t, cue.reaction, 2.4));
  const liked = t > cue.reaction + 0.5;
  const heartPop = Math.max(0, 1 - Math.abs(t - cue.reaction - 0.5) / 0.12);
  const shown = COMMENTS.filter((c) => t >= c.at).length;
  const glow = 0.6 + 0.4 * Math.sin(t * 11);
  const push = 1 + 0.05 * clamp01((t - cue.reaction) / 2.6);
  const feed = feedAt(t);
  const feedBlur = Math.min(10, Math.abs(feedAt(t + 1 / 60) - feedAt(t - 1 / 60)) * 30 / 900);
  const dots = Math.floor(t * 6) % 4;

  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 14}px)` : undefined }}>
      {/* the post */}
      <div style={{ position: "absolute", inset: 0, translate: `0 ${(1 - enter) * FRAME.height}px` }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: FRAME.width, height: FRAME.height * 1.2, background: color.bg }} />
        <div style={{ position: "absolute", left: 56, top: 228, right: 56, height: 84, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 84, height: 84, borderRadius: 42, background: "#000", border: `3px solid ${color.red}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Logo width={60} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: font.ui, fontWeight: 600, fontSize: 32, color: color.white }}>Black Clover · Ch. 3</span>
            <span style={{ fontFamily: font.mono, fontSize: 22, color: color.muted }}>motion reader concept</span>
          </div>
          <span style={{ fontFamily: font.ui, fontWeight: 800, fontSize: 40, color: color.white, letterSpacing: "0.1em" }}>···</span>
        </div>

        {/* the post's media: the animated page, still moving */}
        <div style={{ position: "absolute", left: MEDIA.x, top: MEDIA.y, width: MEDIA.w, height: MEDIA.h, overflow: "hidden" }}>
          {/* the post's media scrolls like a feed: Yami smoking first, then on down through the animated pages */}
          <div style={{ position: "absolute", left: 0, top: 0, width: MEDIA.w, height: STRIP_H, translate: `0 ${-feed}px`, filter: feedBlur > 0.6 ? "url(#feed-blur)" : undefined }}>
            {/* Yami, in the wind: hair and cape blow (tools/animate.py), smoke rises from his cigarette */}
            <div style={{ position: "absolute", left: 0, top: 0, width: MEDIA.w, height: MEDIA.h, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 70% 90% at 45% 30%, #3a0b0d 0%, #120707 55%, #070707 100%)` }} />
              <Gust t={t} w={MEDIA.w} h={MEDIA.h} />
              <div style={{ position: "absolute", inset: 0, scale: `${push}`, transformOrigin: `${YAMI.tip.x}px ${YAMI.tip.y}px` }}>
                <Img src={animSrc("yami", t)} style={{ position: "absolute", left: YAMI.left, top: YAMI.top, width: YAMI.w, height: YAMI.h, filter: `drop-shadow(0 0 ${20 + glow * 14}px rgba(226,38,43,0.35))` }} />
                <Smoke t={t} x={YAMI.tip.x} y={YAMI.tip.y} w={MEDIA.w} h={MEDIA.h} />
              </div>
            </div>
            {FEED.map((f, i) => (
              <Img key={f.name} src={animSrc(f.name, t, i * 0.31)} style={{ position: "absolute", left: 0, top: feedTop(i), width: MEDIA.w, height: f.h, background: color.ink }} />
            ))}
          </div>
          <svg width={0} height={0} style={{ position: "absolute" }}>
            <filter id="feed-blur" x="-5%" y="-20%" width="110%" height="140%">
              <feGaussianBlur stdDeviation={`0 ${feedBlur}`} />
            </filter>
          </svg>
          <Embers t={t} start={cue.reaction} end={cue.reactionOut} count={18} seed={61} area={{ x: 500, y: 100, w: 500, h: 600 }} rise={260} size={8} />
        </div>

        {/* actions and likes */}
        <div style={{ position: "absolute", left: 56, top: MEDIA.y + MEDIA.h + 26, display: "flex", gap: 34, alignItems: "center" }}>
          <div style={{ scale: `${1 + heartPop * 0.35}` }}>
            <Heart size={60} filled={liked} />
          </div>
          <Bubble size={58} />
          <Send size={56} />
        </div>
        <div style={{ position: "absolute", left: 56, top: MEDIA.y + MEDIA.h + 100, fontFamily: font.ui, fontWeight: 600, fontSize: 30, color: color.white }}>
          {fmt(likes)} likes
        </div>
        <FloatingHearts t={t} start={cue.reaction + 0.3} end={cue.reactionOut} />
      </div>

      {/* the comment sheet slides up and fills */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: SHEET_TOP + (1 - sheet) * 900,
          width: W,
          height: LIST_BOTTOM - SHEET_TOP,
          background: "#121212",
          borderRadius: "44px 44px 0 0",
          boxShadow: "0 -30px 80px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: W / 2 - 50, top: 18, width: 100, height: 8, borderRadius: 4, background: color.line }} />
        <div style={{ position: "absolute", left: 56, right: 56, top: 52, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: font.ui, fontWeight: 600, fontSize: 32, color: color.white }}>Comments</span>
          <span style={{ fontFamily: font.mono, fontSize: 22, color: color.muted }}>{fmt(480 + shown * 37 + Math.max(0, t - cue.reaction) * 120)}</span>
        </div>
        <div style={{ position: "absolute", left: 56, right: 56, top: 112, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1, height: 2, background: color.line }} />
        </div>
        {/* rows live in frame coordinates, so offset the sheet's own top */}
        <div style={{ position: "absolute", left: 0, top: -SHEET_TOP, width: W, height: FRAME.height }}>
          {COMMENTS.map((c, i) => (
            <Row key={c.user} c={c} t={t} index={i} total={COMMENTS} />
          ))}
        </div>
      </div>

      {/* below the list: the sheet's footer, then the typing bar */}
      <div style={{ position: "absolute", left: 0, top: LIST_BOTTOM + (1 - sheet) * 900, width: W, height: FRAME.height - LIST_BOTTOM, background: "#121212" }} />
      <div style={{ position: "absolute", left: 0, top: LIST_BOTTOM - 120 + (1 - sheet) * 900, width: W, height: 120, background: "linear-gradient(180deg, rgba(18,18,18,0), #121212)" }} />
      <div style={{ position: "absolute", left: 40, right: 40, top: 1660 + (1 - sheet) * 400, height: 88, borderRadius: 44, background: color.surfaceRaised, border: `1.5px solid ${color.line}`, display: "flex", alignItems: "center", padding: "0 32px", gap: 16, boxShadow: "0 -20px 40px rgba(18,18,18,0.9)" }}>
        <span style={{ fontFamily: font.ui, fontSize: 30, color: color.muted }}>someone is typing</span>
        <span style={{ display: "flex", gap: 8 }}>
          {[0, 1, 2].map((d) => (
            <span key={d} style={{ width: 10, height: 10, borderRadius: 5, background: d < dots ? color.red : color.line }} />
          ))}
        </span>
      </div>
    </AbsoluteFill>
  );
}
