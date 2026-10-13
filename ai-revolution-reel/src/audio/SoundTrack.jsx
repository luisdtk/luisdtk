import {Fragment} from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import timeline from '../timeline.json';

const fps = timeline.fps;
const s = (name) => staticFile(`audio/${name}.wav`);

// [absolute frame, sound, volume] — each cue sits on the frame of its visual event.
export const CUES = [
	// 01 hook
	[0, 'user/boom_a', 0.9],
	[0, 'sfx/impact_big', 0.45],
	[9, 'sfx/glitch', 0.35],
	[12, 'sfx/whoosh_short', 0.4],
	[71, 'sfx/impact', 0.55],
	[71, 'user/low_hit', 0.6],
	[118, 'sfx/whoosh', 0.45],
	// 02 worlds colliding
	[140, 'user/tick_hi', 0.35],
	[178, 'sfx/portal', 0.55],
	[209, 'sfx/glitch_long', 0.4],
	[209, 'user/boom_b', 0.8],
	[223, 'sfx/whoosh_short', 0.35],
	[270, 'sfx/glitch', 0.35],
	[320, 'sfx/glitch', 0.35],
	[319, 'sfx/keys', 0.3],
	// 03 one world
	[394, 'sfx/whoosh', 0.4],
	[400, 'sfx/pulse', 0.45],
	[444, 'sfx/whoosh_short', 0.35],
	[444, 'user/tick_a', 0.4],
	[494, 'sfx/whoosh_short', 0.35],
	[498, 'user/data_burst', 0.35],
	[544, 'sfx/whoosh_short', 0.35],
	[544, 'user/tick_b', 0.4],
	[586, 'user/digital_burst', 0.3],
	[606, 'sfx/whoosh_down', 0.4],
	// 04 meta moment
	[619, 'sfx/click_low', 0.4],
	[630, 'user/typing', 0.3],
	[643, 'sfx/click', 0.25],
	[655, 'sfx/click', 0.25],
	[667, 'sfx/click', 0.25],
	[683, 'sfx/click', 0.25],
	[697, 'user/click_a', 0.45],
	[717, 'user/click_b', 0.45],
	[737, 'user/click_a', 0.45],
	[787, 'user/riser_hit', 0.55],
	[859, 'user/swish_hi', 0.3],
	[864, 'sfx/keys', 0.35],
	[889, 'user/processing', 0.35],
	[899, 'sfx/keys', 0.3],
	[919, 'sfx/impact_big', 0.6],
	[919, 'user/boom_b', 0.7],
	[959, 'sfx/click', 0.4],
	[961, 'sfx/shimmer', 0.35],
	// 05 code becomes creation
	[1002, 'sfx/whoosh_down', 0.35],
	[1006, 'user/typing', 0.3],
	[1040, 'user/tick_a', 0.45],
	[1044, 'sfx/click', 0.25],
	[1050, 'sfx/click', 0.25],
	[1056, 'sfx/click', 0.25],
	[1074, 'user/data_burst', 0.4],
	[1108, 'user/digital_burst', 0.4],
	[1110, 'sfx/whoosh', 0.35],
	[1142, 'sfx/impact', 0.5],
	[1142, 'user/shimmer', 0.4],
	// 06 viewer
	[1188, 'sfx/whoosh_down', 0.4],
	[1224, 'sfx/freeze', 0.5],
	[1232, 'sfx/glitch', 0.3],
	// 07 beyond gaming
	[1266, 'user/whoosh_mid', 0.45],
	[1311, 'sfx/whoosh_short', 0.4],
	[1339, 'sfx/whoosh_short', 0.4],
	[1371, 'sfx/whoosh_short', 0.4],
	[1399, 'user/scatter', 0.4],
	// 08 future
	[1424, 'sfx/whoosh', 0.4],
	[1424, 'sfx/pulse', 0.4],
	// 09 brand
	[1532, 'sfx/impact', 0.4],
	[1534, 'sfx/shimmer', 0.4],
	[1562, 'user/swish_hi', 0.35],
	// 10 final
	[1622, 'sfx/impact_big', 0.55],
	[1622, 'user/low_hit', 0.5],
	[1627, 'user/final_swell', 0.4],
	[1685, 'sfx/impact', 0.6],
	[1685, 'user/boom_a', 0.6],
	[1742, 'sfx/whoosh_down', 0.25],
];

export const SoundTrack = () => (
	<Fragment>
		<Audio src={s('music')} volume={0.9} />
		<Sequence from={Math.round(timeline.voiceOffsetSeconds * fps)} layout="none">
			<Audio src={s('voice')} volume={1} />
		</Sequence>
		{CUES.map(([from, name, volume], i) => (
			<Sequence key={i} from={from} layout="none">
				<Audio src={s(name)} volume={volume} />
			</Sequence>
		))}
	</Fragment>
);
