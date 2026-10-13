import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Particles} from '../components/FX';
import {KineticText} from '../components/KineticText';
import {C, FONT, easeInOut, easeOut} from '../theme';

// 51.1–54.1 s · quiet brand moment: name, tagline, a single green line
export const Scene09ClaudeBrand = () => {
	const frame = useCurrentFrame();
	const line = interpolate(frame, [4, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});
	const sweep = interpolate(frame, [10, 50], [-30, 130], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const scale = interpolate(frame, [0, 90], [1.04, 1], {easing: easeOut});
	const out = interpolate(frame, [82, 90], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{background: C.paper, opacity: out}}>
			<Particles count={28} seed="brand" speed={0.6} opacity={0.35} />
			<AbsoluteFill style={{transform: `scale(${scale})`}}>
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: 700,
						textAlign: 'center',
						fontFamily: FONT.display,
						fontWeight: 400,
						fontSize: 220,
						letterSpacing: '-0.03em',
						lineHeight: 1,
						color: 'transparent',
						backgroundImage: `linear-gradient(100deg, ${C.ink} ${sweep - 20}%, ${C.green} ${sweep}%, ${C.ink} ${sweep + 20}%)`,
						WebkitBackgroundClip: 'text',
						backgroundClip: 'text',
						opacity: interpolate(frame, [2, 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
						filter: `blur(${interpolate(frame, [2, 16], [10, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px)`,
					}}
				>
					Claude.
				</div>
				<div style={{position: 'absolute', top: 980, left: 540 - 300 * line, width: 600 * line, height: 2, background: C.green}} />
			</AbsoluteFill>
			<KineticText text="Ideas into reality." start={30} end={92} y={1030} size={64} font={FONT.body} letterSpacing={-0.01} color={C.muted} highlight={['reality.']} italicHighlight={false} seed={91} />
		</AbsoluteFill>
	);
};
