import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {FootageBox} from '../components/Footage';
import {Label, PaperGrid, RingReveal} from '../components/FX';
import {KineticText} from '../components/KineticText';
import {Landscape, ProfileCity} from '../components/Worlds';
import {C, FONT, easeIn, easeInOut, easeOut, shadow} from '../theme';

const CARD = {x: 40, top: 640, w: 1000, h: 780};

const City = () => (
	<Sequence layout="none">
		<FootageBox start={22.3} width={CARD.w} height={CARD.h} zoom={1.05} duration={225} />
	</Sequence>
);

const Tnt = () => (
	<Sequence layout="none">
		<FootageBox source="tnt" start={0} width={CARD.w} height={CARD.h} zoom={1.02} duration={225} />
	</Sequence>
);

const WORLDS = [
	{name: 'Open city', el: <City />},
	{name: 'Block world', el: <Tnt />},
	{name: 'Creator', el: <ProfileCity w={CARD.w} h={CARD.h} />},
	{name: 'Cinematic landscape', el: <Landscape w={CARD.w} h={CARD.h} />},
];
const CUTS = [0, 50, 100, 150];
const GRID_AT = 192;

const Pill = ({children, opacity = 1}) => (
	<div
		style={{
			position: 'absolute',
			left: 24,
			bottom: 24,
			padding: '12px 22px',
			borderRadius: 40,
			background: 'rgba(14,16,14,0.88)',
			fontFamily: FONT.body,
			fontSize: 26,
			color: C.ink,
			opacity,
			display: 'flex',
			alignItems: 'center',
			gap: 12,
		}}
	>
		<div style={{width: 9, height: 9, borderRadius: 9, background: C.green}} />
		{children}
	</div>
);

// 13.1–20.6 s · montage of connected worlds that resolve into one grid
export const Scene03OneWorld = () => {
	const frame = useCurrentFrame();
	const gridT = interpolate(frame, [GRID_AT, GRID_AT + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});
	const out = interpolate(frame, [212, 225], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeIn});
	const counter = Math.min(4, CUTS.filter((c) => frame >= c).length);

	return (
		<AbsoluteFill style={{background: C.paper}}>
			<PaperGrid />
			<Label x={70} y={250}>
				{`World ${String(counter).padStart(2, '0')} / ∞`}
			</Label>

			{/* single card montage */}
			{frame < GRID_AT + 14 ? (
				<div
					style={{
						position: 'absolute',
						left: CARD.x,
						top: CARD.top,
						width: CARD.w,
						height: CARD.h,
						borderRadius: 28,
						overflow: 'hidden',
						boxShadow: shadow,
						background: C.white,
						opacity: 1 - gridT,
						transform: `scale(${1 - gridT * 0.5})`,
					}}
				>
					{WORLDS.map((w, i) => (
						<Sequence key={w.name} from={CUTS[i]} durationInFrames={(CUTS[i + 1] ?? GRID_AT + 14) - CUTS[i] + 12} layout="none">
							<RingReveal at={0} duration={12} cx={CARD.w / 2} cy={CARD.h / 2}>
								<AbsoluteFill style={{background: C.white}}>{w.el}</AbsoluteFill>
								<Pill>{w.name}</Pill>
							</RingReveal>
						</Sequence>
					))}
				</div>
			) : null}

			{/* 2×2 grid: every world, one canvas */}
			{frame >= GRID_AT ? (
				<AbsoluteFill style={{opacity: gridT * (1 - out), transform: `scale(${1 - out * 0.85})`, transformOrigin: '540px 1030px'}}>
					{WORLDS.map((w, i) => {
						const col = i % 2;
						const row = Math.floor(i / 2);
						const cw = 490;
						const ch = 382;
						const d = interpolate(frame, [GRID_AT + i * 2, GRID_AT + 12 + i * 2], [40, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});
						return (
							<div
								key={w.name}
								style={{
									position: 'absolute',
									left: 40 + col * (cw + 20),
									top: 640 + row * (ch + 16) + d,
									width: cw,
									height: ch,
									borderRadius: 22,
									overflow: 'hidden',
									boxShadow: shadow,
									background: C.white,
								}}
							>
								<div style={{width: CARD.w, height: CARD.h, transform: `scale(${cw / CARD.w})`, transformOrigin: '0 0'}}>{w.el}</div>
							</div>
						);
					})}
				</AbsoluteFill>
			) : null}

			<KineticText text="One world." start={6} end={98} y={380} size={120} highlight={['world.']} seed={31} />
			<KineticText text="Infinite possibilities." start={104} end={220} y={380} size={110} highlight={['possibilities.']} seed={32} />
		</AbsoluteFill>
	);
};
