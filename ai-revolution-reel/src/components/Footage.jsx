import {AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {shadow} from '../theme';

// Gameplay sources, with their hotbars cropped off.
export const SOURCES = {
	city: {src: staticFile('video/footage.mp4'), w: 1280, h: 632},
	tnt: {src: staticFile('video/gameplay2.mp4'), w: 568, h: 436},
};

/** Raw footage scaled to cover a box, with a slow push and pan. */
const Plate = ({source = 'city', start, rate = 1, height, width = 1080, zoomFrom = 1, zoomTo = 1.12, panFrom = 0, panTo = 0, duration}) => {
	const frame = useCurrentFrame();
	const t = duration ? frame / duration : 0;
	const {src, w: SRC_W, h: SRC_H} = SOURCES[source];
	const base = Math.max(height / SRC_H, width / SRC_W);
	const z = interpolate(t, [0, 1], [zoomFrom, zoomTo]);
	const pan = interpolate(t, [0, 1], [panFrom, panTo]);
	const w = SRC_W * base * z;
	const h = SRC_H * base * z;
	return (
		<div style={{position: 'absolute', left: (width - w) / 2 + pan, top: (height - h) / 2, width: w, height: h}}>
			<OffthreadVideo src={src} trimBefore={Math.round(start * 30)} playbackRate={rate} muted style={{width: '100%', height: '100%', filter: 'contrast(1.06) saturate(1.05)'}} />
		</div>
	);
};

/** Footage inside a rounded card on the paper background. */
export const FootageClip = ({from = 0, duration, start, rate = 1, x = 40, top = 560, width = 1000, height = 820, radius = 28, zoomFrom = 1.0, zoomTo = 1.12, panFrom = 0, panTo = 0}) => (
	<Sequence from={from} durationInFrames={duration} layout="none">
		<div style={{position: 'absolute', left: x, top, width, height, borderRadius: radius, overflow: 'hidden', boxShadow: shadow}}>
			<Plate start={start} rate={rate} width={width} height={height} duration={duration} zoomFrom={zoomFrom} zoomTo={zoomTo} panFrom={panFrom} panTo={panTo} />
		</div>
	</Sequence>
);

/** Full-bleed footage. */
export const FootageFull = ({from = 0, duration, start, rate = 1, zoomFrom = 1, zoomTo = 1.1, panFrom = 0, panTo = 0}) => (
	<Sequence from={from} durationInFrames={duration} layout="none">
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<Plate start={start} rate={rate} height={1920} duration={duration} zoomFrom={zoomFrom} zoomTo={zoomTo} panFrom={panFrom} panTo={panTo} />
		</AbsoluteFill>
	</Sequence>
);

/** Footage at an arbitrary box size (thumbnails, previews, tiles). */
export const FootageBox = ({source, start, width, height, rate = 1, zoom = 1, duration = 300}) => (
	<div style={{position: 'relative', width, height, overflow: 'hidden'}}>
		<Plate source={source} start={start} rate={rate} height={height} width={width} duration={duration} zoomFrom={zoom} zoomTo={zoom * 1.06} />
	</div>
);
