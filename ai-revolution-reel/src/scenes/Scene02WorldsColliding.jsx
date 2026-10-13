import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {BlockWorld, WORLD} from '../components/BlockWorld';
import {FootageClip} from '../components/Footage';
import {Flash, Glitch, Label, PaperGrid} from '../components/FX';
import {KineticText} from '../components/KineticText';
import {C, FONT, easeIn, easeInOut, easeOut} from '../theme';

const {B, GROUND} = WORLD;
const PORTAL_COL = 14;
const PORTAL_CX = (PORTAL_COL + 2) * B;
const PORTAL_CY = GROUND - B - 2.5 * B;
const COLLIDE = 76; // frame where the worlds collide

const SteveWorld = ({frame}) => {
	const scroll = interpolate(frame, [0, 64], [0, PORTAL_CX - 540], {extrapolateRight: 'clamp', easing: easeInOut});
	const steveX = interpolate(frame, [0, 64], [330, PORTAL_CX], {extrapolateRight: 'clamp', easing: easeInOut});
	const zoom = interpolate(frame, [44, COLLIDE], [1, 7], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeIn});
	const intro = interpolate(frame, [0, 10], [1.2, 1], {extrapolateRight: 'clamp', easing: easeOut});
	return (
		<AbsoluteFill style={{transform: `scale(${zoom * intro})`, transformOrigin: `540px ${PORTAL_CY}px`}}>
			<BlockWorld
				scroll={scroll}
				portalCol={PORTAL_COL}
				flat={[-3, 20]}
				seed={3}
				id="s2"
				steve={{x: steveX, y: GROUND - B, u: 11, phase: frame * 0.42, walking: frame < 64, opacity: interpolate(frame, [54, 66], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}
			/>
		</AbsoluteFill>
	);
};

const CARD = {x: 40, top: 640, width: 1000, height: 780};

// 4.4–13.1 s · Steve walks into a portal and lands in the uploaded city footage
export const Scene02WorldsColliding = () => {
	const frame = useCurrentFrame();

	// jagged seam that sweeps the block world away after the collision
	const seam = interpolate(frame, [COLLIDE, COLLIDE + 14], [1080, -120], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});
	const teeth = new Array(17)
		.fill(0)
		.map((_, i) => `${seam + (i % 2 ? 50 : -25) + (random(`t${i}${Math.floor(frame / 2)}`) - 0.5) * 30}px ${(i / 16) * 1920}px`)
		.join(', ');
	const ui = interpolate(frame, [COLLIDE + 4, COLLIDE + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});
	const labelIn = interpolate(frame, [4, 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const cardScale = interpolate(frame, [COLLIDE, COLLIDE + 18], [1.9, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut});

	return (
		<AbsoluteFill style={{background: C.paper}}>
			<PaperGrid opacity={ui} />
			<Label x={70} y={250} opacity={ui}>
				Minecraft × GTA V
			</Label>

			<Glitch windows={[[137, 140], [187, 190]]} amount={40} seed="s2">
				<AbsoluteFill style={{transform: `scale(${cardScale})`, transformOrigin: `540px ${CARD.top + CARD.height / 2}px`}}>
					<FootageClip from={COLLIDE} duration={140 - COLLIDE} start={0.3} zoomFrom={1.35} zoomTo={1.05} {...CARD} />
					<FootageClip from={140} duration={50} start={9.5} zoomFrom={1.1} zoomTo={1.25} panFrom={-30} panTo={30} {...CARD} />
					<FootageClip from={190} duration={71} start={38.8} zoomFrom={1.05} zoomTo={1.18} {...CARD} />
				</AbsoluteFill>
			</Glitch>

			{frame < COLLIDE + 16 ? (
				<AbsoluteFill style={{clipPath: frame < COLLIDE ? 'none' : `polygon(0 0, ${teeth}, 0 1920px)`}}>
					<SteveWorld frame={frame} />
					{frame < COLLIDE - 10 ? (
						<div
							style={{
								position: 'absolute',
								top: 240,
								left: 70,
								padding: '14px 24px',
								borderRadius: 40,
								background: 'rgba(14,16,14,0.88)',
								fontFamily: FONT.body,
								fontSize: 26,
								color: C.ink,
								opacity: labelIn,
							}}
						>
							World 01 · <span style={{color: C.green}}>Block engine</span>
						</div>
					) : null}
				</AbsoluteFill>
			) : null}
			{frame >= COLLIDE && frame < COLLIDE + 16 ? (
				<div style={{position: 'absolute', top: 0, bottom: 0, left: seam - 3, width: 6, background: C.green}} />
			) : null}

			<KineticText text="Games are no longer separate." start={90} end={178} y={380} size={92} highlight={['separate.']} seed={21} />
			<KineticText text="What if worlds could merge?" start={186} end={258} y={380} size={96} highlight={['merge?']} mode="type" seed={22} />

			<Flash at={COLLIDE} duration={10} color={C.green} peak={0.5} />
		</AbsoluteFill>
	);
};
