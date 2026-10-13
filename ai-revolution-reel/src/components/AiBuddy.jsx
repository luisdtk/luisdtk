import {interpolate, useCurrentFrame} from 'remotion';
import {C, FONT, easeOut} from '../theme';

/**
 * Small AI robot with an impressed face ("wow"), pointing to its right.
 * Drawn in a 300×533 box (the editor preview).
 */
export const AiBuddy = ({w = 300, h = 533}) => {
	const frame = useCurrentFrame();
	const pop = interpolate(frame, [4, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});
	const bob = Math.sin(frame / 7) * 6;
	const tilt = Math.sin(frame / 11) * 4;
	// pointing arm swings up into place, then taps
	const point = interpolate(frame, [14, 28], [70, -18], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut}) + (frame > 28 ? Math.sin(frame / 3) * 5 : 0);
	// blink every ~2 s
	const blink = frame % 60 > 55 ? 0.15 : 1;
	// eyes grow when impressed
	const wow = interpolate(frame, [20, 30], [1, 1.25], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});
	const mouth = 10 + Math.abs(Math.sin(frame / 5)) * 6;
	const brow = interpolate(frame, [20, 30], [0, -10], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});

	return (
		<div style={{position: 'relative', width: w, height: h, background: 'radial-gradient(circle at 50% 42%, #10301c 0%, #0a0c0a 70%)', overflow: 'hidden'}}>
			<svg width={w} height={h} viewBox="0 0 300 533">
				{/* sparkles */}
				{[
					[52, 120, 0],
					[250, 90, 9],
					[268, 210, 18],
					[40, 300, 27],
				].map(([x, y, d], i) => {
					const s = Math.max(0, Math.sin((frame - d) / 6));
					return <path key={i} d={`M${x} ${y - 12 * s}L${x + 3} ${y - 3}L${x + 12 * s} ${y}L${x + 3} ${y + 3}L${x} ${y + 12 * s}L${x - 3} ${y + 3}L${x - 12 * s} ${y}L${x - 3} ${y - 3}Z`} fill={C.greenMid} opacity={s} />;
				})}
				<g transform={`translate(126 ${270 + bob}) scale(${pop * 0.86}) rotate(${tilt})`}>
					{/* shadow */}
					<ellipse cx={0} cy={190 - bob} rx={70 - bob} ry={10} fill="#000" opacity={0.5} />
					{/* body */}
					<rect x={-58} y={60} width={116} height={100} rx={34} fill="#1d221e" stroke={C.green} strokeWidth={3} />
					<circle cx={0} cy={108} r={14} fill={C.green} opacity={0.4 + 0.4 * Math.abs(Math.sin(frame / 8))} />
					{/* left arm (resting) */}
					<rect x={-80} y={72} width={22} height={64} rx={11} fill="#1d221e" stroke={C.green} strokeWidth={3} transform="rotate(12 -69 76)" />
					{/* right arm pointing to the side */}
					<g transform={`rotate(${point} 62 80)`}>
						<rect x={56} y={70} width={84} height={22} rx={11} fill="#1d221e" stroke={C.green} strokeWidth={3} />
						<circle cx={142} cy={81} r={14} fill="#1d221e" stroke={C.green} strokeWidth={3} />
						<rect x={146} y={75} width={26} height={11} rx={5.5} fill={C.ink} />
					</g>
					{/* antenna */}
					<line x1={0} y1={-118} x2={0} y2={-92} stroke={C.green} strokeWidth={4} />
					<circle cx={0} cy={-124} r={9} fill={C.greenMid} opacity={0.6 + 0.4 * Math.sin(frame / 4)} />
					{/* head */}
					<rect x={-92} y={-94} width={184} height={150} rx={52} fill="#1d221e" stroke={C.green} strokeWidth={3} />
					<rect x={-74} y={-76} width={148} height={114} rx={40} fill="#070907" />
					{/* raised brows */}
					<path d={`M-50 ${-50 + brow} Q-34 ${-60 + brow} -18 ${-50 + brow}`} stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
					<path d={`M18 ${-50 + brow} Q34 ${-60 + brow} 50 ${-50 + brow}`} stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
					{/* wide eyes, glancing toward the pointing hand */}
					<g transform={`translate(0 -20) scale(${wow})`}>
						<ellipse cx={-33} cy={0} rx={17} ry={19 * blink} fill={C.greenMid} />
						<ellipse cx={33} cy={0} rx={17} ry={19 * blink} fill={C.greenMid} />
						<circle cx={-27} cy={-6} r={5 * blink} fill={C.pure} />
						<circle cx={39} cy={-6} r={5 * blink} fill={C.pure} />
					</g>
					{/* "o" mouth */}
					<ellipse cx={0} cy={20} rx={11} ry={mouth} fill={C.greenMid} />
					{/* blush */}
					<ellipse cx={-56} cy={8} rx={10} ry={5} fill={C.green} opacity={0.35} />
					<ellipse cx={56} cy={8} rx={10} ry={5} fill={C.green} opacity={0.35} />
				</g>
			</svg>
			<div style={{position: 'absolute', left: 0, right: 0, bottom: 22, textAlign: 'center', fontFamily: FONT.display, fontStyle: 'italic', fontSize: 40, color: C.greenMid, opacity: interpolate(frame, [26, 36], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
				Wow!
			</div>
		</div>
	);
};
