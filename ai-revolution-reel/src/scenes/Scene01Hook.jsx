import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Flash, Glitch, Label, PaperGrid, Particles} from '../components/FX';
import {Globe} from '../components/Globe';
import {KineticText} from '../components/KineticText';
import {C, easeIn, easeInOut, easeOut} from '../theme';

// 0–4.4 s · blank paper → green line → globe network → hook titles
export const Scene01Hook = () => {
	const frame = useCurrentFrame();

	const lineW = interpolate(frame, [1, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});
	const lineFade = interpolate(frame, [12, 22], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const globeIn = interpolate(frame, [9, 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});
	const push = interpolate(frame, [9, 118], [0.6, 1.05], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});
	const exitZoom = interpolate(frame, [116, 133], [1, 4.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeIn});
	const grow = interpolate(frame, [12, 100], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{background: C.paper}}>
			<Glitch windows={[[10, 12], [71, 73]]} amount={30} seed="s1">
				<AbsoluteFill style={{transform: `scale(${exitZoom})`, transformOrigin: '50% 42%'}}>
					<PaperGrid opacity={globeIn} />
					<Particles count={36} seed="hook" speed={1} opacity={globeIn * 0.45} />
					<AbsoluteFill style={{opacity: globeIn, transform: `scale(${push})`, transformOrigin: '540px 820px'}}>
						<svg width={1080} height={1920}>
							<Globe cx={540} cy={820} R={360} rot={frame * 0.018 + 1.2} tilt={0.38} grow={grow} />
						</svg>
					</AbsoluteFill>
				</AbsoluteFill>
			</Glitch>

			<div
				style={{
					position: 'absolute',
					top: 819,
					left: 540 - 480 * lineW,
					width: 960 * lineW,
					height: 2,
					background: `linear-gradient(90deg, transparent, ${C.green}, transparent)`,
					opacity: lineFade,
				}}
			/>

			<Label x={70} y={250} opacity={globeIn}>
				AI is changing the world
			</Label>

			<KineticText text="AI isn't just a trend." start={12} end={68} y={1300} size={112} highlight={['trend.']} stagger={3} seed={11} />
			<KineticText text="It's a revolution." start={72} end={126} y={1300} size={128} mode="slam" highlight={['revolution.']} stagger={4} exit="zoom" seed={12} />

			<Flash at={127} duration={8} color={C.white} peak={1} />
		</AbsoluteFill>
	);
};
