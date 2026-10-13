import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {easeIn, easeOut} from '../theme';

/**
 * Shared camera for every scene: a zoom-blur entrance, a gentle floating
 * drift while the scene plays and a quick push-out before the cut.
 */
export const SceneWrap = ({duration, index, children}) => {
	const f = useCurrentFrame();
	const dir = index % 2 ? 1 : -1;
	const inT = interpolate(f, [0, 10], [0, 1], {extrapolateRight: 'clamp', easing: easeOut});
	const outT = interpolate(f, [duration - 7, duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeIn});
	const scale = (1.08 - 0.08 * inT) * (1 + 0.05 * outT) * (1 + 0.012 * Math.sin(f / 45));
	const x = Math.sin(f / 38 + index) * 7 + dir * (1 - inT) * 40;
	const y = Math.cos(f / 47 + index) * 7;
	const rot = Math.sin(f / 60 + index) * 0.35 + dir * (1 - inT) * 1.2;
	const blur = (1 - inT) * 10 + outT * 8;
	return (
		<AbsoluteFill
			style={{
				transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`,
				filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};
