import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { challengeService } from '../services/challengeService';
import { userService } from '../services/userService';
import Card from '../components/ui/card';
import Button from '../components/ui/EnhancedButton';
import Input from '../components/ui/input';
import Modal from '../components/ui/Modal';
import PointDecayInfo from '../src/components/PointDecayInfo';
import {
  ArrowLeft, Users, CheckCircle, XCircle, Flag as FlagIcon,
  HelpCircle, Download, Lock, ExternalLink,
  Crown, User, Target, Book, Clock, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChallengeArt, { artKindFor, categoryAccent } from '../components/challenges/ChallengeArt';

interface Challenge {
  _id: string;
  title: string;
  category: string;
  points: number;
  currentPoints?: number;
  description: string;
  author: string;
  flag: string;
  difficulty?: string;
  estimatedTime?: number;
  hints?: Array<{ text: string; cost: number }>;
  files?: Array<{ name: string; url: string }>;
  solves: number;
  writeup?: {
    content: string;
    images?: string[];
    isUnlocked: boolean;
    pdfFile?: {
      name: string;
      url: string;
      uploadedAt: string;
    };
  };
  universityCode: string;
}

/* The category's own colour, used for the hero bloom and the category label
   and nowhere else on the page. The art comes from the shared set, so a
   challenge looks the same here as it does in the list it was opened from. */
const DIFFICULTY_STYLES: Record<string, { color: string; bg: string; dot: string }> = {
  'Very Easy': { color: 'text-brand', bg: 'bg-brand/10', dot: 'bg-brand' },
  'Easy': { color: 'text-mint', bg: 'bg-mint/10', dot: 'bg-mint' },
  'Medium': { color: 'text-amber', bg: 'bg-amber/10', dot: 'bg-amber' },
  'Hard': { color: 'text-danger', bg: 'bg-danger/10', dot: 'bg-danger' },
  'Expert': { color: 'text-[#dc2626]', bg: 'bg-[#dc2626]/10', dot: 'bg-[#dc2626]' },
};

const NewChallengeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flag, setFlag] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [solved, setSolved] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [unlockedHints, setUnlockedHints] = useState<string[]>([]);
  const [showHintModal, setShowHintModal] = useState(false);
  const [selectedHint, setSelectedHint] = useState<{ index: number; cost: number; title: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [solvers, setSolvers] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [challengeData, profileData] = await Promise.all([
        challengeService.getChallenge(id!),
        userService.getUserProfile()
      ]);

      setChallenge(challengeData);
      setCurrentUser(profileData);
      setUnlockedHints(profileData.unlockedHints || []);

      const isAlreadySolved = profileData.solvedChallenges?.includes(id!);
      setSolved(isAlreadySolved);

      try {
        const solversData = await challengeService.getChallengeSolvers(id!);
        setSolvers(solversData?.solvers || []);
      } catch (err) {
        console.error('Error fetching solvers:', err);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setMessage({ type: 'error', text: 'Failed to load challenge' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim()) {
      setMessage({ type: 'error', text: 'Please enter a flag' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });

      await challengeService.submitFlag(id!, flag);
      setSolved(true);
      setFlag('');
      setShowSuccessModal(true);

      await fetchData();
      const profileData = await userService.getUserProfile();
      setCurrentUser(profileData);

      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const updatedUser = { ...user, ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new CustomEvent('userUpdate', { detail: updatedUser }));
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Incorrect flag. Try again!' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePurchaseHint = (hintIndex: number, cost: number) => {
    if (!currentUser || currentUser.points < cost) {
      setMessage({ type: 'error', text: 'Not enough points to purchase this hint!' });
      return;
    }
    setSelectedHint({ index: hintIndex, cost, title: `Hint ${hintIndex + 1}` });
    setShowHintModal(true);
  };

  const confirmPurchaseHint = async () => {
    if (!selectedHint || !currentUser || !challenge) return;

    try {
      const result = await userService.purchaseHint(challenge._id, selectedHint.index, selectedHint.cost);
      const hintId = `${challenge._id}-${selectedHint.index}`;
      setUnlockedHints([...unlockedHints, hintId]);

      // Update the challenge hints in state with the revealed hint text
      if (result.hintText && challenge.hints) {
        const updatedHints = challenge.hints.map((hint: any, idx: number) => {
          if (idx === selectedHint.index) {
            return { ...hint, text: result.hintText };
          }
          return hint;
        });
        setChallenge({ ...challenge, hints: updatedHints });
      }

      const newPoints = currentUser.points - selectedHint.cost;
      setCurrentUser({ ...currentUser, points: newPoints });

      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const updatedUser = { ...user, points: newPoints };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new CustomEvent('userUpdate', { detail: updatedUser }));
      }

      setMessage({ type: 'success', text: 'Hint unlocked successfully!' });
      setShowHintModal(false);
      setSelectedHint(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to purchase hint' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
          <p className="text-sm font-semibold text-muted">Loading challenge…</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center border-edge bg-panel">
          <XCircle className="w-16 h-16 text-danger mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-fg mb-2">Challenge not found</h2>
          <p className="text-muted mb-6">The challenge you are looking for does not exist or has been removed.</p>
          <Button onClick={() => navigate('/challenges')} className="w-full">
            Back to challenges
          </Button>
        </Card>
      </div>
    );
  }

  const difficulty = challenge.difficulty || 'Medium';
  const difficultyStyle = DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.Medium;
  const accent = categoryAccent(challenge.category);
  const artKind = artKindFor(challenge.category);

  return (
    <div className="min-h-screen bg-canvas text-fg-soft pb-24">
      {/* Hero.
          The category art carries this banner. It replaced a stock photograph
          under a near-opaque scrim — 400KB to render a dark rectangle. */}
      <div className="relative overflow-hidden border-b border-edge bg-canvas-alt">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(110% 100% at 80% 20%, ${accent}22 0%, transparent 62%)` }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #1a2438 1px, transparent 1px), linear-gradient(to bottom, #1a2438 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(120% 90% at 30% 40%, #000 0%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(120% 90% at 30% 40%, #000 0%, transparent 75%)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full pt-8 pb-10">
          <button
            onClick={() => navigate('/challenges')}
            className="group flex items-center gap-2 touch:min-h-tap text-muted hover:text-brand-neon mb-6 transition-colors select-none"
          >
            <div className="p-2 rounded-lg bg-inset border border-edge group-hover:border-brand-neon/50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold">Back to challenges</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 min-w-0">
            <div className="flex-1 min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ color: accent, borderColor: `${accent}59`, backgroundColor: `${accent}14` }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
                  {challenge.category}
                </span>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${difficultyStyle.bg} border border-current opacity-80`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${difficultyStyle.dot}`} />
                  <span className={`text-xs font-semibold ${difficultyStyle.color}`}>{difficulty}</span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-fg leading-tight break-words">
                {challenge.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-muted">
                {/* Authorship is optional on a challenge, and a lone "By" with
                    nothing after it reads as a rendering fault. */}
                {challenge.author && (
                  <span className="flex items-center gap-2 bg-panel/60 px-3 py-1.5 rounded-full border border-edge text-xs">
                    <User size={13} className="text-faint" />
                    By <span className="font-semibold text-fg-soft">{challenge.author}</span>
                  </span>
                )}
                <span className="flex items-center gap-2 bg-panel/60 px-3 py-1.5 rounded-full border border-edge text-xs">
                  <Clock size={13} className="text-faint" />
                  About {challenge.estimatedTime || 30} minutes
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 shrink-0 md:flex-row md:items-center md:gap-6">
              <ChallengeArt kind={artKind} glow className="hidden h-40 w-48 md:block lg:h-48 lg:w-56" />

              <div className="flex flex-col items-center gap-2">
                <div className="relative bg-panel/80 backdrop-blur-xl border border-edge px-6 py-5 rounded-2xl flex flex-col items-center min-w-[140px] shadow-2xl">
                  <span className="text-4xl font-black text-brand-neon leading-none">
                    {challenge.currentPoints || challenge.points}
                  </span>
                  <span className="mt-2 text-xs font-semibold text-muted">Bounty</span>
                </div>
                {solved && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-4 py-1.5 bg-brand/15 text-brand border border-brand/30 rounded-full text-xs font-bold"
                  >
                    <Award size={14} />
                    Solved
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Description Section */}
            <Card className="p-8 bg-panel/80 backdrop-blur-md border-edge shadow-2xl overflow-hidden relative group">
              <div className="pointer-events-none absolute top-0 end-0 p-8 opacity-[0.06]">
                <Book size={120} style={{ color: accent }} />
              </div>

              <h2 className="text-xl font-bold text-fg mb-6 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-brand-neon rounded-full" />
                Description
              </h2>

              <div className="relative z-10">
                <div className="text-fg-soft text-lg leading-relaxed font-medium whitespace-pre-wrap break-words bg-canvas/50 p-6 rounded-2xl border border-edge/50">
                  {challenge.description}
                </div>
              </div>
            </Card>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Files */}
              {challenge.files && challenge.files.length > 0 && (
                <Card className="p-6 bg-panel/80 border-edge">
                  <h3 className="text-lg font-bold text-fg mb-4 flex items-center gap-2">
                    <Download size={18} className="text-muted" />
                    Attached Files
                  </h3>
                  <div className="space-y-3">
                    {challenge.files.map((file, index) => (
                      <a
                        key={index}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-canvas/80 rounded-xl border border-edge hover:border-brand-neon/30 hover:bg-edge/50 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon focus-visible:ring-offset-2 focus-visible:ring-offset-base"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-edge group-hover:bg-brand-neon/20 group-hover:text-brand-neon">
                            <Book size={16} />
                          </div>
                          <span className="text-sm font-medium text-fg-soft truncate max-w-[150px]">{file.name}</span>
                        </div>
                        <Download size={14} className="text-muted group-hover:text-brand-neon" />
                      </a>
                    ))}
                  </div>
                </Card>
              )}

              {/* Link */}
              {(challenge as any).challengeLink && (
                <Card className="p-6 bg-panel/80 border-edge flex flex-col h-full">
                  <h3 className="text-lg font-bold text-fg mb-4 flex items-center gap-2">
                    <ExternalLink size={18} className="text-muted" />
                    Environment
                  </h3>
                  <a
                    href={(challenge as any).challengeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto block p-5 bg-brand/10 hover:bg-brand/20 border border-brand/20 rounded-2xl transition-all group text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon focus-visible:ring-offset-2 focus-visible:ring-offset-base"
                  >
                    <ExternalLink size={24} className="text-brand-neon mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-brand-neon font-bold block">Access Challenge Instance</span>
                    <span className="text-[10px] text-brand-neon/50 truncate block mt-1">{(challenge as any).challengeLink}</span>
                  </a>
                </Card>
              )}
            </div>

            {/* Writeup Section */}
            {challenge.writeup?.isUnlocked && (challenge.writeup.content || challenge.writeup.pdfFile) && (
              <Card className="p-8 bg-panel/80 border-edge border-l-4 border-l-brand">
                <h2 className="text-xl font-bold text-fg mb-6 flex items-center gap-3">
                  <CheckCircle size={20} className="text-brand" />
                  Writeup
                </h2>
                <div className="space-y-6">
                  {challenge.writeup.pdfFile && (
                    <div className="p-6 bg-canvas/50 rounded-2xl border border-edge flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                          <Download size={24} />
                        </div>
                        <div>
                          <p className="text-fg-soft font-bold">{challenge.writeup.pdfFile.name}</p>
                          <p className="text-muted text-xs">PDF Document • {new Date(challenge.writeup.pdfFile.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => window.open(challenge.writeup!.pdfFile!.url, '_blank')}
                        className="bg-edge hover:bg-edge/80 text-white"
                      >
                        Source PDF
                      </Button>
                    </div>
                  )}
                  {challenge.writeup.content && (
                    <div className="prose prose-invert max-w-none text-fg-soft leading-relaxed font-normal bg-canvas/30 p-8 rounded-2xl border border-edge/50 whitespace-pre-wrap">
                      {challenge.writeup.content}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Admin Info */}
            <PointDecayInfo challenge={challenge} user={currentUser} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            {/* Submission Card */}
            <Card className={`p-8 transition-all duration-500 ${solved ? 'bg-brand-neon/5 border-brand-neon/20' : 'bg-panel border-edge shadow-2xl shadow-brand-neon/5'}`}>
              <h2 className="text-xl font-bold text-fg mb-6 flex items-center gap-2">
                <Target size={20} className={solved ? 'text-brand-neon' : 'text-muted'} />
                Flag Submission
              </h2>

              {solved ? (
                <div className="space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-brand-neon/20 flex items-center justify-center border-2 border-brand-neon/30">
                    <CheckCircle className="w-10 h-10 text-brand-neon" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-white mb-1">Solved</p>
                    <p className="text-muted text-sm">System integrity verified. Points awarded.</p>
                  </div>
                  <Button variant="outline" className="w-full border-edge" onClick={() => navigate('/challenges')}>
                    Back to challenges
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted group-focus-within:text-brand-neon transition-colors">
                      <FlagIcon size={18} />
                    </div>
                    <Input
                      type="text"
                      placeholder="khana{...}"
                      value={flag}
                      onChange={(e) => setFlag(e.target.value)}
                      className="w-full pl-12 py-4 bg-canvas border-edge focus:border-brand-neon/50 rounded-2xl transition-all"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-brand-deep hover:bg-[#006737] shadow-lg shadow-brand/20 h-auto rounded-2xl text-lg font-black"
                  >
                    {submitting ? 'SUBMITTING...' : 'SUBMIT FLAG'}
                  </Button>
                </form>
              )}

              <AnimatePresence>
                {message.text && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'error' ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-brand-neon/10 text-brand-neon border border-brand-neon/20'
                      }`}
                  >
                    {message.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    <span className="text-sm font-bold">{message.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Hints Card */}
            {challenge.hints && challenge.hints.length > 0 && (
              <Card className="p-8 bg-panel border-edge">
                <h2 className="text-xl font-bold text-fg mb-6 flex items-center gap-2">
                  <HelpCircle size={20} className="text-muted" />
                  Hints
                </h2>
                <div className="space-y-4">
                  {challenge.hints
                    .map((hint: any, index: number) => {
                      const hintId = `${challenge._id}-${index}`;
                      const isUnlocked = unlockedHints.includes(hintId);

                      return (
                        <div
                          key={index}
                          className={`p-5 rounded-2xl border transition-all ${isUnlocked
                            ? 'bg-brand-neon/5 border-brand-neon/20'
                            : 'bg-canvas border-edge hover:border-edge/80'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              {isUnlocked ? <HelpCircle size={16} className="text-brand-neon" /> : <Lock size={16} className="text-muted" />}
                              <span className={`text-sm font-bold ${isUnlocked ? 'text-brand-neon' : 'text-muted'}`}>
                                Hint {index + 1}
                              </span>
                            </div>
                            {!isUnlocked && (
                              <span className="text-xs font-semibold text-amber">
                                {hint.cost} {hint.cost === 1 ? 'point' : 'points'}
                              </span>
                            )}
                          </div>

                          {isUnlocked ? (
                            <p className="text-fg-soft text-sm italic font-medium leading-relaxed">{hint.text}</p>
                          ) : (
                            <Button
                              onClick={() => handlePurchaseHint(index, hint.cost)}
                              disabled={!currentUser || currentUser.points < hint.cost}
                              className="w-full bg-edge hover:bg-edge/80 h-9 rounded-xl text-xs font-bold"
                              variant="secondary"
                            >
                              Unlock hint
                            </Button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </Card>
            )}

            {/* Solvers Card */}
            <Card className="p-8 bg-panel border-edge">
              <h2 className="text-xl font-bold text-fg mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-muted" />
                  High scores
                </div>
                <span className="text-xs font-bold text-brand-neon">{solvers.length} solved</span>
              </h2>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {solvers.length > 0 ? (
                  solvers.map((solver, index) => (
                    <div
                      key={solver.odId || index}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${solver.isFirstBlood
                        ? 'bg-amber/10 border border-amber/30'
                        : 'bg-canvas/50 border border-edge/50'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${solver.isFirstBlood
                        ? 'bg-amber text-amber-950'
                        : 'bg-edge text-muted'
                        }`}>
                        {solver.isFirstBlood ? <Crown size={20} /> : <span className="text-xs font-black tracking-tighter">{index + 1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black truncate text-sm tracking-tight ${solver.isFirstBlood ? 'text-amber' : 'text-fg-soft'
                          }`}>
                          {solver.fullName || solver.username}
                        </p>
                        <p className="text-xs text-muted">
                          {solver.isFirstBlood && <span className="text-amber me-2">🩸 First blood</span>}
                          {new Date(solver.solvedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-canvas flex items-center justify-center border border-edge opacity-50">
                      <Target size={24} className="text-muted" />
                    </div>
                    <p className="text-muted font-semibold mb-1">No solves yet</p>
                    <p className="text-faint text-xs font-medium">Be the first to breach this challenge.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} className="max-w-md">
        <div className="relative p-10 text-center bg-canvas border border-brand-neon/30 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(159,239,0,0.2),transparent)]" />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 mx-auto mb-8 rounded-full bg-brand-neon/20 flex items-center justify-center border-2 border-brand-neon/30 shadow-[0_0_50px_rgba(159,239,0,0.3)]">
            <CheckCircle className="w-14 h-14 text-brand-neon" />
          </motion.div>
          <h2 className="text-3xl font-black text-fg mb-4 tracking-tight">Challenge solved</h2>
          <p className="text-muted font-medium mb-8 leading-relaxed">Excellent work agent. Your credentials have been verified and points have been allocated to your profile.</p>
          <Button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-brand-deep hover:bg-[#006737] text-fg font-black rounded-2xl h-auto">
            ACKNOWLEDGE
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showHintModal} onClose={() => setShowHintModal(false)} className="max-w-sm">
        <div className="p-8 bg-canvas border border-edge rounded-3xl">
          <h3 className="text-xl font-black text-fg mb-4 tracking-tight flex items-center gap-2">
            <Lock className="text-amber" />
            Unlock Hint?
          </h3>
          {selectedHint && (
            <>
              <p className="text-muted font-medium mb-8 leading-relaxed text-sm">
                Unlocking <strong className="text-fg">Hint {selectedHint.index + 1}</strong> will cost <strong className="text-amber">{selectedHint.cost} Units</strong>. This budget allocation is permanent.
              </p>
              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => setShowHintModal(false)} className="flex-1 bg-panel border-edge rounded-xl h-12">
                  ABORT
                </Button>
                <Button onClick={confirmPurchaseHint} className="flex-1 bg-amber hover:bg-amber/80 text-black font-black rounded-xl h-12">
                  CONFIRM
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default NewChallengeDetailPage;
