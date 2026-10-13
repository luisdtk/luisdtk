import {interpolate, random, useCurrentFrame} from 'remotion';
import timeline from '../timeline.json';
import {AiBuddy} from './AiBuddy';
import {C, FONT, easeOut} from '../theme';

const TOTAL = timeline.durationInFrames;

const SCENE_LABELS = ['Hook', 'Worlds', 'One world', 'Meta', 'Code', 'Viewer', 'Beyond', 'Future', 'Claude', 'Final'];

export const ASSETS = [
	'video/footage.mp4',
	'audio/voice.wav',
	'audio/music.wav',
	'audio/user/boom_a.wav',
	'audio/sfx/whoosh.wav',
	'scenes/Scene01Hook.jsx',
	'scenes/Scene02WorldsColliding.jsx',
	'scenes/Scene04MetaMoment.jsx',
];

const pop = (frame, at) => interpolate(frame, [at, at + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});

/** Track lane with clips that slide in and snap into place. */
const Track = ({label, clips, y, frame, at, color = C.green, soft = C.greenSoft, w}) => (
	<div style={{position: 'absolute', left: 0, top: y, width: w, height: 58}}>
		<div style={{position: 'absolute', left: 0, top: 16, width: 110, fontFamily: FONT.mono, fontSize: 18, color: C.muted}}>{label}</div>
		<div style={{position: 'absolute', left: 120, right: 0, top: 0, height: 52, borderRadius: 10, background: C.raised}} />
		{clips.map((c, i) => {
			const p = pop(frame, at + i * 3);
			const left = 120 + (c.from / TOTAL) * (w - 120);
			const width = Math.max(6, (c.dur / TOTAL) * (w - 120) - 4);
			return (
				<div
					key={i}
					style={{
						position: 'absolute',
						top: 4,
						left: left + (1 - p) * 120,
						width,
						height: 44,
						borderRadius: 8,
						background: c.strong ? color : soft,
						border: `1.5px solid ${color}`,
						opacity: p,
						overflow: 'hidden',
						fontFamily: FONT.body,
						fontSize: 15,
						color: c.strong ? C.paper : C.ink,
						padding: '12px 8px',
						whiteSpace: 'nowrap',
					}}
				>
					{c.label}
				</div>
			);
		})}
	</div>
);

/** Light editing interface built from the real project timeline and assets. */
export const EditorUI = ({w = 1000, h = 1040, start = 0}) => {
	const f = useCurrentFrame() - start;
	const head = interpolate(f, [20, 230], [0.08, 0.62], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const sceneClips = timeline.scenes.map((s, i) => ({from: s.from, dur: s.duration, label: SCENE_LABELS[i], strong: i === 3}));
	const voiceClips = timeline.phrases.map((p) => ({from: p.start * 30, dur: (p.end - p.start) * 30, label: ''}));
	const textClips = timeline.scenes.map((s) => ({from: s.from + 10, dur: s.duration * 0.6, label: 'T'}));
	const sfxClips = new Array(26).fill(0).map((_, i) => ({from: (i / 26) * TOTAL + random(`sx${i}`) * 30, dur: 6, label: ''}));
	const tlW = w - 64;
	return (
		<div style={{position: 'relative', width: w, height: h, borderRadius: 28, background: C.white, boxShadow: '0 0 0 1px #262a26, 0 24px 70px rgba(0,0,0,0.6), 0 0 120px rgba(34,197,94,0.08)', overflow: 'hidden'}}>
			{/* top bar */}
			<div style={{position: 'absolute', left: 32, right: 32, top: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: FONT.body, fontSize: 24, color: C.ink}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 14}}>
					<div style={{width: 10, height: 10, borderRadius: 10, background: C.green}} />
					ai-revolution-reel
				</div>
				<div style={{fontSize: 19, color: C.muted}}>Remotion · 1080×1920 · 30 fps</div>
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 84, height: 1, background: C.line}} />

			{/* preview */}
			<div style={{position: 'absolute', left: 32, top: 116, width: 300, height: 533, borderRadius: 16, overflow: 'hidden', background: C.paper, opacity: pop(f, 4)}}>
				<AiBuddy />
			</div>

			{/* assets */}
			<div style={{position: 'absolute', left: 364, top: 116, right: 32}}>
				<div style={{fontFamily: FONT.body, fontSize: 20, color: C.muted, marginBottom: 14}}>Assets</div>
				{ASSETS.map((a, i) => {
					const p = pop(f, 10 + i * 6);
					const done = f > 30 + i * 6;
					return (
						<div
							key={a}
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								height: 54,
								padding: '0 18px',
								marginBottom: 8,
								borderRadius: 12,
								border: `1px solid ${C.line}`,
								fontFamily: FONT.mono,
								fontSize: 19,
								color: C.ink,
								opacity: p,
								transform: `translateX(${(1 - p) * 40}px)`,
							}}
						>
							{a}
							<span style={{color: done ? C.green : C.faint, fontFamily: FONT.body}}>{done ? '✓' : '…'}</span>
						</div>
					);
				})}
			</div>

			{/* timeline */}
			<div style={{position: 'absolute', left: 32, right: 32, top: 690, height: 320}}>
				<div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT.body, fontSize: 20, color: C.muted, marginBottom: 12}}>
					<span>Timeline</span>
					<span style={{fontFamily: FONT.mono}}>{`00:${String(Math.floor(head * 58.8)).padStart(2, '0')} / 00:58`}</span>
				</div>
				<div style={{position: 'relative', width: tlW, height: 280}}>
					<Track label="video" clips={sceneClips} y={0} frame={f} at={24} w={tlW} />
					<Track label="text" clips={textClips} y={66} frame={f} at={40} w={tlW} color={C.ink} soft={C.raised} />
					<Track label="voice" clips={voiceClips} y={132} frame={f} at={52} w={tlW} />
					<Track label="sfx" clips={sfxClips} y={198} frame={f} at={64} w={tlW} color={C.muted} soft={C.raised} />
					<div style={{position: 'absolute', top: -6, bottom: 0, left: 120 + head * (tlW - 120), width: 2, background: C.green}}>
						<div style={{position: 'absolute', top: -8, left: -7, width: 16, height: 16, borderRadius: 16, background: C.green}} />
					</div>
				</div>
			</div>
		</div>
	);
};
