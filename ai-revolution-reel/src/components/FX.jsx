import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {C, FONT, easeInOut, easeOut} from '../theme';

/** Drifting dots (deterministic). */
export const Particles = ({count = 40, seed = 'p', color = C.green, speed = 1, size = 3, opacity = 0.5, top = 0, height = 1920, drift = -1}) => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<svg width={1080} height={1920}>
				{new Array(count).fill(0).map((_, i) => {
					const r = (k) => random(`${seed}-${i}-${k}`);
					const x = r('x') * 1080 + Math.sin((frame + r('p') * 200) / (40 + r('w') * 40)) * 30;
					const travel = (frame * speed * (0.6 + r('s') * 1.4) * drift + r('y') * height) % height;
					const y = top + (travel < 0 ? travel + height : travel);
					const tw = 0.5 + 0.5 * Math.abs(Math.sin((frame + r('t') * 100) / (10 + r('f') * 12)));
					return <circle key={i} cx={x} cy={y} r={size * (0.4 + r('r'))} fill={color} opacity={opacity * tw * (0.3 + r('o') * 0.7)} />;
				})}
			</svg>
		</AbsoluteFill>
	);
};

/** Fine lined grid that slowly drifts. */
export const PaperGrid = ({opacity = 1, cell = 72, speed = 0.8}) => {
	const frame = useCurrentFrame();
	const o = frame * speed;
	return (
		<AbsoluteFill
			style={{
				opacity,
				backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
				backgroundSize: `${cell}px ${cell}px`,
				backgroundPosition: `${o * 0.4}px ${o}px`,
				maskImage: 'radial-gradient(ellipse at 50% 45%, black 20%, transparent 75%)',
				WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, black 20%, transparent 75%)',
			}}
		/>
	);
};

/** Perspective floor grid that scrolls toward the camera. */
export const Grid = ({opacity = 0.6, speed = 4, horizon = 1100, color = C.line, tilt = 72, cell = 120}) => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{perspective: 900, perspectiveOrigin: `50% ${horizon}px`, overflow: 'hidden', opacity}}>
			<div
				style={{
					position: 'absolute',
					left: -2000,
					width: 5080,
					top: horizon,
					height: 4000,
					transformOrigin: '50% 0%',
					transform: `rotateX(${tilt}deg)`,
					backgroundImage: `linear-gradient(${color} 2px, transparent 2px), linear-gradient(90deg, ${color} 2px, transparent 2px)`,
					backgroundSize: `${cell}px ${cell}px`,
					backgroundPosition: `0px ${(frame * speed) % cell}px`,
					maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 100%)',
					WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 100%)',
				}}
			/>
		</AbsoluteFill>
	);
};

export const Grain = ({opacity = 0.05}) => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity, mixBlendMode: 'overlay'}}>
			<svg width="1080" height="1920">
				<filter id={`grain-${frame % 6}`}>
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 6} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="1080" height="1920" filter={`url(#grain-${frame % 6})`} />
			</svg>
		</AbsoluteFill>
	);
};

/** A thin green line that sweeps across the frame. */
export const LightStreak = ({at = 0, duration = 14, y = 960, color = C.green, thickness = 2, length = 700, reverse = false}) => {
	const frame = useCurrentFrame();
	if (frame < at || frame > at + duration + 2) return null;
	const t = interpolate(frame, [at, at + duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});
	const x = interpolate(t, [0, 1], reverse ? [1080 + length, -length] : [-length, 1080 + length]);
	return (
		<div
			style={{
				position: 'absolute',
				top: y - thickness / 2,
				left: x - length / 2,
				width: length,
				height: thickness,
				background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
				pointerEvents: 'none',
			}}
		/>
	);
};

export const Flash = ({at = 0, duration = 10, color = '#ffffff', peak = 0.85}) => {
	const frame = useCurrentFrame();
	const o = interpolate(frame, [at, at + 1, at + duration], [0, peak, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	if (o <= 0) return null;
	return <AbsoluteFill style={{background: color, opacity: o, pointerEvents: 'none'}} />;
};

/**
 * Digital glitch: slices of the children displaced horizontally.
 * `windows` is a list of [from, to] frames when it is active.
 */
export const Glitch = ({children, windows = [], slices = 7, amount = 50, seed = 'g'}) => {
	const frame = useCurrentFrame();
	const active = windows.some(([a, b]) => frame >= a && frame <= b);
	if (!active) return <AbsoluteFill>{children}</AbsoluteFill>;
	const tick = Math.floor(frame / 2);
	const cuts = new Array(slices - 1).fill(0).map((_, i) => random(`${seed}c${tick}${i}`) * 100).sort((a, b) => a - b);
	const bounds = [0, ...cuts, 100];
	return (
		<AbsoluteFill>
			{bounds.slice(0, -1).map((top, i) => (
				<AbsoluteFill key={i} style={{clipPath: `inset(${top}% 0 ${100 - bounds[i + 1]}% 0)`, transform: `translateX(${(random(`${seed}d${tick}${i}`) - 0.5) * amount * 2}px)`}}>
					{children}
				</AbsoluteFill>
			))}
			<div style={{position: 'absolute', left: 0, right: 0, top: `${cuts[2] ?? 40}%`, height: 3, background: C.green, opacity: 0.8}} />
		</AbsoluteFill>
	);
};

/** Small UI label: green dot + light sans text. */
export const Label = ({children, x = 70, y = 250, opacity = 1, color = C.muted, dot = true, size = 26}) => (
	<div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT.body, fontSize: size, color, opacity, letterSpacing: '0.01em'}}>
		{dot ? <div style={{width: 10, height: 10, borderRadius: 10, background: C.green}} /> : null}
		{children}
	</div>
);

/** Expanding circle reveal with a thin green edge. */
export const RingReveal = ({at, duration = 12, cx = 540, cy = 960, children}) => {
	const frame = useCurrentFrame();
	if (frame < at) return null;
	const t = interpolate(frame, [at, at + duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});
	const r = t * 1250;
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{clipPath: `circle(${r}px at ${cx}px ${cy}px)`}}>{children}</AbsoluteFill>
			{t < 1 ? (
				<svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
					<circle cx={cx} cy={cy} r={r} fill="none" stroke={C.green} strokeWidth={3} />
				</svg>
			) : null}
		</AbsoluteFill>
	);
};
