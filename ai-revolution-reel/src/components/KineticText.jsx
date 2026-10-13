import {interpolate, random, useCurrentFrame} from 'remotion';
import {C, FONT, easeIn, easeOut} from '../theme';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@<>/\\{}[]';

const clean = (w) => w.replace(/[^A-Z0-9']/gi, '').toUpperCase();

/**
 * Kinetic title. Modes:
 *  rise   – words rise out of a mask with blur
 *  slam   – words punch in from a large scale with a shake
 *  scramble – characters decode from random glyphs
 *  type   – characters type on with a cursor
 * `highlight` lists words rendered in green.
 */
export const KineticText = ({
	text,
	start = 0,
	end = Infinity,
	mode = 'rise',
	size = 110,
	y = 900,
	highlight = [],
	color = C.ink,
	accent = C.green,
	italicHighlight = true,
	stagger = 3,
	weight = 400,
	letterSpacing = -0.025,
	lineHeight = 1.05,
	maxWidth = 920,
	exit = 'up',
	align = 'center',
	font = FONT.display,
	seed = 1,
}) => {
	const frame = useCurrentFrame();
	const f = frame - start;
	if (f < 0 || frame > end + 1) return null;

	const words = text.split(' ');
	const exitT = end === Infinity ? 0 : interpolate(frame, [end - 8, end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeIn});
	const hl = highlight.map(clean);

	let shakeX = 0;
	let shakeY = 0;
	if (mode === 'slam') {
		const s = interpolate(f, [0, 10], [1, 0], {extrapolateRight: 'clamp'});
		shakeX = (random(`sx${seed}${f}`) - 0.5) * 8 * s;
		shakeY = (random(`sy${seed}${f}`) - 0.5) * 8 * s;
	}

	const containerStyle = {
		position: 'absolute',
		left: 0,
		right: 0,
		top: y,
		display: 'flex',
		justifyContent: align === 'center' ? 'center' : 'flex-start',
		paddingLeft: align === 'center' ? 0 : 80,
		transform: `translate(${shakeX}px, ${shakeY + (exit === 'up' ? -60 * exitT : 0)}px) scale(${exit === 'zoom' ? 1 + exitT * 0.6 : 1})`,
		opacity: 1 - exitT,
		filter: exitT > 0 ? `blur(${exitT * 14}px)` : undefined,
	};

	let charIndex = 0;
	return (
		<div style={containerStyle}>
			<div
				style={{
					maxWidth,
					display: 'flex',
					flexWrap: 'wrap',
					justifyContent: align === 'center' ? 'center' : 'flex-start',
					columnGap: size * 0.26,
					rowGap: size * (lineHeight - 1) + 6,
					fontFamily: font,
					fontWeight: weight,
					fontSize: size,
					lineHeight,
					letterSpacing: `${letterSpacing}em`,
					textAlign: align,
				}}
			>
				{words.map((w, i) => {
					const isHl = hl.includes(clean(w));
					const wc = isHl ? accent : color;
					const shadow = 'none';
					const fontStyle = isHl && italicHighlight && font === FONT.display ? 'italic' : 'normal';
					const wf = f - i * stagger;

					if (mode === 'rise') {
						const p = interpolate(wf, [0, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});
						return (
							<span key={i} style={{overflow: 'hidden', display: 'inline-block', paddingBottom: size * 0.08, marginBottom: -size * 0.08}}>
								<span
									style={{
										display: 'inline-block',
										transform: `translateY(${(1 - p) * 105}%) skewY(${(1 - p) * 6}deg)`,
										filter: `blur(${(1 - p) * 10}px)`,
										color: wc,
										textShadow: shadow,
										fontStyle,
									}}
								>
									{w}
								</span>
							</span>
						);
					}

					if (mode === 'slam') {
						const p = interpolate(wf, [0, 9], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});
						return (
							<span
								key={i}
								style={{
									display: 'inline-block',
									opacity: wf < 0 ? 0 : Math.min(1, p * 2),
									transform: `scale(${interpolate(p, [0, 1], [1.35, 1])})`,
									filter: `blur(${(1 - p) * 12}px)`,
									color: wc,
									textShadow: shadow,
									fontStyle,
								}}
							>
								{w}
							</span>
						);
					}

					// character based modes
					const chars = w.split('').map((ch) => {
						const ci = charIndex++;
						const cf = f - ci * (mode === 'type' ? 1.2 : 0.8);
						if (mode === 'type') {
							return (
								<span key={ci} style={{opacity: cf >= 0 ? 1 : 0}}>
									{ch}
								</span>
							);
						}
						const settled = cf > 9;
						const shown = cf >= 0;
						const glyph = settled ? ch : GLYPHS[Math.floor(random(`g${seed}-${ci}-${Math.floor(f / 2)}`) * GLYPHS.length)];
						return (
							<span
								key={ci}
								style={{
									opacity: shown ? (settled ? 1 : 0.75) : 0,
									color: settled ? undefined : C.faint,
								}}
							>
								{glyph}
							</span>
						);
					});
					charIndex++;
					return (
						<span key={i} style={{display: 'inline-block', color: wc, textShadow: shadow, whiteSpace: 'nowrap', fontStyle}}>
							{chars}
						</span>
					);
				})}
				{mode === 'type' && charIndex > 0 ? (
					<span
						style={{
							display: 'inline-block',
							width: Math.max(3, size * 0.035),
							height: size * 0.85,
							marginLeft: -size * 0.18,
							background: accent,
							opacity: Math.floor(f / 8) % 2 === 0 ? 1 : 0.15,
							alignSelf: 'center',
						}}
					/>
				) : null}
			</div>
		</div>
	);
};
