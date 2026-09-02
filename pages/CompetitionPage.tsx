import React, { useState, useEffect } from 'react';
import { useNow, isCompetitionOver, formatTimeRemaining } from '../src/hooks/useCompetitionClock';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { competitionService } from '../services/competitionService';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/input';
import {
  Trophy, Clock, Lock, Play, ArrowRight,
  Calendar, ChevronDown, ChevronUp, Target, Shield,
} from 'lucide-react';
import CompetitionArt, { CompetitionState, STATE_ACCENT } from '../components/competition/CompetitionArt';

interface Competition {
  _id: string;
  name: string;
  universityCode: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'active' | 'ended';
  challenges: any[];
}

// ─── Status helpers ────────────────────────────────────────────────────────────
/* Three states, three colours, and nothing else on the card is coloured — the
   hue is how you tell a live event from a finished one at a glance, so it is
   spent there rather than on decoration. */
const getStatusMeta = (status: string, ended: boolean): {
  label: string;
  state: CompetitionState;
  color: string;
} => {
  if (ended || status === 'ended') return { label: 'Ended', state: 'ended', color: STATE_ACCENT.ended };
  if (status === 'active') return { label: 'Live', state: 'live', color: STATE_ACCENT.live };
  return { label: 'Upcoming', state: 'upcoming', color: STATE_ACCENT.upcoming };
};

const getCountdown = (target: string, label: string, now: number) => {
  const diff = new Date(target).getTime() - now;
  if (Number.isNaN(diff)) return '—';
  if (diff <= 0) return label === 'starts' ? 'Started' : 'Ended';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const sec = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

// ─── Competition Card (Player view) ────────────────────────────────────────────
/**
 * A cover-art tile rather than a bordered list row: art fills the top, scrims
 * keep the badges and title legible over it, and the whole card is the target.
 * Same shape as an Academy module card, so the two products read as one.
 */
const CompetitionCard: React.FC<{
  competition: Competition;
  onEnter: (id: string) => void;
  delay?: number;
}> = ({ competition, onEnter, delay = 0 }) => {
  const now = useNow();
  const ended = isCompetitionOver(competition, now);
  const meta = getStatusMeta(competition.status, ended);
  const navigate = useNavigate();
  const live = !ended && competition.status === 'active';

  const open = () => {
    if (ended) navigate(`/competition/${competition._id}/leaderboard`);
    else if (live) onEnter(competition._id);
  };
  const actionable = ended || live;

  const timing = ended
    ? `Ended ${new Date(competition.endTime).toLocaleDateString()}`
    : live
      ? `Ends in ${formatTimeRemaining(competition.endTime, now, competition.hasTimeLimit)}`
      : `Starts in ${getCountdown(competition.startTime, 'starts', now)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      role={actionable ? 'button' : undefined}
      tabIndex={actionable ? 0 : undefined}
      onClick={actionable ? open : undefined}
      onKeyDown={(e) => {
        if (actionable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          open();
        }
      }}
      className={`group relative flex h-72 flex-col overflow-hidden rounded-2xl border border-edge bg-panel transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${
        actionable ? 'cursor-pointer hover:-translate-y-1 hover:border-edge-light hover:shadow-lg hover:shadow-black/40' : ''
      }`}
    >
      {/* Cover: the art, over a bloom in the state's own colour */}
      <div className="absolute inset-x-0 top-0 h-44 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(85% 90% at 50% 30%, ${meta.color}24 0%, transparent 70%)` }}
        />
        <CompetitionArt
          state={meta.state}
          className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.06]"
        />
      </div>

      {/* Readability scrims — the bottom one is what lets a long title sit over
          the art instead of pushing it out of the card. */}
      <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/85 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-panel/80 to-transparent" />

      {/* Top: state + size */}
      <div className="relative z-10 flex items-start justify-between gap-2 p-3.5">
        <span
          className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold backdrop-blur-sm"
          style={{ color: meta.color, borderColor: `${meta.color}4d`, backgroundColor: `${meta.color}1a` }}
        >
          {live && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
          {meta.label}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-edge bg-inset/80 px-2 py-0.5 text-xs font-semibold text-muted backdrop-blur-sm">
          <Target size={11} />
          {competition.challenges?.length || 0}
        </span>
      </div>

      {/* Bottom: title, timing, action */}
      <div className="relative z-10 mt-auto p-4 pt-0">
        <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-snug text-fg transition-colors group-hover:text-brand-neon">
          {competition.name}
        </h3>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted">
            <Clock size={12} className="flex-shrink-0" />
            <span className="truncate">{timing}</span>
          </span>
          {ended ? (
            <span className="inline-flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold text-muted transition-colors group-hover:text-fg-soft">
              <Trophy size={13} /> Leaderboard
            </span>
          ) : live ? (
            <span
              className="inline-flex flex-shrink-0 items-center gap-1.5 text-xs font-bold"
              style={{ color: meta.color }}
            >
              <Play size={13} /> Enter
              <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          ) : (
            <span className="flex-shrink-0 text-xs font-semibold text-faint">Not open yet</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Admin Row (expandable) ─────────────────────────────────────────────────────
const AdminCompetitionRow: React.FC<{
  competition: Competition;
  isExpanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  fetchCompetitions: () => void;
}> = ({ competition, isExpanded, onToggle, fetchCompetitions }) => {
  const navigate = useNavigate();
  const now = useNow();
  const ended = isCompetitionOver(competition, now);
  const meta = getStatusMeta(competition.status, ended);

  return (
    <div className="rounded-xl border border-edge bg-panel overflow-hidden">
      {/* Row header */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer select-none hover:bg-surface-hover transition-colors"
        onClick={onToggle}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${meta.color}15`, border: `1px solid ${meta.color}25` }}
        >
          <Trophy size={18} style={{ color: meta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-fg truncate">{competition.name}</p>
          <p className="text-xs text-dim">
            {competition.challenges?.length || 0} challenges ·{' '}
            {ended ? `Ended ${new Date(competition.endTime).toLocaleDateString()}` : formatTimeRemaining(competition.endTime, now, competition.hasTimeLimit)}
          </p>
        </div>
        <span
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold"
          style={{ color: meta.color, backgroundColor: `${meta.color}1a`, border: `1px solid ${meta.color}4d` }}
        >
          {!ended && competition.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
          {meta.label}
        </span>
        <div className="text-faint flex-shrink-0">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded challenges */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-edge bg-inset overflow-hidden"
          >
            <div className="p-5">
              <h4 className="text-sm font-bold text-fg mb-4">Challenges</h4>
              {competition.challenges?.length > 0 ? (
                <div className="space-y-2 mb-5">
                  {competition.challenges.map((challenge: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded bg-panel border border-edge">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-fg-soft truncate">{challenge.title}</p>
                        <p className="text-xs text-dim">
                          {challenge.category} · {(challenge as any).currentPoints || challenge.points} pts · {challenge.solves} solves
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/competition/${competition._id}/challenge/${challenge._id}`)}
                          disabled={ended}
                          className="px-3 py-1.5 text-xs font-semibold rounded border border-edge text-muted hover:border-brand/40 hover:text-brand transition-colors disabled:opacity-40"
                        >
                          {ended ? 'View' : 'Solve'}
                        </button>
                        {!ended && (
                          <button
                            onClick={async () => {
                              if (confirm(`Remove "${challenge.title}" from this competition?`)) {
                                try {
                                  await competitionService.removeChallengeFromCompetition(competition._id, challenge._id);
                                  fetchCompetitions();
                                } catch (err: any) {
                                  alert(err.message || 'Failed');
                                }
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-semibold rounded border border-red-500/20 text-red-400/80 hover:border-red-500/50 hover:text-red-400 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-faint mb-4">No challenges added yet</p>
              )}

              <div className="flex gap-2">
                {ended ? (
                  <button
                    onClick={() => navigate(`/competition/${competition._id}/leaderboard`)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded border border-edge text-muted hover:border-edge-light hover:text-fg-soft transition-all"
                  >
                    <Trophy size={14} /> View leaderboard
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/competition/${competition._id}`)}
                    className="flex-1 py-2.5 text-sm font-bold rounded bg-brand text-white hover:bg-brand-deep transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={14} /> Enter competition
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────────
const CompetitionPage: React.FC = () => {
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [enteringCode, setEnteringCode] = useState(false);
  const [securityCode, setSecurityCode] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // A minute is enough to keep the Live / Past buckets honest; the per-card
  // countdowns tick at their own, finer rate.
  const listNow = useNow(60_000);

  const userData = localStorage.getItem('user');
  const currentUser = userData ? JSON.parse(userData) : null;
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'super-admin');

  useEffect(() => { fetchCompetitions(); }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const universityCode = currentUser?.universityCode;
      const data = await competitionService.getCompetitions(universityCode);
      setCompetitions(
        data.sort((a: Competition, b: Competition) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )
      );
    } catch (err) {
      console.error('Error fetching competitions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter a security code' });
      return;
    }
    try {
      setEnteringCode(true);
      setMessage({ type: '', text: '' });
      const result = await competitionService.validateSecurityCode(securityCode);
      if (result.competitionId) {
        setMessage({ type: 'success', text: 'Code accepted! Redirecting...' });
        setTimeout(() => {
          setIsJoinModalOpen(false);
          setSecurityCode('');
          setMessage({ type: '', text: '' });
          navigate(`/competition/${result.competitionId}`);
        }, 900);
      } else {
        setMessage({ type: 'error', text: 'Invalid security code' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to enter competition' });
    } finally {
      setEnteringCode(false);
    }
  };

  const openJoinModal = () => {
    setIsJoinModalOpen(true);
    setSecurityCode('');
    setMessage({ type: '', text: '' });
  };

  // Derived lists
  const activeComps    = competitions.filter(c => c.status === 'active' && !isCompetitionOver(c, listNow));
  const upcomingComps  = competitions.filter(c => c.status === 'pending' || (c.status === 'active' && Date.now() < new Date(c.startTime).getTime()));
  const pastComps      = competitions.filter(c => c.status === 'ended' || isCompetitionOver(c, listNow));

  // ── Loading ──
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-panel rounded-xl animate-pulse border border-edge" />
        ))}
      </div>
    );
  }

  // ── Modal ──
  const JoinModal = (
    <Modal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)}>
      <div className="bg-panel border border-edge p-6 rounded-xl max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-brand/15 border border-brand/25">
            <Lock size={18} className="text-brand" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-fg">Enter competition</h2>
            <p className="text-xs text-muted">Enter the code from your instructor</p>
          </div>
        </div>
        <form onSubmit={handleEnterCompetition} className="space-y-4">
          <Input
            type="text"
            placeholder="Security code (e.g. COMP2025)"
            value={securityCode}
            onChange={(e) => setSecurityCode(e.target.value)}
            autoFocus
          />
          {message.text && (
            <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-brand/10 text-brand border border-brand/25' : 'bg-red-500/10 text-red-400 border border-red-500/25'}`}>
              {message.text}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={enteringCode}
              className="flex-1 py-2.5 text-sm font-bold rounded bg-brand text-white hover:bg-brand-deep transition-colors disabled:opacity-50"
            >
              {enteringCode ? 'Checking...' : 'Enter'}
            </button>
            <button
              type="button"
              onClick={() => setIsJoinModalOpen(false)}
              disabled={enteringCode}
              className="px-5 py-2.5 text-sm font-semibold rounded border border-edge text-muted hover:text-fg-soft transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );

  // ── ADMIN VIEW ──
  if (isAdmin) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-fg">Competitions</h1>
            <p className="text-sm text-muted mt-1">Manage all competitions</p>
          </div>
          <button
            onClick={openJoinModal}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded bg-brand text-white hover:bg-brand-deep transition-colors"
          >
            <Lock size={15} /> Join with code
          </button>
        </div>

        {competitions.length > 0 ? (
          <div className="space-y-3">
            {competitions.map((comp) => (
              <AdminCompetitionRow
                key={comp._id}
                competition={comp}
                isExpanded={expandedId === comp._id}
                onToggle={() => setExpandedId(expandedId === comp._id ? null : comp._id)}
                onExpand={() => setExpandedId(comp._id)}
                fetchCompetitions={fetchCompetitions}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-surface border border-edge flex items-center justify-center mb-4">
              <Trophy size={28} className="text-faint" />
            </div>
            <p className="text-muted">No competitions yet</p>
          </div>
        )}
        {JoinModal}
      </div>
    );
  }

  // ── PLAYER VIEW ──
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-edge bg-inset text-xs text-dim mb-3">
            <Shield size={12} className="text-brand" />
            <span>CTF platform</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-fg">Competitions</h1>
          <p className="text-sm text-muted mt-1">Join live events and compete for the top spot</p>
        </div>
        <button
          onClick={openJoinModal}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-3 touch:min-h-tap text-sm font-bold rounded-lg border border-brand/40 text-brand bg-brand/10 hover:bg-brand/15 transition-colors"
        >
          <Lock size={15} /> Join with code
        </button>
      </motion.div>

      {/* Active */}
      {activeComps.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-brand-neon animate-pulse" />
            <h2 className="text-sm font-bold text-fg">Live now</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeComps.map((c, i) => (
              <CompetitionCard key={c._id} competition={c} onEnter={(id) => navigate(`/competition/${id}`)} delay={i * 0.05} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcomingComps.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={14} className="text-amber" />
            <h2 className="text-sm font-bold text-fg">Upcoming</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingComps.map((c, i) => (
              <CompetitionCard key={c._id} competition={c} onEnter={() => {}} delay={i * 0.05} />
            ))}
          </div>
        </section>
      )}

      {/* Past */}
      {pastComps.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={14} className="text-muted" />
            <h2 className="text-sm font-bold text-fg">Past competitions</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pastComps.map((c, i) => (
              <CompetitionCard key={c._id} competition={c} onEnter={() => {}} delay={i * 0.05} />
            ))}
          </div>
        </section>
      )}

      {/* Empty */}
      {competitions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-surface border border-edge flex items-center justify-center mb-4">
            <Trophy size={28} className="text-faint" />
          </div>
          <p className="text-muted">No competitions available yet</p>
          <p className="text-xs text-faint mt-1">Check back soon for upcoming events</p>
        </div>
      )}

      {JoinModal}
    </div>
  );
};

export default CompetitionPage;
