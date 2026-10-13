import {Composition} from 'remotion';
import {Video} from './Video';
import timeline from './timeline.json';

export const Root = () => {
	return (
		<Composition
			id="AIRevolution"
			component={Video}
			durationInFrames={timeline.durationInFrames}
			fps={timeline.fps}
			width={timeline.width}
			height={timeline.height}
		/>
	);
};
