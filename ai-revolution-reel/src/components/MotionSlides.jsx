import {interpolate, useCurrentFrame} from 'remotion';
import {C, FONT, easeInOut, easeOut} from '../theme';

const SW = 920;
const SH = 500;
const SLIDE_LEN = 20;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};

const SlideTitle = ({t}) => {
	const p = interpolate(t, [0, 12], [0, 1], {...clamp, easing: easeOut});
	return (
		<>
			<svg width={SW} height={SH} style={{position: 'absolute'}}>
				<circle cx={SW / 2} cy={SH / 2} r={170 * p} fill="none" stroke={C.line} strokeWidth={2} />
				{[0, 1, 2].map((k) => {
					const a = t / 6 + (k * Math.PI * 2) / 3;
					return <circle key={k} cx={SW / 2 + Math.cos(a) * 170 * p} cy={SH / 2 + Math.sin(a) * 170 * p} r={k === 0 ? 12 : 8} fill={k === 0 ? C.greenMid : C.green} />;
				})}
			</svg>
			<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.display, fontStyle: 'italic', fontSize: 130, color: C.ink, opacity: p, transform: `translateY(${(1 - p) * 30}px)`}}>
				Motion<span style={{color: C.greenMid}}>.</span>
			</div>
		</>
	);
};

const SlideChart = ({t}) => {
	const bars = [0.3, 0.45, 0.6, 0.78, 0.95];
	return (
		<>
			<div style={{position: 'absolute', left: 50, top: 40, fontFamily: FONT.display, fontSize: 52, color: C.ink}}>
				AI, <span style={{color: C.greenMid, fontStyle: 'italic'}}>accelerating</span>
			</div>
			<svg width={SW} height={SH} style={{position: 'absolute'}}>
				{bars.map((b, i) => {
					const p = interpolate(t, [2 + i * 2, 14 + i * 2], [0, 1], {...clamp, easing: easeOut});
					const h = b * 300 * p;
					return <rect key={i} x={120 + i * 150} y={450 - h} width={90} height={h} rx={10} fill={i === bars.length - 1 ? C.green : C.greenSoft} stroke={C.green} strokeWidth={2} />;
				})}
				<line x1={80} x2={860} y1={451} y2={451} stroke={C.line} strokeWidth={2} />
			</svg>
		</>
	);
};

const SlideWords = ({t}) => {
	const words = ['Ideas', '→', 'Motion', '→', 'Reality'];
	return (
		<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, fontFamily: FONT.display, fontSize: 70, color: C.ink}}>
			{words.map((w, i) => {
				const p = interpolate(t, [i * 2.5, i * 2.5 + 8], [0, 1], {...clamp, easing: easeOut});
				return (
					<span key={i} style={{opacity: p, transform: `translateY(${(1 - p) * 40}px) scale(${0.8 + p * 0.2})`, color: i === 4 ? C.greenMid : w === '→' ? C.faint : C.ink, fontStyle: i === 4 ? 'italic' : 'normal'}}>
						{w}
					</span>
				);
			})}
		</div>
	);
};

const SlideGrid = ({t}) => (
	<>
		<svg width={SW} height={SH} style={{position: 'absolute'}}>
			{new Array(8 * 4).fill(0).map((_, i) => {
				const cx = 120 + (i % 8) * 97;
				const cy = 110 + Math.floor(i / 8) * 80;
				const wave = Math.sin(t / 4 - (i % 8) * 0.5 - Math.floor(i / 8) * 0.6);
				const s = 18 + wave * 12;
				return <rect key={i} x={cx - s} y={cy - s} width={s * 2} height={s * 2} rx={s * (0.3 + 0.3 * wave)} fill={wave > 0.4 ? C.green : 'none'} stroke={C.green} strokeWidth={2} transform={`rotate(${wave * 45} ${cx} ${cy})`} />;
			})}
		</svg>
		<div style={{position: 'absolute', left: 0, right: 0, bottom: 34, textAlign: 'center', fontFamily: FONT.body, fontSize: 30, color: C.muted}}>
			made with <span style={{color: C.greenMid}}>Claude</span>
		</div>
	</>
);

const SLIDES = [SlideTitle, SlideChart, SlideWords, SlideGrid];

const Slide = ({index, t}) => {
	const S = SLIDES[index];
	return (
		<div style={{position: 'absolute', inset: 0, borderRadius: 20, background: 'radial-gradient(circle at 30% 20%, #102a19 0%, #0b0d0b 65%)', overflow: 'hidden'}}>
			<S t={t} />
		</div>
	);
};

/** A Claude-style workspace playing a deck of animated slides. */
export const MotionSlides = ({w = 1000, h = 780}) => {
	const f = useCurrentFrame();
	const idx = Math.floor(f / SLIDE_LEN) % SLIDES.length;
	const local = f % SLIDE_LEN;
	const enter = interpolate(local, [0, 8], [0, 1], {...clamp, easing: easeInOut});
	const prev = (idx + SLIDES.length - 1) % SLIDES.length;
	const showPrev = f >= SLIDE_LEN && enter < 1;
	return (
		<div style={{position: 'relative', width: w, height: h, background: C.white}}>
			{/* header */}
			<div style={{position: 'absolute', left: 40, right: 40, top: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: FONT.body, fontSize: 24, color: C.ink}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 12}}>
					<div style={{width: 10, height: 10, borderRadius: 10, background: C.green}} />
					<span style={{fontFamily: FONT.display, fontSize: 32}}>Claude</span>
					<span style={{color: C.muted}}>· Motion slides</span>
				</div>
				<div style={{fontFamily: FONT.mono, fontSize: 20, color: C.greenMid}}>▶ {String(idx + 1).padStart(2, '0')} / 04</div>
			</div>
			{/* stage */}
			<div style={{position: 'absolute', left: 40, top: 86, width: SW, height: SH, borderRadius: 20, overflow: 'hidden', boxShadow: `0 0 0 1px ${C.line}`}}>
				{showPrev ? (
					<div style={{position: 'absolute', inset: 0, transform: `translateX(${-enter * 40}%) scale(${1 - enter * 0.1})`, opacity: 1 - enter}}>
						<Slide index={prev} t={SLIDE_LEN + local} />
					</div>
				) : null}
				<div style={{position: 'absolute', inset: 0, transform: f >= SLIDE_LEN ? `translateX(${(1 - enter) * 100}%)` : `scale(${0.9 + enter * 0.1})`, opacity: f >= SLIDE_LEN ? 1 : enter}}>
					<Slide index={idx} t={local} />
				</div>
			</div>
			{/* thumbnails + progress */}
			<div style={{position: 'absolute', left: 40, right: 40, top: 610, display: 'flex', gap: 16}}>
				{SLIDES.map((_, i) => (
					<div key={i} style={{position: 'relative', width: 218, height: 118, borderRadius: 12, overflow: 'hidden', boxShadow: `0 0 0 ${i === idx ? 3 : 1}px ${i === idx ? C.green : C.line}`}}>
						<div style={{width: SW, height: SH, transform: `scale(${218 / SW})`, transformOrigin: '0 0', position: 'relative'}}>
							<Slide index={i} t={16} />
						</div>
					</div>
				))}
			</div>
			<div style={{position: 'absolute', left: 40, right: 40, top: 748, height: 4, borderRadius: 4, background: C.line}}>
				<div style={{width: `${((f % (SLIDE_LEN * SLIDES.length)) / (SLIDE_LEN * SLIDES.length)) * 100}%`, height: '100%', borderRadius: 4, background: C.green}} />
			</div>
		</div>
	);
};
