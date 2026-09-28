import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Calendar, Flag, Trophy, Users } from 'lucide-react';
import CompetitionArt, { STATE_ACCENT } from './CompetitionArt';

/** One entry of the player's own record, as `GET /users/me/competitions` returns it. */
export interface PastEntry {
  id: string;
  kind: 'workshop' | 'event';
  name: string;
  status: string;
  startTime: string | null;
  endTime: string | null;
  rank: number | null;
  field: number | null;
  points: number | null;
  solved: number | null;
  totalChallenges: number | null;
  team: string | null;
  resultsPublished: boolean;
  certificateCode: string | null;
}

const ordinal = (n: number) => {
  const tens = n % 100, ones = n % 10;
  return `${n}${tens >= 11 && tens <= 13 ? 'th' : ones === 1 ? 'st' : ones === 2 ? 'nd' : ones === 3 ? 'rd' : 'th'}`;
};

/**
 * A finished competition the player took part in, with how they did. Built like the live cards
 * beside it, in the muted ended tint, and the whole card opens the final standings.
 */
const PastCompetitionCard: React.FC<{ entry: PastEntry }> = ({ entry }) => {
  const accent = STATE_ACCENT.ended;
  const unit = entry.kind === 'event' ? 'teams' : 'players';
  const placing = entry.rank != null && entry.field ? `${ordinal(entry.rank)} of ${entry.field} ${unit}` : 'Not placed';

  return (
    <article className="group relative flex min-h-[18rem] flex-col overflow-hidden rounded-2xl border border-edge bg-panel transition-all duration-200 hover:-translate-y-1 hover:border-edge-light hover:shadow-lg hover:shadow-black/40">
      <div className="absolute inset-x-0 top-0 h-36 overflow-hidden" aria-hidden>
        <div className="absolute inset-0" style={{ background: `radial-gradient(85% 90% at 50% 30%, ${accent}24 0%, transparent 70%)` }} />
        <CompetitionArt state="ended" className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.06]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/90 to-transparent" aria-hidden />
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-panel/80 to-transparent" aria-hidden />

      <div className="relative z-10 flex items-start justify-between gap-2 p-3.5">
        <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold backdrop-blur-sm"
          style={{ color: accent, borderColor: `${accent}4d`, backgroundColor: `${accent}1a` }}>
          Ended
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-inset/80 px-2 py-0.5 text-xs font-semibold text-muted backdrop-blur-sm">
          {entry.kind === 'event' ? <><Users size={11} /> Team CTF</> : <><Flag size={11} /> Workshop</>}
        </span>
      </div>

      <div className="relative z-10 mt-auto space-y-2.5 p-4 pt-0">
        <h3 className="line-clamp-2 text-lg font-bold leading-snug text-fg transition-colors group-hover:text-brand-neon">
          <Link to={`/competition/${entry.id}/leaderboard`} className="after:absolute after:inset-0 after:rounded-2xl focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand/50">
            {entry.name}
          </Link>
        </h3>
        <p className="flex items-center gap-2 text-sm font-semibold text-fg-soft">
          <Trophy size={14} className={entry.rank != null && entry.rank <= 3 ? 'text-amber' : 'text-muted'} />
          {placing}
          {entry.points != null && <span className="font-normal text-muted">· {entry.points} pts</span>}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
          {entry.endTime && <span className="inline-flex items-center gap-1.5"><Calendar size={12} /> {new Date(entry.endTime).toLocaleDateString()}</span>}
          {entry.team && <span className="inline-flex min-w-0 items-center gap-1.5"><Users size={12} /> <span className="truncate">{entry.team}</span></span>}
          {entry.solved != null && entry.totalChallenges != null && <span>{entry.solved}/{entry.totalChallenges} solved</span>}
        </div>
        {entry.certificateCode && (
          // Above the card's link, so it opens the certificate rather than the standings.
          <a href={`#/certificates/${entry.certificateCode}`} target="_blank" rel="noopener noreferrer"
            className="relative z-20 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-neon">
            <Award size={13} /> View certificate
          </a>
        )}
      </div>
    </article>
  );
};

export default PastCompetitionCard;
