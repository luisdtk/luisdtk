import {AbsoluteFill, Freeze, interpolate, useCurrentFrame} from 'remotion';
import {FootageBox} from '../components/Footage';
import {Glitch, PaperGrid} from '../components/FX';
import {KineticText} from '../components/KineticText';
import {C, FONT, easeInOut, easeOut} from '../theme';

const FREEZE = [36, 46];

// Face profile (facing left in path space, mirrored to face the phone).
const FACE =
	'M420 60 C300 40 220 110 210 230 L200 300 C190 330 175 360 150 400 L140 420 C150 435 175 440 190 445 C185 465 180 480 188 495 C178 505 178 515 190 525 C185 545 190 575 215 600 C240 625 280 630 300 640 L310 760 C330 820 340 880 350 900';
const BACK = 'M420 60 C560 70 620 200 610 330 C600 460 560 520 520 560 L500 680 C520 760 560 840 600 900';

const Phone = ({frame}) => {
	const inner = (
		<div style={{position: 'absolute', inset: 16, borderRadius: 40, overflow: 'hidden', background: C.paper}}>
			<div style={{position: 'absolute', left: 0, top: 200, width: 408, height: 300}}>
				<FootageBox start={39.5} width={408} height={300} zoom={1.1} duration={80} />
			</div>
			<div style={{position: 'absolute', left: 24, right: 24, top: 70, fontFamily: FONT.display, fontSize: 40, lineHeight: 1.1, color: C.ink, textAlign: 'center'}}>
				<span style={{color: C.green, fontStyle: 'italic'}}>Claude</span> is editing this video.
			</div>
			<div style={{position: 'absolute', left: 24, right: 24, top: 540, height: 4, borderRadius: 4, background: C.line}}>
				<div style={{width: `${interpolate(frame, [0, 78], [52, 64])}%`, height: '100%', background: C.green, borderRadius: 4}} />
			</div>
		</div>
	);
	return (
		<div style={{position: 'relative', width: 440, height: 900, borderRadius: 56, background: '#262a26', boxShadow: '0 30px 120px rgba(34,197,94,0.35), 0 10px 30px rgba(0,0,0,0.6)'}}>
			{frame >= FREEZE[0] && frame < FREEZE[1] ? <Freeze frame={FREEZE[0]}>{inner}</Freeze> : inner}
		</div>
	);
};

// 39.6–42.2 s · the viewer, lit by the screen showing this very video
export const Scene06ViewerIsPartOfIt = () => {
	const frame = useCurrentFrame();
	const push = interpolate(frame, [0, 78], [1.1, 1.22], {easing: easeInOut});
	const enter = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp', easing: easeOut});
	const draw = interpolate(frame, [0, 26], [1400, 0], {extrapolateRight: 'clamp', easing: easeOut});
	const frozen = frame >= FREEZE[0] && frame < FREEZE[1];

	return (
		<AbsoluteFill style={{background: C.paper}}>
			<PaperGrid />
			<Glitch windows={[[FREEZE[0], FREEZE[0] + 3], [FREEZE[1] - 2, FREEZE[1]]]} amount={36} seed="s6">
				<AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '540px 1000px', opacity: enter}}>
					{/* soft green light thrown by the screen */}
					<div style={{position: 'absolute', left: 120, top: 520, width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,222,128,0.28), transparent 65%)'}} />
					<svg width={1080} height={1920} style={{position: 'absolute'}}>
						<g transform="translate(560 560) scale(-0.95 0.95)">
							<path d={`${BACK}`} fill="none" stroke={C.ink} strokeWidth={2.2} strokeDasharray={1400} strokeDashoffset={draw} opacity={0.6} />
							<path d={FACE} fill="none" stroke={C.ink} strokeWidth={3} strokeDasharray={1400} strokeDashoffset={draw} />
							<path d={FACE} fill="none" stroke={C.green} strokeWidth={6} strokeDasharray={1400} strokeDashoffset={draw} opacity={0.35} transform="translate(-6 0)" />
							<ellipse cx={262} cy={300} rx={9} ry={6} fill={C.green} opacity={0.9} />
						</g>
					</svg>
					<div style={{position: 'absolute', left: 560, top: 640, transform: 'rotate(-6deg)'}}>
						<Phone frame={frame} />
					</div>
				</AbsoluteFill>
			</Glitch>
			{frozen ? (
				<div style={{position: 'absolute', right: 70, top: 250, fontFamily: FONT.mono, fontSize: 22, color: C.green}}>❚❚ paused</div>
			) : null}
			<KineticText text="The same AI helping create this…" start={2} end={38} y={300} size={82} highlight={['this…']} seed={61} />
			<KineticText text="is changing what's possible." start={42} end={78} y={300} size={86} highlight={['possible.']} seed={62} />
		</AbsoluteFill>
	);
};
