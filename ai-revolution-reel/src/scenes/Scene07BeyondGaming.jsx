import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {Label, PaperGrid} from '../components/FX';
import {KineticText} from '../components/KineticText';
import {C, FONT, easeInOut, easeOut, shadow} from '../theme';

const W = 1000;
const H = 780;

const draw = (f, a, b) => interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});

const Business = ({f}) => {
	const bars = [0.35, 0.5, 0.42, 0.66, 0.58, 0.8, 0.92];
	const line = bars.map((b, i) => `${i ? 'L' : 'M'}${130 + i * 120} ${640 - b * 420 - 40}`).join(' ');
	const kpi = Math.round(interpolate(f, [0, 30], [0, 128], {extrapolateRight: 'clamp'}));
	return (
		<svg width={W} height={H}>
			{[0, 1, 2, 3].map((k) => (
				<line key={k} x1={90} x2={940} y1={640 - k * 130} y2={640 - k * 130} stroke={C.line} strokeWidth={1.5} />
			))}
			{bars.map((b, i) => {
				const p = draw(f, i * 2, i * 2 + 14);
				return <rect key={i} x={100 + i * 120} y={640 - b * 420 * p} width={60} height={b * 420 * p} rx={8} fill={i === bars.length - 1 ? C.green : C.greenSoft} stroke={C.green} strokeWidth={1.5} />;
			})}
			<path d={line} fill="none" stroke={C.ink} strokeWidth={3} strokeDasharray={1000} strokeDashoffset={1000 * (1 - draw(f, 6, 30))} />
			<text x={90} y={110} fontFamily={FONT.body} fontSize={30} fill={C.muted}>
				Automated insights
			</text>
			<text x={90} y={180} fontFamily={FONT.display} fontSize={72} fill={C.ink}>
				+{kpi}%
			</text>
		</svg>
	);
};

const Education = ({f}) => {
	const nodes = [
		[200, 560],
		[360, 420],
		[520, 500],
		[660, 330],
		[820, 220],
	];
	const p = draw(f, 0, 24);
	return (
		<svg width={W} height={H}>
			<path d="M150 690 Q500 600 500 690 Q500 600 850 690 L850 700 L150 700 Z" fill={C.greenSoft} stroke={C.green} strokeWidth={2} />
			<path d={nodes.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')} fill="none" stroke={C.green} strokeWidth={3} strokeDasharray={1000} strokeDashoffset={1000 * (1 - p)} />
			{nodes.map(([x, y], i) => {
				const on = p * nodes.length > i;
				return <circle key={i} cx={x} cy={y} r={on ? 18 : 10} fill={on ? C.green : C.white} stroke={C.green} strokeWidth={2} />;
			})}
			<text x={90} y={110} fontFamily={FONT.body} fontSize={30} fill={C.muted}>
				Personalized learning path
			</text>
			{['Basics', 'Practice', 'Projects', 'Mastery'].map((t, i) => (
				<text key={t} x={nodes[i + 1][0] + 28} y={nodes[i + 1][1] + 8} fontFamily={FONT.body} fontSize={24} fill={C.ink} opacity={p * nodes.length > i + 1 ? 1 : 0}>
					{t}
				</text>
			))}
		</svg>
	);
};

const Creativity = ({f}) => {
	const p = draw(f, 0, 22);
	return (
		<svg width={W} height={H}>
			<path d="M120 520 C260 260 420 640 560 380 S820 260 900 420" fill="none" stroke={C.green} strokeWidth={34} strokeLinecap="round" strokeDasharray={1200} strokeDashoffset={1200 * (1 - p)} opacity={0.9} />
			<path d="M140 600 C320 480 520 700 880 560" fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" strokeDasharray={1000} strokeDashoffset={1000 * (1 - draw(f, 6, 28))} />
			{new Array(8).fill(0).map((_, i) => (
				<rect key={i} x={((i * 130 - f * 6) % 1100) - 60} y={150} width={110} height={80} rx={8} fill={C.white} stroke={C.ink} strokeWidth={1.5} />
			))}
			<text x={90} y={110} fontFamily={FONT.body} fontSize={30} fill={C.muted}>
				Art · film · design
			</text>
		</svg>
	);
};

const Health = ({f}) => {
	let d = '';
	for (let x = 0; x <= W; x += 6) {
		const ph = (x + f * 14) % 300;
		const y = ph > 130 && ph < 150 ? 300 - 140 * Math.sin(((ph - 130) / 20) * Math.PI) : ph > 150 && ph < 165 ? 300 + 50 * Math.sin(((ph - 150) / 15) * Math.PI) : 300;
		d += `${x ? 'L' : 'M'}${x} ${y} `;
	}
	const helix = new Array(18).fill(0).map((_, i) => {
		const y = 450 + i * 17;
		const a = Math.sin(i * 0.5 + f * 0.25);
		return (
			<g key={i}>
				<line x1={500 - a * 200} x2={500 + a * 200} y1={y} y2={y} stroke={C.line} strokeWidth={2} />
				<circle cx={500 - a * 200} cy={y} r={7} fill={C.green} />
				<circle cx={500 + a * 200} cy={y} r={7} fill={C.ink} />
			</g>
		);
	});
	return (
		<svg width={W} height={H}>
			<path d={d} fill="none" stroke={C.green} strokeWidth={4} />
			{helix}
			<text x={90} y={110} fontFamily={FONT.body} fontSize={30} fill={C.muted}>
				Medical research
			</text>
		</svg>
	);
};

const MORE = ['Software', 'Science', 'Engineering', 'Research', 'Design', 'Film', 'Data', 'Robotics', 'Music'];
const More = ({f}) => (
	<div style={{position: 'absolute', inset: 60, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22}}>
		{MORE.map((m, i) => {
			const p = draw(f, i * 1.5, i * 1.5 + 10);
			return (
				<div
					key={m}
					style={{
						borderRadius: 20,
						border: `1.5px solid ${random(`m${i}`) > 0.6 ? C.green : C.line}`,
						background: i === 4 ? C.greenSoft : C.white,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontFamily: FONT.body,
						fontSize: 30,
						color: C.ink,
						opacity: p,
						transform: `scale(${0.8 + p * 0.2})`,
					}}
				>
					{m}
				</div>
			);
		})}
	</div>
);

const PANELS = [
	{word: 'Business.', at: 0, el: Business},
	{word: 'Education.', at: 45, el: Education},
	{word: 'Creativity.', at: 73, el: Creativity},
	{word: 'Healthcare.', at: 105, el: Health},
	{word: 'And much more.', at: 133, el: More},
];

// 42.2–47.5 s · AI beyond games, one quick panel per field
export const Scene07BeyondGaming = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: C.paper}}>
			<PaperGrid />
			<Label x={70} y={250}>
				Beyond gaming
			</Label>
			{PANELS.map((p, i) => {
				const end = PANELS[i + 1]?.at ?? 158;
				if (frame < p.at || frame >= end + 8) return null;
				const inT = interpolate(frame, [p.at, p.at + 10], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});
				const outT = interpolate(frame, [end, end + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});
				const El = p.el;
				return (
					<div
						key={p.word}
						style={{
							position: 'absolute',
							left: 40,
							top: 640,
							width: W,
							height: H,
							borderRadius: 28,
							background: C.white,
							boxShadow: shadow,
							overflow: 'hidden',
							transform: `translateX(${inT * 1100 - outT * 1100}px)`,
						}}
					>
						<El f={frame - p.at} />
					</div>
				);
			})}
			{PANELS.map((p, i) => (
				<KineticText key={p.word} text={p.word} start={p.at + 1} end={(PANELS[i + 1]?.at ?? 160) - 1} y={380} size={112} highlight={i === 4 ? ['more.'] : [p.word]} stagger={2} seed={70 + i} />
			))}
		</AbsoluteFill>
	);
};
