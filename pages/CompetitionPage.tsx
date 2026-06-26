import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { competitionService } from '../services/competitionService';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/input';
import {
  Trophy, Clock, Users, Lock, Play, ArrowRight,
  Calendar, ChevronDown, ChevronUp, Target, Zap, Shield,
} from 'lucide-react';

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
const getStatusMeta = (status: string, ended: boolean) => {
  if (ended || status === 'ended') {
    return { label: 'ENDED',   color: '#f43f5e', bg: 'rgba(244,63,94,0.10)',  border: 'rgba(244,63,94,0.30)' };
  }
  if (status === 'active') {
    return { label: 'LIVE',    color: '#9fef00', bg: 'rgba(159,239,0,0.10)', border: 'rgba(159,239,0,0.35)' };
  }
  return { label: 'UPCOMING', color: '#f3a43a', bg: 'rgba(243,164,58,0.10)', border: 'rgba(243,164,58,0.30)' };
};

const isTimeEnded = (endTime: string) => new Date() > new Date(endTime);

const getCountdown = (target: string, label: string) => {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return label === 'starts' ? 'Started' : 'Ended';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// ─── Competition Card (Player view) ────────────────────────────────────────────
const CompetitionCard: React.FC<{
  competition: Competition;
  onEnter: (id: string) => void;
  delay?: number;
}> = ({ competition, onEnter, delay = 0 }) => {
  const ended = isTimeEnded(competition.endTime);
  const meta = getStatusMeta(competition.status, ended);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group rounded-xl border border-[#263248] bg-[#121a2a] overflow-hidden hover:border-[#354562] hover:bg-[#182235] transition-all duration-200"
    >
      {/* Top color strip */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${meta.color}80, transparent)` }}
      />

      <div className="p-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${meta.color}15`, border: `1px solid ${meta.color}30` }}
          >
            {ended
              ? <Trophy size={22} style={{ color: meta.color }} />
              : competition.status === 'active'
                ? <Zap size={22} style={{ color: meta.color }} />
                : <Calendar size={22} style={{ color: meta.color }} />
            }
          </div>
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-widest flex-shrink-0"
            style={{ color: meta.color, backgroundColor: meta.bg, border: `1px solid ${meta.border}` }}
          >
            {!ended && competition.status === 'active' && (
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            )}
            {meta.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-[#f3f6ff] mb-3 line-clamp-2">{competition.name}</h3>

        {/* Stats */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#8390ac] mb-5">
          <span className="flex items-center gap-1.5">
            <Target size={12} />
            {competition.challenges?.length || 0} challenges
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            {ended
              ? `Ended ${new Date(competition.endTime).toLocaleDateString()}`
              : competition.status === 'active'
                ? `Ends in ${getCountdown(competition.endTime, 'ends')}`
                : `Starts in ${getCountdown(competition.startTime, 'starts')}`
            }
          </span>
        </div>

        {/* CTA */}
        {ended ? (
          <button
            onClick={() => navigate(`/competition/${competition._id}/leaderboard`)}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded border border-[#263248] text-[#9aa5bf] hover:border-[#354562] hover:text-[#d2d7e3] transition-all"
          >
            <Trophy size={15} /> View Leaderboard
          </button>
        ) : competition.status === 'active' ? (
          <button
            onClick={() => onEnter(competition._id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-black rounded transition-all"
            style={{ backgroundColor: `${meta.color}18`, border: `1px solid ${meta.border}`, color: meta.color }}
          >
            <Play size={15} /> Enter Competition <ArrowRight size={13} />
          </button>
        ) : (
          <div
            className="w-full text-center py-2.5 text-sm rounded border"
            style={{ color: meta.color, borderColor: meta.border, backgroundColor: meta.bg, opacity: 0.7 }}
          >
            Coming Soon
          </div>
        )}
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
  const ended = isTimeEnded(competition.endTime);
  const meta = getStatusMeta(competition.status, ended);

  return (
    <div className="rounded-xl border border-[#263248] bg-[#121a2a] overflow-hidden">
      {/* Row header */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer hover:bg-[#182235] transition-colors"
        onClick={onToggle}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${meta.color}15`, border: `1px solid ${meta.color}25` }}
        >
          <Trophy size={18} style={{ color: meta.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#f3f6ff] truncate">{competition.name}</p>
          <p className="text-xs text-[#8390ac]">
            {competition.challenges?.length || 0} challenges ·{' '}
            {ended ? `Ended ${new Date(competition.endTime).toLocaleDateString()}` : getCountdown(competition.endTime, 'ends')}
          </p>
        </div>
        <span
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest"
          style={{ color: meta.color, backgroundColor: meta.bg, border: `1px solid ${meta.border}` }}
        >
          {!ended && competition.status === 'active' && <span className="w-1 h-1 rounded-full bg-current animate-pulse" />}
          {meta.label}
        </span>
        <div className="text-[#6e7a94] flex-shrink-0">
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
            className="border-t border-[#263248] bg-[#0e1522] overflow-hidden"
          >
            <div className="p-5">
              <h4 className="text-sm font-bold text-[#f3f6ff] uppercase tracking-wider mb-4">Challenges</h4>
              {competition.challenges?.length > 0 ? (
                <div className="space-y-2 mb-5">
                  {competition.challenges.map((challenge: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded bg-[#121a2a] border border-[#263248]">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#d2d7e3] truncate">{challenge.title}</p>
                        <p className="text-xs text-[#8390ac]">
                          {challenge.category} · {(challenge as any).currentPoints || challenge.points} pts · {challenge.solves} solves
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/competition/${competition._id}/challenge/${challenge._id}`)}
                          disabled={ended}
                          className="px-3 py-1.5 text-xs font-semibold rounded border border-[#263248] text-[#9aa5bf] hover:border-[#00a859]/40 hover:text-[#00a859] transition-colors disabled:opacity-40"
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
                <p className="text-sm text-[#6e7a94] mb-4">No challenges added yet</p>
              )}

              <div className="flex gap-2">
                {ended ? (
                  <button
                    onClick={() => navigate(`/competition/${competition._id}/leaderboard`)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded border border-[#263248] text-[#9aa5bf] hover:border-[#354562] hover:text-[#d2d7e3] transition-all"
                  >
                    <Trophy size={14} /> View Leaderboard
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/competition/${competition._id}`)}
                    className="flex-1 py-2.5 text-sm font-bold rounded bg-[#00a859] text-white hover:bg-[#007a42] transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={14} /> Enter Competition
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
  const activeComps    = competitions.filter(c => c.status === 'active' && !isTimeEnded(c.endTime));
  const upcomingComps  = competitions.filter(c => c.status === 'pending' || (c.status === 'active' && Date.now() < new Date(c.startTime).getTime()));
  const pastComps      = competitions.filter(c => c.status === 'ended' || isTimeEnded(c.endTime));

  // ── Loading ──
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-[#121a2a] rounded-xl animate-pulse border border-[#263248]" />
        ))}
      </div>
    );
  }

  // ── Modal ──
  const JoinModal = (
    <Modal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)}>
      <div className="bg-[#121a2a] border border-[#263248] p-6 rounded-xl max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#00a859]/15 border border-[#00a859]/25">
            <Lock size={18} className="text-[#00a859]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#f3f6ff]">Enter Competition</h2>
            <p className="text-xs text-[#9aa5bf]">Enter the code from your instructor</p>
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
            <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-[#00a859]/10 text-[#00a859] border border-[#00a859]/25' : 'bg-red-500/10 text-red-400 border border-red-500/25'}`}>
              {message.text}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={enteringCode}
              className="flex-1 py-2.5 text-sm font-bold rounded bg-[#00a859] text-white hover:bg-[#007a42] transition-colors disabled:opacity-50"
            >
              {enteringCode ? 'Checking...' : 'Enter'}
            </button>
            <button
              type="button"
              onClick={() => setIsJoinModalOpen(false)}
              disabled={enteringCode}
              className="px-5 py-2.5 text-sm font-semibold rounded border border-[#263248] text-[#9aa5bf] hover:text-[#d2d7e3] transition-colors"
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
            <h1 className="text-3xl font-black text-[#f3f6ff]">Competitions</h1>
            <p className="text-sm text-[#9aa5bf] mt-1">Manage all competitions</p>
          </div>
          <button
            onClick={openJoinModal}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded bg-[#00a859] text-white hover:bg-[#007a42] transition-colors"
          >
            <Lock size={15} /> Join with Code
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
            <div className="w-16 h-16 rounded-full bg-[#1a2332] border border-[#263248] flex items-center justify-center mb-4">
              <Trophy size={28} className="text-[#6e7a94]" />
            </div>
            <p className="text-[#9aa5bf]">No competitions yet</p>
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[#263248] bg-[#0e1522] text-xs text-[#8390ac] mb-3">
            <Shield size={12} className="text-[#00a859]" />
            <span>CTF Platform</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[#f3f6ff]">Competitions</h1>
          <p className="text-sm text-[#9aa5bf] mt-1">Join live events and compete for the top spot</p>
        </div>
        <button
          onClick={openJoinModal}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-3 text-sm font-bold rounded border border-[#9fef00]/40 text-[#9fef00] bg-[#9fef00]/08 hover:bg-[#9fef00]/12 transition-all"
        >
          <Lock size={15} /> Join with Code
        </button>
      </motion.div>

      {/* Active */}
      {activeComps.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#9fef00] animate-pulse" />
            <h2 className="text-sm font-bold text-[#f3f6ff] uppercase tracking-wider">Live Now</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
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
            <Calendar size={14} className="text-[#f3a43a]" />
            <h2 className="text-sm font-bold text-[#f3f6ff] uppercase tracking-wider">Upcoming</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
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
            <Trophy size={14} className="text-[#8390ac]" />
            <h2 className="text-sm font-bold text-[#f3f6ff] uppercase tracking-wider">Past Competitions</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {pastComps.map((c, i) => (
              <CompetitionCard key={c._id} competition={c} onEnter={() => {}} delay={i * 0.05} />
            ))}
          </div>
        </section>
      )}

      {/* Empty */}
      {competitions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[#1a2332] border border-[#263248] flex items-center justify-center mb-4">
            <Trophy size={28} className="text-[#6e7a94]" />
          </div>
          <p className="text-[#9aa5bf]">No competitions available yet</p>
          <p className="text-xs text-[#6e7a94] mt-1">Check back soon for upcoming events</p>
        </div>
      )}

      {JoinModal}
    </div>
  );
};

export default CompetitionPage;
