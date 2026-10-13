import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {C} from '../theme';

/** Wireframe "future city" on a perspective grid — light, line-drawn. */
export const FutureWorld = ({w = 1000, h = 780, speed = 1}) => {
	const frame = useCurrentFrame() * speed;
	const hz = h * 0.52;
	const vx = w / 2;
	const lines = [];
	for (let i = -14; i <= 14; i++) lines.push(<line key={`v${i}`} x1={vx} y1={hz} x2={vx + i * 140} y2={h} stroke={C.green} strokeWidth={1.2} opacity={0.5} />);
	for (let k = 0; k < 12; k++) {
		const t = ((k + (frame % 20) / 20) / 12) ** 2;
		const y = hz + (h - hz) * t;
		lines.push(<line key={`h${k}`} x1={0} y1={y} x2={w} y2={y} stroke={C.green} strokeWidth={1.2} opacity={0.15 + t * 0.6} />);
	}
	const towers = new Array(16).fill(0).map((_, i) => {
		const r = (k) => random(`ft${i}${k}`);
		const x = r('x') * w;
		const tw = 40 + r('w') * 70;
		const th = 80 + r('h') * 260;
		const rise = Math.min(1, Math.max(0, (frame - i * 1.5) / 14));
		return (
			<g key={i}>
				<rect x={x} y={hz - th * rise} width={tw} height={th * rise} fill="#ffffff" stroke={C.ink} strokeWidth={1.2} opacity={0.85} />
				{new Array(Math.floor((th * rise) / 26)).fill(0).map((__, j) => (
					<line key={j} x1={x + 8} x2={x + tw - 8} y1={hz - 14 - j * 26} y2={hz - 14 - j * 26} stroke={r(`l${j}`) > 0.6 ? C.green : C.line} strokeWidth={2} />
				))}
			</g>
		);
	});
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg, #ffffff 0%, #f1f8f3 100%)'}}>
			<svg width={w} height={h}>
				<circle cx={vx} cy={hz - 40} r={150} fill={C.greenSoft} stroke={C.green} strokeWidth={1.5} />
				{lines}
				{towers}
				<line x1={0} x2={w} y1={hz} y2={hz} stroke={C.ink} strokeWidth={1.2} opacity={0.6} />
			</svg>
		</AbsoluteFill>
	);
};

/** Layered cinematic landscape with drifting mist. */
export const Landscape = ({w = 1000, h = 780}) => {
	const frame = useCurrentFrame();
	const ridge = (seed, base, amp, step) => {
		let d = `M0 ${h}`;
		for (let x = 0; x <= w + step; x += step) {
			const y = base - amp * (0.5 + 0.5 * Math.sin(x * 0.006 + seed) * Math.cos(x * 0.013 + seed * 2)) - random(`r${seed}${x}`) * amp * 0.25;
			d += ` L${x} ${y}`;
		}
		return `${d} L${w} ${h} Z`;
	};
	const layers = [
		{seed: 1, base: h * 0.55, amp: 220, color: '#d6eadc', speed: 0.15},
		{seed: 2, base: h * 0.68, amp: 180, color: '#a7d4b5', speed: 0.35},
		{seed: 3, base: h * 0.8, amp: 140, color: '#5aa977', speed: 0.7},
		{seed: 4, base: h * 0.95, amp: 120, color: '#1f6b3d', speed: 1.2},
	];
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg, #fbfaf6 0%, #eef6ef 100%)'}}>
			<svg width={w} height={h}>
				<circle cx={w * 0.68} cy={h * 0.3} r={70} fill="#fff3c4" />
				{layers.map((l) => (
					<g key={l.seed} transform={`translate(${-frame * l.speed} 0)`}>
						<path d={ridge(l.seed, l.base, l.amp, 24)} fill={l.color} />
					</g>
				))}
				{[0, 1, 2].map((k) => (
					<rect key={k} x={-200 + ((frame * (0.8 + k * 0.3) + k * 300) % (w + 400)) - 200} y={h * (0.5 + k * 0.12)} width={520} height={40} rx={20} fill="#ffffff" opacity={0.55} />
				))}
			</svg>
		</AbsoluteFill>
	);
};
