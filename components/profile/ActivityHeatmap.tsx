import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ProfileSolve, capturesByDay, dayDate, dayIndex, plural } from './profileData';

/* ── Capture activity ──
 * One cell per day, one column per week, as many weeks as the card has room
 * for: about four months on a phone, a full year on a desktop.
 *
 * Colour is magnitude only: one green ramp from just off the panel up to the
 * brand neon, stepped and checked as an ordinal scale on this surface
 * (monotone lightness, visible steps, 2.5:1 at the faint end, 23° of hue).
 * Every value is also in the capture log below, so the tooltip is never the
 * only way to read a day. */

const LEVELS = ['#1a2332', '#28663f', '#26864d', '#00a859', '#9fef00'];
const levelOf = (count: number) => Math.min(count, LEVELS.length - 1);

const LABEL_W = 30;
const LABEL_H = 18;
const GAP = 3;
const MIN_PITCH = 13;
// Loose enough that a year of weeks spans a full-width card instead of stopping short of its edge.
const MAX_PITCH = 21;
const MIN_WEEKS = 12;
const MAX_WEEKS = 53;
const WEEKDAYS: Array<[number, string]> = [[1, 'Mon'], [3, 'Wed'], [5, 'Fri']];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const longDay = (date: Date) =>
  date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

interface Cell { week: number; weekday: number }

const ActivityHeatmap: React.FC<{ solves: ProfileSolve[]; now?: Date }> = ({ solves, now }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<Cell | null>(null);
  const [keyboard, setKeyboard] = useState(false);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => setWidth(wrap.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  const today = dayIndex(now ?? new Date());
  const counts = useMemo(() => capturesByDay(solves), [solves]);

  const room = Math.max(0, width - LABEL_W + GAP);
  const weeks = clamp(Math.floor(room / MIN_PITCH), MIN_WEEKS, MAX_WEEKS);
  const pitch = clamp(room / weeks, 8, MAX_PITCH);
  const cell = pitch - GAP;
  // Columns start on Sunday; the last one ends today.
  const firstDay = today - dayDate(today).getDay() - (weeks - 1) * 7;
  const dayAt = ({ week, weekday }: Cell) => firstDay + week * 7 + weekday;

  const inWindow = [...counts].filter(([day]) => day >= firstDay && day <= today);
  const flags = inWindow.reduce((n, [, count]) => n + count, 0);
  const months = Math.max(1, Math.round((weeks * 7) / 30.4));

  // A month is labelled at the first column that starts in it.
  const monthLabels = useMemo(() => {
    const labels: Array<{ week: number; text: string }> = [];
    let previous = -1;
    for (let week = 0; week < weeks; week++) {
      const start = dayDate(firstDay + week * 7);
      if (start.getMonth() === previous) continue;
      previous = start.getMonth();
      labels.push({ week, text: start.toLocaleDateString('en-US', { month: 'short' }) });
    }
    // The first column is a month already under way, and its label would crowd the next one.
    if (labels.length > 1 && labels[1].week - labels[0].week < 3) labels.shift();
    return labels;
  }, [firstDay, weeks]);

  const describe = (target: Cell) => {
    const day = dayAt(target);
    const count = counts.get(day) || 0;
    return { day, count, text: `${count ? plural(count, 'flag') : 'No flags'}, ${longDay(dayDate(day))}` };
  };

  const pick = (event: React.PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    // Nearest cell rather than the painted square: the gaps belong to a cell too.
    const week = Math.floor((event.clientX - box.left - LABEL_W + GAP / 2) / pitch);
    const weekday = Math.floor((event.clientY - box.top - LABEL_H + GAP / 2) / pitch);
    const target = { week, weekday };
    if (week < 0 || week >= weeks || weekday < 0 || weekday > 6 || dayAt(target) > today) setActive(null);
    else setActive(target);
    setKeyboard(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    };
    if (event.key === 'Escape') { setActive(null); return; }
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    const from = active ?? { week: weeks - 1, weekday: today - firstDay - (weeks - 1) * 7 };
    let day = dayAt(from) + move[0] * 7 + move[1];
    day = clamp(day, firstDay, today);
    setActive({ week: Math.floor((day - firstDay) / 7), weekday: (day - firstDay) % 7 });
    setKeyboard(true);
  };

  const svgWidth = LABEL_W + weeks * pitch - GAP;
  const svgHeight = LABEL_H + 7 * pitch - GAP;
  const detail = active ? describe(active) : null;
  const tipX = active ? LABEL_W + active.week * pitch + cell / 2 : 0;
  // Above the cell, except on the top rows, where above would run into the panel header.
  const below = !!active && active.weekday < 2;
  const tipY = active ? LABEL_H + active.weekday * pitch + (below ? cell + 8 : -8) : 0;
  // Keep the tooltip inside the card near either edge.
  const tipShift = tipX < 90 ? '-12%' : tipX > svgWidth - 90 ? '-88%' : '-50%';

  return (
    <div>
      <div
        ref={wrapRef}
        className="relative rounded-lg focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-neon"
        tabIndex={0}
        role="group"
        aria-label={`Capture activity: ${plural(flags, 'flag')} on ${plural(inWindow.length, 'day')} in the last ${months} months. Use the arrow keys to read each day.`}
        onKeyDown={onKeyDown}
        onBlur={() => keyboard && setActive(null)}
        dir="ltr"
      >
        {width > 0 && (
          <svg
            width={svgWidth}
            height={svgHeight}
            className="block max-w-full"
            aria-hidden
            onPointerMove={pick}
            onPointerDown={pick}
            onPointerLeave={() => !keyboard && setActive(null)}
          >
            {monthLabels.map(({ week, text }) => (
              <text key={week} x={LABEL_W + week * pitch} y={11} className="fill-faint text-[10px] font-medium">
                {text}
              </text>
            ))}
            {WEEKDAYS.map(([weekday, text]) => (
              <text key={text} x={0} y={LABEL_H + weekday * pitch + cell - 1} className="fill-faint text-[10px] font-medium">
                {text}
              </text>
            ))}
            {Array.from({ length: weeks }, (_, week) =>
              Array.from({ length: 7 }, (_, weekday) => {
                const day = dayAt({ week, weekday });
                if (day > today) return null;
                const lit = active?.week === week && active.weekday === weekday;
                return (
                  <rect
                    key={`${week}-${weekday}`}
                    x={LABEL_W + week * pitch}
                    y={LABEL_H + weekday * pitch}
                    width={cell}
                    height={cell}
                    rx={2}
                    fill={LEVELS[levelOf(counts.get(day) || 0)]}
                    stroke={lit ? '#f3f6ff' : 'none'}
                    strokeWidth={lit ? 1.5 : 0}
                  />
                );
              })
            )}
          </svg>
        )}

        {detail && (
          <div
            className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-edge-light bg-surface px-2.5 py-1.5 shadow-lg shadow-black/40"
            style={{ left: tipX, top: tipY, transform: `translate(${tipShift}, ${below ? '0' : '-100%'})` }}
          >
            <p className="text-xs font-bold text-fg">{detail.count ? plural(detail.count, 'flag') : 'No flags'}</p>
            <p className="text-[11px] text-muted">{longDay(dayDate(detail.day))}</p>
          </div>
        )}
        <span className="sr-only" aria-live="polite">{keyboard && detail ? detail.text : ''}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-faint">
        <span>
          {flags ? `${plural(flags, 'flag')} on ${plural(inWindow.length, 'day')} in the last ${months} months` : `No captures in the last ${months} months`}
        </span>
        <span className="flex items-center gap-1.5" aria-hidden>
          Less
          {LEVELS.map(color => (
            <span key={color} className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
          ))}
          More
        </span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
