import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface TimelineSeries {
  _id: string;
  name: string;
  points: Array<{ at: string; score: number }>;
}

/* Eight categorical slots, stepped for a dark surface and validated against the
   panel colour (#121a2a) for lightness band, chroma, CVD and normal-vision
   separation in this order. The order is the colour-blind safety mechanism:
   do not reshuffle it, and never generate a ninth hue. */
const SLOTS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];
export const MAX_TIMELINE_SERIES = SLOTS.length;

/** Colour follows the team, not its rank: a team keeps its slot while it stays on the chart. */
const useStableSlots = (ids: string[]) => {
  const assigned = useRef(new Map<string, number>());
  return useMemo(() => {
    const map = assigned.current;
    for (const id of [...map.keys()]) if (!ids.includes(id)) map.delete(id);
    for (const id of ids) {
      if (map.has(id)) continue;
      const taken = new Set(map.values());
      map.set(id, SLOTS.findIndex((_, slot) => !taken.has(slot)));
    }
    return new Map(map);
  }, [ids.join('|')]);
};

const niceStep = (range: number, target = 4) => {
  const raw = range / target, magnitude = 10 ** Math.floor(Math.log10(raw || 1));
  return [1, 2, 2.5, 5, 10].map(m => m * magnitude).find(step => raw <= step) ?? 10 * magnitude;
};

const scoreAt = (series: TimelineSeries, t: number) => {
  let score = 0;
  for (const point of series.points) {
    if (Date.parse(point.at) > t) break;
    score = point.score;
  }
  return score;
};

const PAD = { top: 12, right: 16, bottom: 28, left: 48 };

const ScoreTimeline: React.FC<{
  series: TimelineSeries[];
  /** Event start; the lines begin at zero here. */
  start?: string | null;
  /** Right edge: the event end once it has passed, otherwise now. */
  end?: string | null;
  height?: number;
}> = ({ series: allSeries, start, end, height = 260 }) => {
  const series = allSeries.slice(0, MAX_TIMELINE_SERIES);
  const slots = useStableSlots(series.map(s => s._id));
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hoverT, setHoverT] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const times = series.flatMap(s => s.points.map(p => Date.parse(p.at)));
  const t0 = Math.min(start ? Date.parse(start) : Infinity, ...times, Date.now());
  const t1 = Math.max(Math.min(end ? Date.parse(end) : Date.now(), Date.now()), ...times, t0 + 60000);
  const scores = series.flatMap(s => s.points.map(p => p.score));
  const step = niceStep(Math.max(1, Math.max(0, ...scores) - Math.min(0, ...scores)));
  const yMax = Math.max(step, Math.ceil(Math.max(0, ...scores) / step) * step);
  const yMin = Math.min(0, Math.floor(Math.min(0, ...scores) / step) * step);

  const plotW = width - PAD.left - PAD.right, plotH = height - PAD.top - PAD.bottom;
  const x = (t: number) => PAD.left + ((t - t0) / (t1 - t0)) * plotW;
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;

  const yTicks: number[] = [];
  for (let v = yMin; v <= yMax + 1e-9; v += step) yTicks.push(v);
  const span = t1 - t0;
  const tickCount = width < 480 ? 3 : 5;
  const xTicks = Array.from({ length: tickCount }, (_, i) => t0 + (span * i) / (tickCount - 1));
  const tickLabel = (t: number) => new Date(t).toLocaleString(undefined, span > 2 * 86400000
    ? { month: 'short', day: 'numeric' }
    : span > 86400000 ? { weekday: 'short', hour: '2-digit', minute: '2-digit' }
    : span > 15 * 60000 ? { hour: '2-digit', minute: '2-digit' } : { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const path = (s: TimelineSeries) => {
    let d = `M${x(t0)},${y(0)}`, last = 0;
    for (const p of s.points) {
      const px = x(Date.parse(p.at));
      d += `H${px}V${y(p.score)}`;
      last = p.score;
    }
    return `${d}H${x(t1)}V${y(last)}`;
  };

  // Crosshair snaps to the nearest moment a score changed.
  const stops = [...new Set([t0, ...times, t1])].sort((a, b) => a - b);
  const snap = (t: number) => stops.reduce((best, s) => Math.abs(s - t) < Math.abs(best - t) ? s : best, stops[0]);
  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    if (px < PAD.left - 8 || px > width - PAD.right + 8) return setHoverT(null);
    setHoverT(snap(t0 + ((px - PAD.left) / plotW) * span));
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const index = hoverT == null ? stops.length - 1 : stops.indexOf(hoverT) + (e.key === 'ArrowRight' ? 1 : -1);
    setHoverT(stops[Math.max(0, Math.min(stops.length - 1, index))]);
  };

  const readout = hoverT == null ? [] : series
    .map(s => ({ s, score: scoreAt(s, hoverT) }))
    .sort((a, b) => b.score - a.score);
  const tipLeft = hoverT == null ? 0 : x(hoverT);
  const tipOnLeft = tipLeft > width * 0.6;

  return (
    <div ref={wrapRef} className="relative w-full select-none">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Score progression for the top ${series.length} teams. Use the left and right arrow keys to step through score changes.`}
        tabIndex={0}
        className="block touch-none rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        onPointerMove={onPointer}
        onPointerLeave={() => setHoverT(null)}
        onKeyDown={onKey}
        onBlur={() => setHoverT(null)}
      >
        {yTicks.map(v => (
          <g key={v}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke="#263248" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(v)} dy="0.32em" textAnchor="end" className="fill-faint text-[11px] tabular-nums">
              {v.toLocaleString()}
            </text>
          </g>
        ))}
        {xTicks.map((t, i) => (
          <text key={t} x={x(t)} y={height - 8} textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'} className="fill-faint text-[11px]">
            {tickLabel(t)}
          </text>
        ))}
        {series.map(s => (
          <path key={s._id} d={path(s)} fill="none" stroke={SLOTS[slots.get(s._id) ?? 0]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {series.map(s => {
          const last = s.points[s.points.length - 1]?.score ?? 0;
          return <circle key={s._id} cx={x(t1)} cy={y(last)} r={4} fill={SLOTS[slots.get(s._id) ?? 0]} stroke="#121a2a" strokeWidth={2} />;
        })}
        {hoverT != null && (
          <g pointerEvents="none">
            <line x1={x(hoverT)} x2={x(hoverT)} y1={PAD.top} y2={PAD.top + plotH} stroke="#8592ad" strokeWidth={1} />
            {readout.map(({ s, score }) => (
              <circle key={s._id} cx={x(hoverT)} cy={y(score)} r={4} fill={SLOTS[slots.get(s._id) ?? 0]} stroke="#121a2a" strokeWidth={2} />
            ))}
          </g>
        )}
      </svg>

      {hoverT != null && (
        <div
          className="pointer-events-none absolute top-2 z-10 w-56 rounded-lg border border-edge-light bg-canvas/95 p-3 text-xs shadow-xl shadow-black/40 backdrop-blur"
          style={tipOnLeft ? { right: width - tipLeft + 12 } : { left: tipLeft + 12 }}
        >
          <p className="mb-2 font-semibold text-fg">{new Date(hoverT).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <ul className="space-y-1">
            {readout.map(({ s, score }) => (
              <li key={s._id} className="flex items-center gap-2">
                <span className="h-0.5 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: SLOTS[slots.get(s._id) ?? 0] }} />
                <span className="min-w-0 flex-1 truncate text-fg-soft">{s.name}</span>
                <span className="font-semibold tabular-nums text-fg">{score.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Legend">
        {series.map(s => (
          <li key={s._id} className="flex min-w-0 items-center gap-2 text-xs">
            <span className="h-0.5 w-4 flex-shrink-0 rounded-full" style={{ backgroundColor: SLOTS[slots.get(s._id) ?? 0] }} />
            <span className="max-w-[10rem] truncate text-fg-soft">{s.name}</span>
            <span className="tabular-nums text-faint">{(s.points[s.points.length - 1]?.score ?? 0).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScoreTimeline;
