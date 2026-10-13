import {Easing} from 'remotion';
import '@fontsource/newsreader/300.css';
import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/400-italic.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css';

// Clean, light identity: off-white paper, near-black ink, green accent.
export const C = {
	paper: '#f8f7f5',
	white: '#ffffff',
	ink: '#1b1b1a',
	muted: '#6f6d69',
	faint: '#a9a6a1',
	line: '#e4e1dc',
	green: '#16a34a',
	greenSoft: '#e7f6ec',
	greenMid: '#4ade80',
	dark: '#0e0f0e',
};

export const FONT = {
	display: '"Newsreader", "Georgia", serif',
	body: '"Inter", sans-serif',
	mono: '"JetBrains Mono", monospace',
};

export const shadow = '0 1px 2px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.08)';

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);

// Instagram UI covers roughly the top 220px and bottom 380px, plus a 140px right rail.
export const SAFE = {top: 230, bottom: 1540, left: 70, right: 960};
