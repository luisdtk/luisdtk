import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {FootageBox} from '../components/Footage';
import {Label, PaperGrid} from '../components/FX';
import {KineticText} from '../components/KineticText';
import {C, FONT, easeInOut, easeOut, shadow} from '../theme';

const STAGE = {x: 40, top: 640, w: 1000, h: 780};
const PHASES = [
	{word: 'Analyzing.', at: 4},
	{word: 'Organizing.', at: 38},
	{word: 'Building.', at: 72},
	{word: 'Creating.', at: 106},
];
const FINAL = 140;

// Real lines from this project's source.
const CODE = [
	['<Sequence', ' from={133} durationInFrames={261}>'],
	['  <Scene02WorldsColliding', ' />'],
	['<FootageClip', ' start={0.3} zoomFrom={1.35} />'],
	['<KineticText', ' text="One world." />'],
	['const', ' DROP = 240; // "Right now…"'],
	['<Audio', ' src={staticFile("audio/voice.wav")} />'],
	['interpolate', '(frame, [0, 18], [0, 1])'],
	['<Glitch', ' windows={[[137, 140]]} />'],
	['easing:', ' Easing.bezier(0.16, 1, 0.3, 1)'],
];

const fade = (f, a, b) => interpolate(f, [a, a + 8, b - 6, b], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const Analyze = ({f}) => {
	const scan = interpolate(f, [0, 34], [0, 1], {extrapolateRight: 'clamp', easing: easeInOut});
	return (
		<AbsoluteFill style={{padding: '50px 46px', background: C.white}}>
			{CODE.map(([k, rest], i) => {
				const lineY = i / CODE.length;
				const lit = scan > lineY;
				return (
					<div key={i} style={{display: 'flex', gap: 22, fontFamily: FONT.mono, fontSize: 27, lineHeight: '74px', color: C.ink, borderRadius: 8, background: lit && scan - lineY < 0.2 ? C.greenSoft : 'transparent', paddingLeft: 10}}>
						<span style={{color: C.faint, width: 30}}>{i + 1}</span>
						<span>
							<span style={{color: C.green}}>{k}</span>
							<span style={{color: lit ? C.ink : C.faint}}>{rest}</span>
						</span>
					</div>
				);
			})}
			<div style={{position: 'absolute', left: 0, right: 0, top: 50 + scan * 666, height: 2, background: C.green}} />
		</AbsoluteFill>
	);
};

const Organize = ({f}) => {
	const tracks = [
		{label: 'video', n: 6, color: C.green},
		{label: 'text', n: 8, color: C.ink},
		{label: 'voice', n: 7, color: C.green},
		{label: 'sfx', n: 12, color: C.muted},
	];
	return (
		<AbsoluteFill style={{background: C.white, padding: '80px 46px'}}>
			{tracks.map((t, ti) => (
				<div key={t.label} style={{position: 'relative', height: 150}}>
					<div style={{position: 'absolute', top: 40, fontFamily: FONT.mono, fontSize: 22, color: C.muted}}>{t.label}</div>
					<div style={{position: 'absolute', left: 110, right: 0, top: 20, height: 76, borderRadius: 12, background: '#f3f2ef'}} />
					{new Array(t.n).fill(0).map((_, i) => {
						const at = ti * 4 + i * 1.5;
						const p = interpolate(f, [at, at + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});
						const slot = (790 / t.n) * i;
						return (
							<div
								key={i}
								style={{
									position: 'absolute',
									top: 26 + (1 - p) * (i % 2 ? -90 : 90),
									left: 116 + slot + (1 - p) * 200,
									width: 790 / t.n - 8,
									height: 64,
									borderRadius: 10,
									border: `1.5px solid ${t.color}`,
									background: ti % 2 ? '#fafaf8' : C.greenSoft,
									opacity: p,
								}}
							/>
						);
					})}
				</div>
			))}
		</AbsoluteFill>
	);
};

const LAYERS = ['Footage', 'Motion', 'Typography', 'Sound'];
const Build = ({f}) => (
	<AbsoluteFill style={{background: C.paper}}>
		{LAYERS.map((l, i) => {
			const p = interpolate(f, [i * 5, i * 5 + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});
			return (
				<div
					key={l}
					style={{
						position: 'absolute',
						left: 150 + i * 30,
						top: 420 - i * 105 + (1 - p) * 160,
						width: 640,
						height: 300,
						borderRadius: 22,
						background: i === LAYERS.length - 1 ? C.greenSoft : C.white,
						border: `2px solid ${i === LAYERS.length - 1 ? C.green : C.ink}`,
						boxShadow: shadow,
						transform: 'perspective(1600px) rotateX(38deg) rotateZ(-18deg)',
						opacity: p,
						fontFamily: FONT.body,
						fontSize: 40,
						color: C.ink,
						padding: 32,
					}}
				>
					<span style={{color: C.green, marginRight: 14}}>0{i + 1}</span>
					{l}
				</div>
			);
		})}
	</AbsoluteFill>
);

// 33.4–39.6 s · code turns into the finished picture
export const Scene05CodeBecomesCreation = () => {
	const frame = useCurrentFrame();
	const reveal = interpolate(frame, [PHASES[3].at, PHASES[3].at + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});
	const progress = interpolate(frame, [0, FINAL], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{background: C.paper}}>
			<PaperGrid />
			<Label x={70} y={250}>
				{frame < FINAL ? `Rendering · ${Math.round(progress * 100)}%` : 'Rendered · 100%'}
			</Label>
			<div style={{position: 'absolute', left: 70, right: 70, top: 300, height: 4, borderRadius: 4, background: C.line}}>
				<div style={{width: `${progress * 100}%`, height: '100%', borderRadius: 4, background: C.green}} />
			</div>

			<div style={{position: 'absolute', left: STAGE.x, top: STAGE.top, width: STAGE.w, height: STAGE.h, borderRadius: 28, overflow: 'hidden', boxShadow: shadow, background: C.white}}>
				<AbsoluteFill style={{opacity: fade(frame, 0, 40)}}>
					<Analyze f={frame} />
				</AbsoluteFill>
				<AbsoluteFill style={{opacity: fade(frame, 34, 76)}}>
					<Organize f={frame - 36} />
				</AbsoluteFill>
				<AbsoluteFill style={{opacity: fade(frame, 68, 114)}}>
					<Build f={frame - 70} />
				</AbsoluteFill>
				<AbsoluteFill style={{clipPath: `inset(${(1 - reveal) * 50}% ${(1 - reveal) * 50}% round 28px)`}}>
					<Sequence from={PHASES[3].at} layout="none">
						<FootageBox start={26.2} width={STAGE.w} height={STAGE.h} zoom={1.1} duration={80} />
					</Sequence>
				</AbsoluteFill>
			</div>

			{PHASES.map((p, i) => (
				<KineticText key={p.word} text={p.word} start={p.at} end={(PHASES[i + 1]?.at ?? FINAL) - 1} y={380} size={110} mode="rise" highlight={i === 3 ? [p.word] : []} seed={50 + i} />
			))}
			<KineticText text="From ideas to reality." start={FINAL} end={186} y={380} size={104} highlight={['reality.']} seed={55} />
		</AbsoluteFill>
	);
};
