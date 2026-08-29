import React from 'react';

/* ── Isometric drawing kit ──
 *
 * The shared machinery behind every built illustration in the app. `iso()`
 * maps a 3D world point to the screen, `Box` extrudes a solid and shades its
 * three visible faces from a single accent, and the face transforms let flat
 * 2D detail be drawn *onto* a face so it sits in the same space as the solid
 * rather than floating over it.
 *
 * World axes: x runs right-and-back, y left-and-back, z up. The camera sits
 * above the +x/+y corner, so the top, +x and +y faces of any solid are the
 * three that can be seen.
 */

const COS30 = Math.cos(Math.PI / 6);

/** World → screen. */
export const iso = (x: number, y: number, z: number): [number, number] => [
  (x - y) * COS30,
  (x + y) * 0.5 - z,
];

/** Polygon `points` attribute for a list of world coordinates. */
export const pts = (points: Array<[number, number, number]>) =>
  points.map(([x, y, z]) => iso(x, y, z).join(',')).join(' ');

/* Face transforms. `u` runs along the face's horizontal and `v` downward, so a
   rect at (0,0) lands on the face's top-left corner exactly as it would in an
   ordinary 2D sketch. */
export const faceTop = (x: number, y: number, z: number) =>
  `matrix(${COS30},0.5,${-COS30},0.5,${iso(x, y, z)[0]},${iso(x, y, z)[1]})`;
/** The +y face — reads as the left/front wall. */
export const faceLeft = (x: number, y: number, zTop: number) =>
  `matrix(${COS30},0.5,0,1,${iso(x, y, zTop)[0]},${iso(x, y, zTop)[1]})`;
/** The +x face — reads as the right wall. */
export const faceRight = (x: number, y: number, zTop: number) =>
  `matrix(${-COS30},0.5,0,1,${iso(x, y, zTop)[0]},${iso(x, y, zTop)[1]})`;

/* ── colour ───────────────────────────────────────────────────────────── */

const parse = (hex: string) => {
  const s = hex.replace('#', '');
  const v = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
};

/** Mix `hex` toward `target` by t (0..1). */
export const mix = (hex: string, target: string, t: number) => {
  const [r1, g1, b1] = parse(hex);
  const [r2, g2, b2] = parse(target);
  const m = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`;
};

export const WHITE = '#ffffff';
export const SHADE = '#0a1020';

/** Top / left / right face fills for a solid of the given accent. */
export const shades = (accent: string, lift = 0) => ({
  top: mix(accent, WHITE, 0.3 + lift),
  left: mix(accent, SHADE, 0.34 - lift),
  right: mix(accent, SHADE, 0.6 - lift),
  line: mix(accent, WHITE, 0.55),
});

/* ── primitives ───────────────────────────────────────────────────────── */

export interface BoxProps {
  x: number; y: number; z: number;
  w: number; d: number; h: number;
  accent: string;
  /** Brightens all three faces — used to pop one solid out of a stack. */
  lift?: number;
  opacity?: number;
  /** Hairline along the top edges; off for very small solids. */
  edges?: boolean;
}

export const Box: React.FC<BoxProps> = ({
  x, y, z, w, d, h, accent, lift = 0, opacity = 1, edges = true,
}) => {
  const c = shades(accent, lift);
  const t = z + h;
  return (
    <g opacity={opacity}>
      <polygon points={pts([[x, y, t], [x + w, y, t], [x + w, y + d, t], [x, y + d, t]])} fill={c.top} />
      <polygon points={pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, t], [x, y + d, t]])} fill={c.left} />
      <polygon points={pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, t], [x + w, y, t]])} fill={c.right} />
      {edges && (
        <g stroke={c.line} strokeWidth="0.9" strokeLinecap="round" opacity="0.5" fill="none">
          <polyline points={pts([[x, y, t], [x + w, y, t], [x + w, y + d, t], [x, y + d, t], [x, y, t]])} />
          <line
            x1={iso(x + w, y + d, t)[0]} y1={iso(x + w, y + d, t)[1]}
            x2={iso(x + w, y + d, z)[0]} y2={iso(x + w, y + d, z)[1]}
          />
        </g>
      )}
    </g>
  );
};

/** Soft contact shadow on the ground plane. */
export const Shadow: React.FC<{ x: number; y: number; rx: number; ry: number; blur: string }> = ({
  x, y, rx, ry, blur,
}) => {
  const [cx, cy] = iso(x, y, 0);
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#000" opacity="0.42" filter={`url(#${blur})`} />;
};

/* ── round solids ──
 * A circle of radius r on a ground plane projects to an axis-aligned ellipse:
 * parametrising x=r·cos t, y=r·sin t gives screen offsets
 *   sx = 0.866·r·(cos t − sin t)   amplitude r·√2·0.866 = 1.2247r
 *   sy = 0.5·r·(cos t + sin t)     amplitude r·√2·0.5   = 0.7071r
 * and the two are 90° out of phase, so no rotation is needed.
 */
export const ELLIPSE_RX = Math.SQRT2 * COS30;
export const ELLIPSE_RY = Math.SQRT2 * 0.5;

/** Screen point on the rim of a circle of radius r, at world angle t (radians). */
export const rimPoint = (
  cx: number, cy: number, z: number, r: number, t: number,
): [number, number] => {
  const [ox, oy] = iso(cx + r * Math.cos(t), cy + r * Math.sin(t), z);
  return [ox, oy];
};

/** True when the rim point at angle t faces the camera (front half of the ellipse). */
export const facesViewer = (t: number) => Math.cos(t) + Math.sin(t) > 0;

interface CylinderProps {
  /** Centre of the circular footprint, in world coordinates. */
  cx: number; cy: number; z: number;
  r: number; h: number;
  accent: string;
  lift?: number;
  /** Fill for the curved side; defaults to a flat mid-shade. */
  bodyFill?: string;
}

/** An upright cylinder: curved side, then the top cap over it. */
export const Cylinder: React.FC<CylinderProps> = ({
  cx, cy, z, r, h, accent, lift = 0, bodyFill,
}) => {
  const c = shades(accent, lift);
  const rx = r * ELLIPSE_RX;
  const ry = r * ELLIPSE_RY;
  const [bx, by] = iso(cx, cy, z);
  const [tx, ty] = iso(cx, cy, z + h);
  return (
    <g>
      {/* Built from three whole shapes rather than one arc-flagged outline: the
          base ellipse, the wall over its back half, then the cap. Same
          silhouette, and no sweep flag to get backwards. */}
      <ellipse cx={bx} cy={by} rx={rx} ry={ry} fill={bodyFill ?? c.left} />
      <rect x={tx - rx} y={ty} width={rx * 2} height={by - ty} fill={bodyFill ?? c.left} />
      <ellipse cx={tx} cy={ty} rx={rx} ry={ry} fill={c.top} />
      <ellipse cx={tx} cy={ty} rx={rx} ry={ry} fill="none" stroke={c.line} strokeWidth="0.9" opacity="0.5" />
    </g>
  );
};
