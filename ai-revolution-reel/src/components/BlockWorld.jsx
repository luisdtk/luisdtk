import {AbsoluteFill, random, useCurrentFrame} from 'remotion';

const B = 96; // block size in px
const GROUND = 1240; // y of the grass surface at height 0

const px = (rows, palette, u) =>
	rows.flatMap((row, y) =>
		row.split('').map((ch, x) => (ch === '.' ? null : <rect key={`${x}-${y}`} x={x * u} y={y * u} width={u + 0.5} height={u + 0.5} fill={palette[ch]} />)),
	);

/** 8x8 pixel textures for blocks, built as SVG patterns. */
const Textures = ({id}) => {
	const tex = (name, base, alt, dark, top) => (
		<pattern id={`${id}-${name}`} width={B} height={B} patternUnits="userSpaceOnUse">
			{new Array(64).fill(0).map((_, i) => {
				const x = i % 8;
				const y = Math.floor(i / 8);
				const r = random(`${name}${i}`);
				let fill = r < 0.3 ? alt : r < 0.42 ? dark : base;
				if (top) {
					const edge = y < 2 || (y === 2 && random(`e${name}${x}`) < 0.55);
					if (edge) fill = r < 0.4 ? top[1] : top[0];
				}
				return <rect key={i} x={x * 12} y={y * 12} width={12.5} height={12.5} fill={fill} />;
			})}
		</pattern>
	);
	return (
		<defs>
			{tex('grass', '#7a5234', '#8c613f', '#5e3d26', ['#4f9e34', '#62b844'])}
			{tex('dirt', '#7a5234', '#8c613f', '#5e3d26')}
			{tex('stone', '#6f7275', '#7f8285', '#56585b')}
			{tex('log', '#6b4f2a', '#5a4022', '#7e5f35')}
			{tex('leaf', '#2f6b23', '#3b8a2c', '#24541b')}
			{tex('obsidian', '#140c22', '#1e1233', '#0b0614')}
		</defs>
	);
};

export const STEVE_ROWS = {
	head: ['HHHHHHHH', 'HHHHHHHH', 'HHHSSSSS', 'HHSSSSSS', 'HHSSSWES', 'HSSSSSSN', 'HSSSSBBB', 'HSSSSSSS'],
	torso: ['TTTT', 'TTTT', 'TTTT', 'TTTT', 'TTTT', 'TTTT', 'TTTT', 'TTTT', 'TTTT', 'TTTT', 'TTTT', 'TTTT'],
	arm: ['TTTT', 'TTTT', 'TTTT', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'SSSS'],
	leg: ['PPPP', 'PPPP', 'PPPP', 'PPPP', 'PPPP', 'PPPP', 'PPPP', 'PPPP', 'PPPP', 'PPPP', 'GGGG', 'GGGG'],
};

const STEVE_PAL = {H: '#3b2716', S: '#c48a64', N: '#b07856', W: '#ffffff', E: '#4a3fbf', B: '#6a3f2a', T: '#14a3a3', P: '#33339e', G: '#5f5f5f'};
const darken = (hex, k) => {
	const n = parseInt(hex.slice(1), 16);
	const ch = (s) => Math.round(((n >> s) & 255) * (1 - k / 100));
	return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
};
const shade = (pal, k) => Object.fromEntries(Object.entries(pal).map(([c, v]) => [c, darken(v, k)]));

/** Side-view, blocky "Steve"-style character with a walk cycle. Facing right. */
export const Steve = ({x, y, u = 12, phase = 0, walking = true, glow, opacity = 1}) => {
	const swing = walking ? Math.sin(phase) * 32 : 0;
	const dark = shade(STEVE_PAL, 28);
	const limb = (rows, pal, ang, ox, oy) => (
		<g transform={`translate(${ox} ${oy}) rotate(${ang} ${2 * u} 0)`}>{px(rows, pal, u)}</g>
	);
	return (
		<g opacity={opacity} transform={`translate(${x - 4 * u} ${y - 32 * u})`} style={glow ? {filter: `drop-shadow(0 0 22px ${glow})`} : undefined}>
			{limb(STEVE_ROWS.arm, dark, -swing, 2 * u, 8 * u)}
			{limb(STEVE_ROWS.leg, dark, swing, 2 * u, 20 * u)}
			<g transform={`translate(${2 * u} ${8 * u})`}>{px(STEVE_ROWS.torso, STEVE_PAL, u)}</g>
			{limb(STEVE_ROWS.leg, STEVE_PAL, -swing, 2 * u, 20 * u)}
			<g transform={`translate(0 ${walking ? Math.abs(Math.sin(phase)) * -u * 0.6 : 0})`}>{px(STEVE_ROWS.head, STEVE_PAL, u)}</g>
			{limb(STEVE_ROWS.arm, STEVE_PAL, swing, 2 * u, 8 * u)}
		</g>
	);
};

const heightAt = (col, seed) => {
	const n = Math.sin(col * 0.45 + seed) * 1.2 + Math.sin(col * 0.17 + seed * 2) * 1.4;
	return Math.max(0, Math.round(n + 1));
};

/** Swirling portal interior. */
const PortalFill = ({x, y, w, h, frame, id}) => (
	<g>
		<defs>
			<linearGradient id={`${id}-pg`} x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="#c07bff" />
				<stop offset="1" stopColor="#5b1fd1" />
			</linearGradient>
		</defs>
		<rect x={x} y={y} width={w} height={h} fill={`url(#${id}-pg)`} />
		{new Array(40).fill(0).map((_, i) => {
			const r = (k) => random(`pf${i}${k}`);
			const yy = y + ((r('y') * h + frame * (2 + r('s') * 4)) % h);
			const xx = x + r('x') * (w - 12) + Math.sin(frame / 6 + i) * 8;
			return <rect key={i} x={xx} y={yy} width={12} height={12} fill={r('c') > 0.5 ? '#e7c6ff' : '#3a0d8f'} opacity={0.75} />;
		})}
	</g>
);

/**
 * Side-scrolling block landscape. `scroll` is the camera x in world px.
 * `portalCol` places an obsidian portal on the ground at that column.
 */
export const BlockWorld = ({scroll = 0, id = 'bw', seed = 1, portalCol, sky = 'dusk', steve, cols = 14, flat = [0, -1]}) => {
	const frame = useCurrentFrame();
	const startCol = Math.floor(scroll / B) - 1;
	const columns = new Array(cols + 3).fill(0).map((_, i) => startCol + i);
	const skyBg =
		sky === 'dusk'
			? 'linear-gradient(180deg, #020806 0%, #06231a 45%, #0f4a35 75%, #1d6b49 100%)'
			: 'linear-gradient(180deg, #f6fbf8 0%, #e3f4ea 55%, #c6e9d3 100%)';
	const day = sky !== 'dusk';
	return (
		<AbsoluteFill style={{background: skyBg, overflow: 'hidden'}}>
			{/* stars */}
			<svg width={1080} height={1920} style={{position: 'absolute'}}>
				{(day ? [] : new Array(70).fill(0)).map((_, i) => (
					<rect
						key={i}
						x={(random(`s${seed}${i}`) * 1400 - scroll * 0.05) % 1080}
						y={random(`sy${seed}${i}`) * 900}
						width={6}
						height={6}
						fill="#dfffee"
						opacity={0.25 + 0.5 * Math.abs(Math.sin(frame / 10 + i))}
					/>
				))}
				{/* square moon */}
				<rect x={760 - scroll * 0.04} y={300} width={140} height={140} fill={day ? '#fff6c9' : '#e9fff4'} opacity={0.95} />
				{/* blocky clouds */}
				{new Array(6).fill(0).map((_, i) => {
					const cx = ((random(`cx${seed}${i}`) * 2000 - scroll * 0.25 - frame * 0.6) % 1800) + (i % 2 ? 200 : -200);
					const cy = 480 + random(`cy${seed}${i}`) * 300;
					return (
						<g key={i} opacity={day ? 0.95 : 0.18}>
							<rect x={cx} y={cy} width={260} height={48} fill="#ffffff" />
							<rect x={cx + 48} y={cy - 36} width={150} height={40} fill="#ffffff" />
						</g>
					);
				})}
			</svg>
			{/* distant hills parallax */}
			<svg width={1080} height={1920} style={{position: 'absolute'}}>
				{new Array(30).fill(0).map((_, i) => {
					const col = i + Math.floor((scroll * 0.4) / 72) - 2;
					const h = 3 + Math.round(Math.sin(col * 0.6 + seed) * 2 + Math.sin(col * 0.23) * 2);
					return <rect key={i} x={col * 72 - scroll * 0.4} y={GROUND - 120 - h * 72} width={73} height={h * 72 + 200} fill={day ? '#a9d9bb' : '#0b2e22'} opacity={day ? 0.7 : 0.85} />;
				})}
			</svg>
			<svg width={1080} height={1920} style={{position: 'absolute'}}>
				<Textures id={id} />
				<g transform={`translate(${-scroll} 0)`}>
					{columns.map((col) => {
						const isFlat = (portalCol !== undefined && Math.abs(col - portalCol - 1.5) < 4) || (col >= flat[0] && col <= flat[1]);
						const h = isFlat ? 1 : heightAt(col, seed);
						const top = GROUND - h * B;
						const blocks = [];
						for (let r = 0; r * B + top < 1920; r++) {
							const kind = r === 0 ? 'grass' : r < 3 ? 'dirt' : 'stone';
							blocks.push(<rect key={r} x={col * B} y={top + r * B} width={B + 0.5} height={B + 0.5} fill={`url(#${id}-${kind})`} />);
						}
						const tree = random(`tree${seed}${col}`) < 0.16 && !isFlat && (portalCol === undefined || Math.abs(col - portalCol) > 4);
						return (
							<g key={col}>
								{blocks}
								{tree ? (
									<g>
										{[1, 2, 3, 4].map((k) => (
											<rect key={k} x={col * B} y={top - k * B} width={B + 0.5} height={B + 0.5} fill={`url(#${id}-log)`} />
										))}
										{[-2, -1, 0, 1, 2].flatMap((dx) =>
											[4, 5, 6].map((dy) =>
												Math.abs(dx) === 2 && dy === 6 ? null : (
													<rect key={`${dx}${dy}`} x={(col + dx) * B} y={top - dy * B - B * 0.5} width={B + 0.5} height={B + 0.5} fill={`url(#${id}-leaf)`} />
												),
											),
										)}
									</g>
								) : null}
							</g>
						);
					})}
					{portalCol !== undefined ? (
						<g>
							{[0, 1, 2, 3].map((dx) =>
								[0, 1, 2, 3, 4].map((dy) => {
									const edge = dx === 0 || dx === 3 || dy === 0 || dy === 4;
									return edge ? (
										<rect key={`${dx}${dy}`} x={(portalCol + dx) * B} y={GROUND - B - (dy + 1) * B} width={B + 0.5} height={B + 0.5} fill={`url(#${id}-obsidian)`} />
									) : null;
								}),
							)}
							<PortalFill x={(portalCol + 1) * B} y={GROUND - B - 4 * B} w={2 * B} h={3 * B} frame={frame} id={id} />
							<rect
								x={(portalCol + 1) * B}
								y={GROUND - B - 4 * B}
								width={2 * B}
								height={3 * B}
								fill="none"
								stroke="#c58bff"
								strokeWidth={3}
							/>
						</g>
					) : null}
					{steve ? <Steve {...steve} /> : null}
				</g>
			</svg>
		</AbsoluteFill>
	);
};

export const WORLD = {B, GROUND, heightAt};
