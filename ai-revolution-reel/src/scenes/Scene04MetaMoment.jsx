import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {EditorUI} from '../components/EditorUI';
import {Flash, Label, PaperGrid} from '../components/FX';
import {KineticText} from '../components/KineticText';
import {C, FONT, easeIn, easeInOut, easeOut} from '../theme';

const PUSH = 198; // camera dives into the interface
const DROP = 240; // musical drop, "Right now…"
const PROMPT = 'Organize this video: sync the voice, cut the footage, add the transitions.';
const STEPS = ['Scenes organized', 'Narration synced', 'Transitions placed'];

const PromptBox = ({frame}) => {
	const p = interpolate(frame, [268, 282], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});
	const chars = Math.floor(interpolate(frame, [280, 330], [0, PROMPT.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
	const sent = frame > 340;
	return (
		<div style={{position: 'absolute', left: 70, right: 70, top: 640, opacity: p, transform: `translateY(${(1 - p) * 30}px)`}}>
			<div style={{borderRadius: 24, background: C.white, border: `1px solid ${C.line}`, boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 80px rgba(34,197,94,0.08)', padding: '30px 34px 24px', minHeight: 190}}>
				<div style={{fontFamily: FONT.body, fontSize: 32, lineHeight: 1.4, color: chars > 0 ? C.ink : C.faint}}>
					{chars > 0 ? PROMPT.slice(0, chars) : 'How can I help you today?'}
					{!sent ? <span style={{display: 'inline-block', width: 3, height: 34, marginLeft: 3, verticalAlign: 'middle', background: C.green, opacity: Math.floor(frame / 8) % 2 ? 0.2 : 1}} /> : null}
				</div>
				<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, fontFamily: FONT.body, fontSize: 22, color: C.muted}}>
					<span style={{fontSize: 34, color: C.muted}}>+</span>
					<div style={{width: 52, height: 52, borderRadius: 14, background: sent ? C.green : C.line, color: C.pure, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28}}>↑</div>
				</div>
			</div>
			<div style={{display: 'flex', justifyContent: 'space-between', marginTop: 16, padding: '0 12px', fontFamily: FONT.body, fontSize: 22, color: C.muted}}>
				<span>Project · ai-revolution-reel</span>
				<span>Claude · Remotion</span>
			</div>
		</div>
	);
};

// 20.6–33.4 s · the editing interface, then the fourth-wall reveal
export const Scene04MetaMoment = () => {
	const frame = useCurrentFrame();

	const winIn = interpolate(frame, [0, 18], [0, 1], {extrapolateRight: 'clamp', easing: easeOut});
	const drift = interpolate(frame, [0, PUSH], [0.94, 1.0], {extrapolateRight: 'clamp', easing: easeInOut});
	const dive = interpolate(frame, [PUSH, DROP], [1, 3.2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeIn});
	const diveFade = interpolate(frame, [DROP - 14, DROP], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{background: C.paper}}>
			<PaperGrid />
			{frame < DROP ? (
				<AbsoluteFill style={{opacity: winIn * diveFade}}>
					<Label x={70} y={250}>
						Behind this video
					</Label>
					<div style={{position: 'absolute', left: 40, top: 520, transform: `scale(${drift * dive}) translateY(${(1 - winIn) * 80}px)`, transformOrigin: '50% 75%'}}>
						<EditorUI w={1000} h={1040} />
					</div>
					<KineticText text="Created. Modified. Transformed." start={78} end={PUSH} y={330} size={80} stagger={20} highlight={['Transformed.']} seed={41} />
				</AbsoluteFill>
			) : null}

			{frame >= DROP ? (
				<AbsoluteFill>
					<KineticText text="Right now…" start={DROP + 4} end={383} y={360} size={120} mode="type" highlight={[]} seed={44} />
					<PromptBox frame={frame} />
					<KineticText text="Claude is editing this video." start={300} end={383} y={1020} size={104} mode="slam" stagger={3} highlight={['Claude']} seed={45} />
					<div style={{position: 'absolute', left: 70, right: 70, top: 1290, display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center'}}>
						{STEPS.map((s, i) => {
							const p = interpolate(frame, [342 + i * 6, 352 + i * 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});
							return (
								<div key={s} style={{padding: '14px 24px', borderRadius: 40, background: C.greenSoft, color: C.green, fontFamily: FONT.body, fontSize: 24, opacity: p, transform: `translateY(${(1 - p) * 16}px)`}}>
									✓ {s}
								</div>
							);
						})}
					</div>
				</AbsoluteFill>
			) : null}
			<Flash at={DROP} duration={6} color={C.paper} peak={1} />
			<Flash at={300} duration={6} color={C.green} peak={0.35} />
		</AbsoluteFill>
	);
};
