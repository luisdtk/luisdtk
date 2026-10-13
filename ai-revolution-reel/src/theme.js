import {Easing} from 'remotion';
import '@fontsource/newsreader/300.css';
import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/400-italic.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css';

// Dark editorial identity: near-black background, light ink, green accent.
// `paper` is the page background and `white` the raised card surface.
export const C = {
	paper: '#090a09',
	white: '#131513',
	raised: '#1b1e1b',
	ink: '#f3f3ef',
	muted: '#9b9b95',
	faint: '#5f625d',
	line: '#262a26',
	green: '#22c55e',
	greenSoft: '#0f2b1a',
	greenMid: '#4ade80',
	pure: '#ffffff',
};

export const FONT = {
	display: '"Newsreader", "Georgia", serif',
	body: '"Inter", sans-serif',
	mono: '"JetBrains Mono", monospace',
};

export const shadow = '0 0 0 1px #242824, 0 20px 60px rgba(0,0,0,0.6), 0 0 80px rgba(34,197,94,0.06)';

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);

// Instagram UI covers roughly the top 220px and bottom 380px, plus a 140px right rail.
export const SAFE = {top: 230, bottom: 1540, left: 70, right: 960};
