import {interpolate, useCurrentFrame} from 'remotion';
import timeline from '../timeline.json';
import {C, FONT} from '../theme';

const MAX_WORDS = 5;

// Split each narration phrase (absolute seconds) into short chunks, timed by character count.
const CHUNKS = timeline.phrases.flatMap((p) => {
	const words = p.text.split(' ');
	const groups = [];
	for (let i = 0; i < words.length; i += MAX_WORDS) groups.push(words.slice(i, i + MAX_WORDS).join(' '));
	if (groups.length > 1 && groups[groups.length - 1].split(' ').length < 2) {
		const last = groups.pop();
		groups[groups.length - 1] += ` ${last}`;
	}
	const total = groups.reduce((a, g) => a + g.length, 0);
	let t = p.start;
	return groups.map((g) => {
		const d = ((p.end - p.start) * g.length) / total;
		const c = {start: t, end: t + d, text: g};
		t += d;
		return c;
	});
});

/** Narration subtitles in the lower safe area; hidden where the title already says it. */
export const Captions = ({hideAfter = 1622}) => {
	const frame = useCurrentFrame();
	if (frame >= hideAfter) return null;
	const t = frame / timeline.fps;
	const c = CHUNKS.find((x) => t >= x.start && t < x.end + 0.12);
	if (!c || c.text === 'Right now,') return null;
	const p = interpolate(t, [c.start, c.start + 0.12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<div style={{position: 'absolute', left: 70, right: 70, top: 1460, display: 'flex', justifyContent: 'center'}}>
			<div
				style={{
					padding: '14px 26px',
					borderRadius: 18,
					background: 'rgba(255,255,255,0.94)',
					border: `1px solid ${C.line}`,
					fontFamily: FONT.body,
					fontSize: 34,
					lineHeight: 1.3,
					color: C.ink,
					textAlign: 'center',
					opacity: p,
					transform: `translateY(${(1 - p) * 8}px)`,
				}}
			>
				{c.text}
			</div>
		</div>
	);
};
