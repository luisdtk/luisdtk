import {AbsoluteFill, Freeze, OffthreadVideo, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, easeOut} from '../theme';

const SRC = staticFile('video/soar.mp4');
const SRC_W = 720;
const SRC_H = 576;
const LAST = 86; // last source frame

// Speed ramp: [output frame, source frame] — fast run-up, slow-motion jump, fast exit.
const RAMP_OUT = [0, 16, 44, 60];
const RAMP_SRC = [0, 36, 58, LAST];
const SLOW = [16, 44];

/** The uploaded skate-jump clip with a speed ramp, punch-in zoom and speed lines. */
export const SoarClip = ({w = 1000, h = 780, startAt = 0}) => {
	const f = useCurrentFrame() - startAt;
	const src = Math.round(interpolate(f, RAMP_OUT, RAMP_SRC, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
	const slow = f >= SLOW[0] && f < SLOW[1];
	const fast = !slow && f < RAMP_OUT[3];

	// punch-in when the slow motion hits, gentle push afterwards
	const punch = interpolate(f, [SLOW[0], SLOW[0] + 6, SLOW[1]], [1.32, 1.12, 1.2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});
	const intro = interpolate(f, [0, SLOW[0]], [1.0, 1.08], {extrapolateRight: 'clamp'});
	const zoom = f < SLOW[0] ? intro : punch;
	const shakeAmt = f < SLOW[0] ? 3 : interpolate(f, [SLOW[0], SLOW[0] + 8], [16, 0], {extrapolateRight: 'clamp'});
	const sx = (random(`sx${f}`) - 0.5) * shakeAmt;
	const sy = (random(`sy${f}`) - 0.5) * shakeAmt;
	const tilt = interpolate(f, [0, SLOW[0], SLOW[1], RAMP_OUT[3]], [-2, 1.5, -1, 0], {extrapolateRight: 'clamp'});
	const flash = f < SLOW[0] ? 0 : interpolate(f, [SLOW[0], SLOW[0] + 5], [0.5, 0], {extrapolateRight: 'clamp'});

	const base = Math.max(h / SRC_H, w / SRC_W);
	const vw = SRC_W * base * zoom;
	const vh = SRC_H * base * zoom;

	return (
		<AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>
			<div style={{position: 'absolute', left: (w - vw) / 2 + sx, top: (h - vh) / 2 + sy, width: vw, height: vh, transform: `rotate(${tilt}deg)`}}>
				<Freeze frame={src}>
					<OffthreadVideo src={SRC} muted style={{width: '100%', height: '100%', filter: slow ? 'contrast(1.12) saturate(1.15)' : 'contrast(1.05)'}} />
				</Freeze>
			</div>

			{/* speed lines during the fast sections */}
			{fast ? (
				<svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
					{new Array(18).fill(0).map((_, i) => {
						const y = random(`ly${i}${Math.floor(f / 2)}`) * h;
						const len = 120 + random(`ll${i}${f}`) * 260;
						const x = ((random(`lx${i}`) * w + f * 90) % (w + len)) - len;
						return <line key={i} x1={x} x2={x + len} y1={y} y2={y} stroke={C.ink} strokeWidth={2} opacity={0.35} />;
					})}
				</svg>
			) : null}

			{/* cinematic bars + slow-motion tag */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: slow ? 46 : 0, background: '#000'}} />
			<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: slow ? 46 : 0, background: '#000'}} />
			{slow ? (
				<div style={{position: 'absolute', right: 26, top: 64, padding: '8px 16px', borderRadius: 30, background: 'rgba(14,16,14,0.85)', fontFamily: FONT.mono, fontSize: 22, color: C.greenMid}}>
					● SLOW-MO
				</div>
			) : null}
			<AbsoluteFill style={{background: C.green, opacity: flash, mixBlendMode: 'screen'}} />
			<AbsoluteFill style={{boxShadow: 'inset 0 0 120px rgba(0,0,0,0.6)'}} />
		</AbsoluteFill>
	);
};
