import React from 'react';
import { STATE_ACCENT, CompetitionState } from '../CompetitionArt';

/* Building blocks for the competition console and the competitions list, so
   every management surface shares one set of panels, buttons and fields
   instead of each screen restyling raw elements its own way. */

export const inputClass =
  'w-full rounded-lg border border-edge bg-inset px-3 py-2 text-sm text-fg placeholder:text-faint transition-colors focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60';

type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger';
const tones: Record<ButtonTone, string> = {
  primary: 'bg-brand-deep text-white hover:bg-brand-press',
  secondary: 'border border-edge bg-surface text-fg-soft hover:border-edge-light hover:text-fg',
  ghost: 'text-muted hover:bg-surface-hover hover:text-fg',
  danger: 'border border-danger/30 bg-danger/10 text-danger hover:border-danger/50 hover:bg-danger/15',
};

export const ConsoleButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ButtonTone;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}> = ({ tone = 'secondary', size = 'md', icon, className = '', children, type = 'button', ...props }) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-45 touch:min-h-tap ${
      size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
    } ${tones[tone]} ${className}`}
    {...props}
  >
    {icon}
    {children}
  </button>
);

export const Panel: React.FC<{
  title?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}> = ({ title, icon, actions, className = '', bodyClassName = 'p-4', children }) => (
  <section className={`min-w-0 overflow-hidden rounded-xl border border-edge bg-panel ${className}`}>
    {(title || actions) && (
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-edge px-4 py-3">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-fg">
          {icon && <span className="text-muted">{icon}</span>}
          <span className="truncate">{title}</span>
        </h2>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);

export const Eyebrow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`font-mono text-[11px] uppercase tracking-[0.14em] text-dim ${className}`}>{children}</p>
);

export const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  icon: React.ReactNode;
  accent?: string;
  progress?: number;
}> = ({ label, value, detail, icon, accent = '#00a859', progress }) => (
  <div className="min-w-0 rounded-xl border border-edge bg-panel p-4">
    <div className="mb-3 flex items-center justify-between gap-2">
      <span className="truncate text-xs font-medium text-muted">{label}</span>
      <span
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ color: accent, backgroundColor: `${accent}1a` }}
      >
        {icon}
      </span>
    </div>
    <p className="text-2xl font-black tabular-nums text-fg">{value}</p>
    {detail && <p className="mt-1 truncate text-xs text-faint">{detail}</p>}
    {progress !== undefined && (
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-inset">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: accent }} />
      </div>
    )}
  </div>
);

export type LifecycleState = CompetitionState;

export const lifecycleOf = (competition: { status: string; endTime?: string | null; hasTimeLimit?: boolean }, now = Date.now()): LifecycleState => {
  if (competition.status === 'ended') return 'ended';
  const over = competition.hasTimeLimit !== false && competition.endTime && new Date(competition.endTime).getTime() <= now;
  if (over) return 'ended';
  return competition.status === 'active' ? 'live' : 'upcoming';
};

const LIFECYCLE_LABEL: Record<LifecycleState, string> = { live: 'Live', upcoming: 'Not started', ended: 'Ended' };

export const StatusPill: React.FC<{ state: LifecycleState; className?: string }> = ({ state, className = '' }) => {
  const color = STATE_ACCENT[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${className}`}
      style={{ color, borderColor: `${color}4d`, backgroundColor: `${color}14` }}
    >
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${state === 'live' ? 'animate-pulse' : ''}`} />
      {LIFECYCLE_LABEL[state]}
    </span>
  );
};

export const TypeBadge: React.FC<{ type?: string }> = ({ type }) => (
  type === 'event' ? (
    <span className="inline-flex items-center rounded-md border border-violet/30 bg-violet/10 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-violet">
      CTF event
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md border border-info/30 bg-info/10 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-info">
      Workshop
    </span>
  )
);

export const Chip: React.FC<{ children: React.ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'info'; className?: string; title?: string }> = ({
  children, tone = 'neutral', className = '', title,
}) => {
  const style = {
    neutral: 'border-edge bg-inset text-muted',
    good: 'border-brand/30 bg-brand/10 text-brand',
    warn: 'border-amber/30 bg-amber/10 text-amber',
    bad: 'border-danger/30 bg-danger/10 text-danger',
    info: 'border-info/30 bg-info/10 text-info',
  }[tone];
  return (
    <span title={title} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${style} ${className}`}>
      {children}
    </span>
  );
};

export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; children?: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-edge bg-inset text-faint">{icon}</div>
    <p className="font-semibold text-fg-soft">{title}</p>
    {children && <div className="mt-1 max-w-sm text-sm text-muted">{children}</div>}
  </div>
);

export const Field: React.FC<{ label: string; hint?: React.ReactNode; htmlFor?: string; children: React.ReactNode; className?: string }> = ({
  label, hint, htmlFor, children, className = '',
}) => (
  <div className={`min-w-0 ${className}`}>
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-fg-soft">{label}</label>
    {children}
    {hint && <p className="mt-1.5 text-xs text-faint">{hint}</p>}
  </div>
);

/** A modal surface. The shared Modal supplies only the backdrop and dialog behaviour. */
export const DialogCard: React.FC<{ title: string; description?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }> = ({
  title, description, children, footer,
}) => (
  <div className="flex max-h-[88vh] flex-col overflow-hidden rounded-2xl border border-edge bg-panel shadow-2xl shadow-black/50">
    <div className="border-b border-edge px-5 py-4 pr-14">
      <h2 className="text-lg font-bold text-fg">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">{children}</div>
    {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-edge bg-inset/50 px-5 py-3">{footer}</div>}
  </div>
);

export const Segmented = <T extends string>({ value, options, onChange, label }: {
  value: T;
  options: Array<{ value: T; label: React.ReactNode; count?: number }>;
  onChange: (value: T) => void;
  label: string;
}) => (
  <div role="group" aria-label={label} className="inline-flex rounded-lg border border-edge bg-inset p-0.5">
    {options.map(option => (
      <button
        key={option.value}
        type="button"
        aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors touch:min-h-tap ${
          value === option.value ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg-soft'
        }`}
      >
        {option.label}
        {option.count !== undefined && <span className="tabular-nums text-faint">{option.count}</span>}
      </button>
    ))}
  </div>
);

export const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const formatAgo = (value?: string | Date | null, now = Date.now()) => {
  if (!value) return 'never';
  const seconds = Math.max(0, Math.floor((now - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

/** "2d 4h" / "3h 12m" / "4m 10s" until a moment. */
export const formatSpan = (ms: number) => {
  if (ms <= 0) return '0s';
  const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

/** `datetime-local` speaks local time; toISOString() is UTC. */
export const toLocalInput = (value?: string | Date | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
