import React, { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import { COLORS } from "../config";

type Node = { x: number; y: number; r: number; d: number; ph: number };
type Edge = { a: number; b: number; order: number };

export const buildNetwork = (seed: string, count: number, w: number, h: number, links = 2) => {
  const nodes: Node[] = [];
  // Jittered grid gives an even, intelligent-looking distribution.
  const cols = Math.ceil(Math.sqrt((count * w) / h));
  const rows = Math.ceil(count / cols);
  for (let i = 0; i < count; i++) {
    const cx = (i % cols) + 0.5;
    const cy = Math.floor(i / cols) + 0.5;
    const x = (cx / cols - 0.5) * w + (random(`${seed}x${i}`) - 0.5) * (w / cols) * 0.9;
    const y = (cy / rows - 0.5) * h + (random(`${seed}y${i}`) - 0.5) * (h / rows) * 0.9;
    nodes.push({ x, y, r: 1.6 + random(`${seed}r${i}`) * 2.6, d: Math.hypot(x / w, y / h), ph: random(`${seed}p${i}`) * 6.28 });
  }
  const edges: Edge[] = [];
  const seen = new Set<string>();
  nodes.forEach((n, i) => {
    const near = nodes
      .map((m, j) => ({ j, dist: Math.hypot(m.x - n.x, m.y - n.y) }))
      .filter((o) => o.j !== i)
      .sort((p, q) => p.dist - q.dist)
      .slice(0, links + (random(`${seed}l${i}`) > 0.7 ? 1 : 0));
    near.forEach(({ j }) => {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) return;
      seen.add(key);
      edges.push({ a: i, b: j, order: Math.min(n.d, nodes[j].d) * 1.4 + random(`${seed}o${key}`) * 0.15 });
    });
  });
  const maxOrder = Math.max(...edges.map((e) => e.order));
  edges.forEach((e) => (e.order /= maxOrder));
  return { nodes, edges };
};

/**
 * Abstract intelligence network. `activation` (0–1) grows connections from the
 * center outward; data packets travel along active links.
 */
export const Network: React.FC<{
  seed?: string;
  count?: number;
  width?: number;
  height?: number;
  activation: number;
  pulse?: number;
  color?: string;
  packets?: boolean;
  nodeOpacity?: number;
  lineOpacity?: number;
  style?: React.CSSProperties;
}> = ({
  seed = "world",
  count = 110,
  width = 2400,
  height = 1400,
  activation,
  pulse = 0,
  color = COLORS.cyan,
  packets = true,
  nodeOpacity = 1,
  lineOpacity = 1,
  style,
}) => {
  const frame = useCurrentFrame();
  const { nodes, edges } = useMemo(() => buildNetwork(seed, count, width, height), [seed, count, width, height]);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
      style={{ position: "absolute", left: `calc(50% - ${width / 2}px)`, top: `calc(50% - ${height / 2}px)`, overflow: "visible", ...style }}
    >
      {edges.map((e, i) => {
        const p = Math.max(0, Math.min(1, (activation - e.order * 0.92) / 0.08));
        if (p <= 0) return null;
        const A = nodes[e.a];
        const B = nodes[e.b];
        const x2 = A.x + (B.x - A.x) * p;
        const y2 = A.y + (B.y - A.y) * p;
        const o = (0.22 + 0.25 * pulse + 0.1 * Math.sin(frame / 20 + i)) * lineOpacity;
        return <line key={i} x1={A.x} y1={A.y} x2={x2} y2={y2} stroke={color} strokeWidth={1} opacity={o} />;
      })}
      {packets &&
        edges.map((e, i) => {
          if (i % 3 !== 0) return null;
          const p = (activation - e.order * 0.92) / 0.08;
          if (p < 1) return null;
          const A = nodes[e.a];
          const B = nodes[e.b];
          const t = ((frame * (0.012 + (i % 5) * 0.004) + i * 0.137) % 1 + 1) % 1;
          const fwd = i % 2 === 0 ? t : 1 - t;
          return (
            <circle
              key={`p${i}`}
              cx={A.x + (B.x - A.x) * fwd}
              cy={A.y + (B.y - A.y) * fwd}
              r={1.8}
              fill={COLORS.white}
              opacity={0.75 * lineOpacity * Math.sin(t * Math.PI)}
            />
          );
        })}
      {nodes.map((n, i) => {
        const lit = Math.max(0, Math.min(1, (activation - n.d * 0.9 * 0.92) / 0.1));
        const tw = 0.6 + 0.4 * Math.sin(frame / 16 + n.ph);
        const o = (0.18 + 0.7 * lit * tw + 0.3 * pulse) * nodeOpacity;
        return (
          <g key={`n${i}`}>
            {lit > 0.5 && <circle cx={n.x} cy={n.y} r={n.r * (3 + 2 * pulse)} fill={color} opacity={0.08 * lit * nodeOpacity} />}
            <circle cx={n.x} cy={n.y} r={n.r * (1 + 0.4 * pulse)} fill={lit > 0.3 ? color : COLORS.textDim} opacity={Math.min(1, o)} />
          </g>
        );
      })}
    </svg>
  );
};
