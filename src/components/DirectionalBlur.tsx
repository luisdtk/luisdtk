import React from "react";

/** Directional (x/y) motion blur via an SVG filter. Renders children untouched when still. */
export const DirectionalBlur: React.FC<{ id: string; x?: number; y?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  id,
  x = 0,
  y = 0,
  children,
  style,
}) => {
  const active = x > 0.15 || y > 0.15;
  return (
    <div style={{ position: "absolute", inset: 0, filter: active ? `url(#${id})` : undefined, ...style }}>
      {active && (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation={`${x.toFixed(2)} ${y.toFixed(2)}`} />
          </filter>
        </svg>
      )}
      {children}
    </div>
  );
};
