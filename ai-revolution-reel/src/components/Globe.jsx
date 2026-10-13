import {random} from 'remotion';
import {C} from '../theme';

const project = (lat, lon, rot, tilt, R) => {
	const l = lon + rot;
	const x = Math.cos(lat) * Math.sin(l);
	const y = Math.sin(lat);
	const z = Math.cos(lat) * Math.cos(l);
	const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
	const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
	return [x * R, -y2 * R, z2];
};

const pathFrom = (pts, front) => {
	let d = '';
	let pen = false;
	for (const [x, y, z] of pts) {
		const vis = front ? z >= 0 : z < 0;
		if (vis) {
			d += `${pen ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)} `;
			pen = true;
		} else {
			pen = false;
		}
	}
	return d;
};

const slerp = (a, b, t) => {
	const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	const om = Math.acos(Math.min(1, Math.max(-1, dot)));
	if (om < 1e-4) return a;
	const s = Math.sin(om);
	return a.map((_, i) => (Math.sin((1 - t) * om) / s) * a[i] + (Math.sin(t * om) / s) * b[i]);
};



const toVec = (lat, lon) => [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];

const NODES = new Array(46).fill(0).map((_, i) => ({
	lat: (random(`lat${i}`) - 0.5) * Math.PI * 0.85,
	lon: random(`lon${i}`) * Math.PI * 2,
}));
const dist = (a, b) => {
	const va = toVec(NODES[a].lat, NODES[a].lon);
	const vb = toVec(NODES[b].lat, NODES[b].lon);
	return Math.acos(Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
};
// Each link joins a node to one of its three nearest neighbours.
const LINKS = new Array(70).fill(0).map((_, i) => {
	const a = i % NODES.length;
	const near = NODES.map((_, j) => j)
		.filter((j) => j !== a)
		.sort((x, y) => dist(a, x) - dist(a, y));
	return [a, near[Math.floor(random(`lb${i}`) * 3)]];
});

/**
 * Wireframe globe with a spreading network of arcs.
 * `grow` (0..1) controls how much of the network is drawn.
 */
export const Globe = ({cx = 540, cy = 860, R = 360, rot = 0, tilt = 0.35, grow = 1, opacity = 1}) => {
	const merid = [];
	for (let m = 0; m < 12; m++) {
		const lon = (m / 12) * Math.PI * 2;
		const pts = [];
		for (let k = 0; k <= 48; k++) pts.push(project(-Math.PI / 2 + (k / 48) * Math.PI, lon, rot, tilt, R));
		merid.push(pts);
	}
	for (let p = 1; p < 8; p++) {
		const lat = -Math.PI / 2 + (p / 8) * Math.PI;
		const pts = [];
		for (let k = 0; k <= 72; k++) pts.push(project(lat, (k / 72) * Math.PI * 2, rot, tilt, R));
		merid.push(pts);
	}
	const front = merid.map((pts) => pathFrom(pts, true)).join(' ');
	const back = merid.map((pts) => pathFrom(pts, false)).join(' ');

	const linkCount = Math.floor(grow * LINKS.length);
	const arcs = LINKS.slice(0, linkCount).map(([a, b], i) => {
		const va = toVec(NODES[a].lat, NODES[a].lon);
		const vb = toVec(NODES[b].lat, NODES[b].lon);
		const local = Math.min(1, grow * LINKS.length - i);
		const pts = [];
		for (let k = 0; k <= 24 * local; k++) {
			const t = k / 24;
			const v = slerp(va, vb, t);
			const lift = 1 + Math.sin(Math.PI * t) * 0.06;
			const lat = Math.asin(v[1]);
			const lon = Math.atan2(v[0], v[2]);
			const [x, y, z] = project(lat, lon, rot, tilt, R * lift);
			pts.push([x, y, z + 0.15]);
		}
		return pathFrom(pts, true);
	});

	return (
		<g transform={`translate(${cx} ${cy})`} opacity={opacity}>
			<circle r={R} fill="#ffffff" />
			<path d={back} stroke={C.faint} strokeWidth={1} fill="none" opacity={0.35} />
			<path d={front} stroke={C.ink} strokeWidth={1.1} fill="none" opacity={0.22} />
			<circle r={R} fill="none" stroke={C.ink} strokeWidth={1.4} opacity={0.5} />
			{arcs.map((d, i) => (
				<path key={i} d={d} stroke={C.green} strokeWidth={i % 4 === 0 ? 2.4 : 1.6} fill="none" opacity={0.85} />
			))}
			{NODES.map((n, i) => {
				const [x, y, z] = project(n.lat, n.lon, rot, tilt, R);
				if (z < 0 || i / NODES.length > grow * 1.2) return null;
				return <circle key={i} cx={x} cy={y} r={3 + z * 3} fill={i % 3 === 0 ? C.green : C.ink} />;
			})}
		</g>
	);
};
