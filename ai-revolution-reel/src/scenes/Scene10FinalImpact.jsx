import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Flash, LightStreak} from '../components/FX';
import {KineticText} from '../components/KineticText';
import {C, easeInOut, easeOut} from '../theme';

const SECOND = 63; // "It's giving us a new one."

// 54.1–58.8 s · the closing statement and a clean exit
export const Scene10FinalImpact = () => {
	const frame = useCurrentFrame();
	const line = interpolate(frame, [0, 16], [0, 1], {extrapolateRight: 'clamp', easing: easeInOut});
	const settle = interpolate(frame, [SECOND, SECOND + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});
	const end = interpolate(frame, [124, 142], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});
	return (
		<AbsoluteFill style={{background: C.paper}}>
			<div style={{position: 'absolute', top: 1180, left: 0, width: 1080 * line, height: 2, background: C.green, opacity: 1 - settle * 0.4}} />
			<AbsoluteFill style={{transform: `translateY(${-settle * 120}px)`}}>
				<KineticText text="AI isn't just changing the world." start={2} end={150} y={760} size={96} highlight={[]} stagger={3} seed={101} />
			</AbsoluteFill>
			<KineticText text="It's giving us a new one." start={SECOND} end={150} y={900} size={120} mode="slam" stagger={4} highlight={['new', 'one.']} seed={102} />
			<Flash at={SECOND} duration={8} color={C.green} peak={0.3} />
			<LightStreak at={120} duration={20} y={1180} length={900} />
			<AbsoluteFill style={{background: C.paper, opacity: end}} />
		</AbsoluteFill>
	);
};
