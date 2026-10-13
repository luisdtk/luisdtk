import {interpolate, random, useCurrentFrame} from 'remotion';
import {C, FONT, easeOut} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};

const COMMENTS = [
	{user: 'marina.creates', text: 'How do I use AI like this??'},
	{user: 'dev.lucas', text: 'Tutorial please! What tool is this?'},
	{user: 'ana_design', text: 'This is insane. How do I start?'},
	{user: 'rafa.edits', text: 'Can AI really edit a whole video?'},
];

const fmt = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${Math.round(n)}`);

/** Profile logo: white disc with a black four-point star and swoosh. */
const Logo = ({size}) => (
	<svg width={size} height={size} viewBox="0 0 100 100">
		<circle cx={50} cy={50} r={50} fill="#ffffff" />
		<path d="M30 46 L34 56 L44 60 L34 64 L30 74 L26 64 L16 60 L26 56 Z" fill="#000" />
		<path d="M36 58 Q60 40 84 32 Q62 46 38 62 Z" fill="#000" />
		<circle cx={30} cy={40} r={3} fill="#000" />
	</svg>
);

const Heart = ({x, y, s, o}) => (
	<path transform={`translate(${x} ${y}) scale(${s})`} d="M0 6 C0 -2 10 -2 10 4 C10 -2 20 -2 20 6 C20 13 10 18 10 20 C10 18 0 13 0 6 Z" fill={C.green} opacity={o} />
);

/** The creator's profile with a reel taking off: views climbing and questions pouring in. */
export const ProfileReel = ({w = 1000, h = 780, startAt = 0}) => {
	const f = useCurrentFrame() - startAt;
	const head = interpolate(f, [0, 10], [0, 1], {...clamp, easing: easeOut});
	const views = interpolate(f, [4, 40], [1200, 1.2e6], {...clamp, easing: (t) => t * t});
	const likes = interpolate(f, [4, 40], [80, 86e3], {...clamp, easing: (t) => t * t});

	return (
		<div style={{position: 'relative', width: w, height: h, background: '#0d0f12', overflow: 'hidden', fontFamily: FONT.body, color: C.ink}}>
			{/* profile header */}
			<div style={{position: 'absolute', left: 40, top: 34, display: 'flex', alignItems: 'center', gap: 28, opacity: head, transform: `translateY(${(1 - head) * 20}px)`}}>
				<div style={{padding: 6, borderRadius: '50%', background: `conic-gradient(${C.green}, ${C.greenMid}, ${C.green})`, transform: `rotate(${f * 3}deg)`}}>
					<div style={{transform: `rotate(${-f * 3}deg)`, borderRadius: '50%', border: '5px solid #0d0f12'}}>
						<Logo size={130} />
					</div>
				</div>
				<div>
					<div style={{fontSize: 34, fontWeight: 600}}>Luunar Time | AI Content</div>
					<div style={{fontSize: 24, color: C.muted, marginTop: 4}}>@ailuunartime</div>
					<div style={{fontSize: 24, marginTop: 10}}>Smarter systems, less manual work.</div>
				</div>
			</div>

			{/* reel tile */}
			<div style={{position: 'absolute', left: 40, top: 230, width: 330, height: 440, borderRadius: 20, overflow: 'hidden', background: 'radial-gradient(circle at 50% 35%, #134226 0%, #0a0c0a 75%)', boxShadow: `0 0 0 1px ${C.line}`}}>
				<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.display, fontSize: 44, lineHeight: 1.1, textAlign: 'center', padding: 24}}>
					<span>
						<span style={{color: C.greenMid, fontStyle: 'italic'}}>Claude</span> is editing this video.
					</span>
				</div>
				<div style={{position: 'absolute', left: 18, bottom: 18, display: 'flex', alignItems: 'center', gap: 10, fontSize: 30, fontWeight: 600}}>
					<span style={{fontSize: 22}}>▶</span>
					{fmt(views)}
				</div>
				<div style={{position: 'absolute', right: 18, bottom: 18, display: 'flex', alignItems: 'center', gap: 8, fontSize: 24, color: C.greenMid}}>
					<svg width={26} height={24} viewBox="0 0 20 20">
						<path d="M0 6 C0 -2 10 -2 10 4 C10 -2 20 -2 20 6 C20 13 10 18 10 20 C10 18 0 13 0 6 Z" fill={C.green} />
					</svg>
					{fmt(likes)}
				</div>
				{/* floating hearts */}
				<svg width={330} height={440} style={{position: 'absolute', inset: 0}}>
					{new Array(10).fill(0).map((_, i) => {
						const t0 = 6 + i * 4;
						const p = (f - t0) / 26;
						if (p < 0 || p > 1) return null;
						return <Heart key={i} x={250 + Math.sin(p * 6 + i) * 22} y={380 - p * 300} s={1 + random(`hs${i}`)} o={1 - p} />;
					})}
				</svg>
			</div>

			{/* comments */}
			<div style={{position: 'absolute', left: 400, top: 230, right: 36}}>
				<div style={{fontSize: 22, color: C.muted, marginBottom: 14}}>{`Comments · ${fmt(interpolate(f, [8, 40], [12, 4800], {...clamp, easing: (t) => t * t}))}`}</div>
				{COMMENTS.map((c, i) => {
					const p = interpolate(f, [10 + i * 7, 18 + i * 7], [0, 1], {...clamp, easing: easeOut});
					return (
						<div key={c.user} style={{display: 'flex', gap: 14, marginBottom: 16, opacity: p, transform: `translateX(${(1 - p) * 60}px)`}}>
							<div style={{flex: 'none', width: 46, height: 46, borderRadius: 46, background: [C.green, '#3b82f6', '#a855f7', '#f59e0b'][i], opacity: 0.85}} />
							<div style={{background: C.raised, borderRadius: 18, padding: '12px 18px', boxShadow: `0 0 0 1px ${C.line}`}}>
								<div style={{fontSize: 18, color: C.muted, marginBottom: 4}}>{c.user}</div>
								<div style={{fontSize: 24, lineHeight: 1.3}}>{c.text}</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
