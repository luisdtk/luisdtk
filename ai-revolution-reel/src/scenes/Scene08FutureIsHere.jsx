import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {Label} from '../components/FX';
import {KineticText} from '../components/KineticText';
import {C, easeInOut} from '../theme';

const HZ = 1000; // horizon
const FOCAL = 520;
const CAM_H = 260;

const BUILDINGS = new Array(44).fill(0).map((_, i) => {
	const side = i % 2 ? 1 : -1;
	return {
		x: side * (260 + random(`bx${i}`) * 520),
		z: 200 + Math.floor(i / 2) * 120 + random(`bz${i}`) * 60,
		w: 120 + random(`bw${i}`) * 160,
		h: 300 + random(`bh${i}`) * 900,
		lit: random(`bl${i}`),
	};
});

// 47.5–51.1 s · flying forward through a line-drawn city of connected towers
export const Scene08FutureIsHere = () => {
	const frame = useCurrentFrame();
	const camZ = interpolate(frame, [0, 108], [0, 900], {easing: easeInOut});
	const simplify = interpolate(frame, [58, 96], [1, 0.12], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	const proj = (x, y, z) => {
		const s = FOCAL / Math.max(20, z - camZ);
		return [540 + x * s, HZ + (CAM_H - y) * s, s];
	};

	const visible = BUILDINGS.filter((b) => b.z - camZ > 30).sort((a, b) => b.z - a.z);
	const roofs = visible.map((b) => proj(b.x, b.h, b.z));

	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg, #ffffff 0%, #f4faf6 55%, #eaf5ee 100%)'}}>
			<svg width={1080} height={1920} style={{position: 'absolute'}}>
				{/* road + light trails toward the horizon */}
				{[-1.6, -0.55, 0.55, 1.6].map((k) => (
					<line key={k} x1={540} y1={HZ} x2={540 + k * 900} y2={1920} stroke={C.line} strokeWidth={2} />
				))}
				{new Array(10).fill(0).map((_, i) => {
					const lane = [-1.1, 1.1, -0.3, 0.3][i % 4];
					const t = ((frame * 0.035 + random(`tr${i}`)) % 1) ** 2;
					const t2 = Math.max(0, t - 0.08);
					return <line key={i} x1={540 + lane * 900 * (1 - t)} y1={1920 - (1920 - HZ) * t} x2={540 + lane * 900 * (1 - t2)} y2={1920 - (1920 - HZ) * t2} stroke={C.green} strokeWidth={6 * (1 - t) + 1} strokeLinecap="round" />;
				})}
				<line x1={0} x2={1080} y1={HZ} y2={HZ} stroke={C.green} strokeWidth={2} />

				<g opacity={simplify}>
					{visible.map((b, i) => {
						const [lx, top, s] = proj(b.x - b.w / 2, b.h, b.z);
						const [rx, base] = proj(b.x + b.w / 2, 0, b.z);
						const w = rx - lx;
						const h = base - top;
						const rows = Math.floor(b.h / 90);
						return (
							<g key={i}>
								<rect x={lx} y={top} width={w} height={h} fill="#ffffff" stroke={C.ink} strokeWidth={Math.min(2.5, 0.6 + s)} />
								{new Array(rows).fill(0).map((__, r) =>
									random(`w${i}${r}`) < 0.35 ? <rect key={r} x={lx + w * 0.2} y={top + h * ((r + 0.4) / rows)} width={w * 0.6} height={Math.max(1, h / rows / 5)} fill={b.lit > 0.5 ? C.green : C.line} /> : null,
								)}
							</g>
						);
					})}
					{/* network linking rooftops */}
					{roofs.slice(1).map(([x, y], i) => {
						const [px, py] = roofs[i];
						const pulse = (frame * 0.06 + i * 0.37) % 1;
						return (
							<g key={i}>
								<line x1={px} y1={py} x2={x} y2={y} stroke={C.green} strokeWidth={1.2} opacity={0.45} />
								<circle cx={px + (x - px) * pulse} cy={py + (y - py) * pulse} r={5} fill={C.green} />
							</g>
						);
					})}
				</g>
			</svg>
			<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 700, background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.92) 70%, rgba(255,255,255,0) 100%)'}} />
			<Label x={70} y={250}>
				The future is already here
			</Label>
			<KineticText text="This is just the beginning." start={14} end={106} y={380} size={108} highlight={['beginning.']} seed={81} />
		</AbsoluteFill>
	);
};
