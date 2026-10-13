import {AbsoluteFill, Sequence} from 'remotion';
import {SoundTrack} from './audio/SoundTrack';
import {Captions} from './components/Captions';
import {Grain, LightStreak, Particles} from './components/FX';
import {SceneWrap} from './components/SceneWrap';
import {Scene01Hook} from './scenes/Scene01Hook';
import {Scene02WorldsColliding} from './scenes/Scene02WorldsColliding';
import {Scene03OneWorld} from './scenes/Scene03OneWorld';
import {Scene04MetaMoment} from './scenes/Scene04MetaMoment';
import {Scene05CodeBecomesCreation} from './scenes/Scene05CodeBecomesCreation';
import {Scene06ViewerIsPartOfIt} from './scenes/Scene06ViewerIsPartOfIt';
import {Scene07BeyondGaming} from './scenes/Scene07BeyondGaming';
import {Scene08FutureIsHere} from './scenes/Scene08FutureIsHere';
import {Scene09ClaudeBrand} from './scenes/Scene09ClaudeBrand';
import {Scene10FinalImpact} from './scenes/Scene10FinalImpact';
import {C} from './theme';
import timeline from './timeline.json';

const SCENES = {
	Scene01Hook,
	Scene02WorldsColliding,
	Scene03OneWorld,
	Scene04MetaMoment,
	Scene05CodeBecomesCreation,
	Scene06ViewerIsPartOfIt,
	Scene07BeyondGaming,
	Scene08FutureIsHere,
	Scene09ClaudeBrand,
	Scene10FinalImpact,
};

export const Video = () => (
	<AbsoluteFill style={{background: C.paper}}>
		{timeline.scenes.map(({id, from, duration}, i) => {
			const Scene = SCENES[id];
			return (
				<Sequence key={id} name={id} from={from} durationInFrames={duration}>
					<SceneWrap duration={duration} index={i}>
						<Scene />
					</SceneWrap>
				</Sequence>
			);
		})}
		<Particles count={34} seed="ambient" speed={0.8} opacity={0.35} size={2.5} />
		{timeline.scenes.slice(1).map(({from}, i) => (
			<LightStreak key={from} at={from - 6} duration={12} y={[520, 1380, 760, 1180][i % 4]} length={900} thickness={3} reverse={i % 2 === 1} />
		))}
		<Captions />
		<Grain opacity={0.035} />
		<SoundTrack />
	</AbsoluteFill>
);
