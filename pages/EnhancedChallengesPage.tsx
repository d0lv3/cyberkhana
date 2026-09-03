import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { challengeService } from '../services/challengeService';
import { userService } from '../services/userService';
import { universityService } from '../services/universityService';
import { Challenge } from '../types';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import Button from '../components/ui/EnhancedButton';
import EmptyState from '../components/ui/EmptyState';
import Toast, { ToastType } from '../components/ui/Toast';
import { Search, Target, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ChallengeArt, { ArtKind, artKindFor, ART_ACCENT } from '../components/challenges/ChallengeArt';

/* Each challenge row is a real link, not a div with a click handler. That is
   what gives it keyboard access, a focus ring, a context menu, middle-click and
   cmd-click — all of which a list of shareable things needs, and none of which
   an onClick div has. motion.create keeps the entrance animation. */
const MotionLink = motion.create(Link);

interface ActiveToast { id: string; type: ToastType; message: string }

/** Minimal, self-contained toast queue backed by the shared <Toast> component. */
const useToast = () => {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const toast = (type: string, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const safeType = (['success', 'error', 'info', 'warning'].includes(type) ? type : 'info') as ToastType;
    setToasts((prev) => [...prev, { id, type: safeType, message }]);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));
  return { toast, toasts, removeToast };
};

/* Each tab carries the art that stands in for it. The blurb is the hero's
   subtitle, so the page says something different depending on where you are
   rather than repeating one line under six headings. */
const CATEGORIES: Array<{ label: string; value: string; art: ArtKind; blurb: string }> = [
  {
    label: 'All challenges',
    value: 'all',
    art: 'all',
    blurb: 'Every target on the range, across all six disciplines. Pick an operation and deploy your container.',
  },
  {
    label: 'Web',
    value: 'Web Exploitation',
    art: 'web',
    blurb: 'Break the application layer — injection, broken auth, logic flaws and everything a browser will happily send.',
  },
  {
    label: 'Pwn',
    value: 'Binary Exploitation',
    art: 'pwn',
    blurb: 'Take control of a running process. Overflow the buffer, corrupt the heap, redirect execution.',
  },
  {
    label: 'Crypto',
    value: 'Cryptography',
    art: 'crypto',
    blurb: 'Attack the maths, not the lock. Weak keys, reused nonces and homemade ciphers all give way eventually.',
  },
  {
    label: 'Reversing',
    value: 'Reverse Engineering',
    art: 'reversing',
    blurb: 'Work backwards from the binary. Disassemble, trace and recover the logic somebody tried to hide.',
  },
  {
    label: 'Forensics',
    value: 'Forensics',
    art: 'forensics',
    blurb: 'Reconstruct what happened from what was left behind — disk images, memory dumps and packet captures.',
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  'Very Easy': '#34d399',
  'Easy': '#00a859',
  'Medium': '#f3a43a',
  'Hard': '#f43f5e',
  'Expert': '#a855f7',
};

const SORT_OPTIONS = [
  { label: 'Highest points', value: 'points-desc' },
  { label: 'Lowest points', value: 'points-asc' },
  { label: 'Most solves', value: 'solves-desc' },
];

const EnhancedChallengesPage: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [solvedChallenges, setSolvedChallenges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'uncompleted'>('all');
  const [sortBy, setSortBy] = useState('points-desc');
  
  const { toast, toasts, removeToast } = useToast();

  const me = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const isSuperAdmin = me?.role === 'super-admin';

  // Super-admin only: choose which university's challenges to view.
  const [universities, setUniversities] = useState<Array<{ code: string; name: string }>>([]);
  const [selectedUniversity, setSelectedUniversity] = useState('');

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    universityService
      .getUniversities()
      .then((list: any) => {
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : [];
        setUniversities(arr);
        if (arr.length) setSelectedUniversity((prev) => prev || arr[0].code);
      })
      .catch(() => {
        /* non-fatal: the dropdown just stays empty */
      });
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  const fetchData = async () => {
    // Super-admin must pick a university first — their own code ('SUPER') has no challenges.
    if (isSuperAdmin && !selectedUniversity) {
      setChallenges([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const universityCode = isSuperAdmin ? selectedUniversity : me?.universityCode;

      const [challengesData, profileData] = await Promise.all([
        challengeService.getChallenges(universityCode),
        userService.getUserProfile().catch(() => ({ solvedChallenges: [] })),
      ]);

      setChallenges(challengesData);
      setSolvedChallenges(profileData.solvedChallenges || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast('error', 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  // (Re)fetch on mount and whenever the super-admin switches university.
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUniversity, isSuperAdmin]);

  const isSolved = (challengeId: string) => solvedChallenges.includes(challengeId);

  const filteredAndSortedChallenges = useMemo(() => {
    let filtered = challenges.filter((challenge) => {
      const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || challenge.category === selectedCategory;
      const matchesDifficulty = difficultyFilter === 'all' || challenge.difficulty === difficultyFilter;
      
      let matchesStatus = true;
      if (statusFilter === 'completed') matchesStatus = isSolved(challenge._id);
      if (statusFilter === 'uncompleted') matchesStatus = !isSolved(challenge._id);

      return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'points-desc': return (b.currentPoints || b.points) - (a.currentPoints || a.points);
        case 'points-asc': return (a.currentPoints || a.points) - (b.currentPoints || b.points);
        case 'solves-desc': return (b.solves || 0) - (a.solves || 0);
        default: return 0;
      }
    });

    return filtered;
  }, [challenges, searchTerm, selectedCategory, difficultyFilter, statusFilter, sortBy]);

  const activeCategoryData = CATEGORIES.find((c) => c.value === selectedCategory) || CATEGORIES[0];
  const accent = ART_ACCENT[activeCategoryData.art];

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted">
          <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
          <p className="text-sm font-semibold text-muted">Loading challenges…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-fg-soft pb-24">

      {/* Toast queue */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
          {toasts.map((t) => (
            <Toast key={t.id} id={t.id} type={t.type} message={t.message} onClose={removeToast} />
          ))}
        </div>
      )}

      {/* ── HERO ──
          The category's own art carries the banner. It replaces a stock photo
          behind a 95%-opaque scrim, which was doing nothing for the page but
          costing a 400KB download on every tab switch. */}
      <div className="relative overflow-hidden border-b border-edge bg-canvas-alt">
        {/* accent bloom, tinted per category */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-500"
          style={{
            background: `radial-gradient(120% 100% at 78% 22%, ${accent}26 0%, transparent 62%)`,
          }}
        />
        {/* hairline grid, so the panel has texture without an image */}
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-10">
          <Breadcrumbs />

          <div className="mt-6 flex flex-col-reverse items-center gap-6 md:flex-row md:items-center md:justify-between md:gap-10">
            <div className="min-w-0 flex-1 text-center md:text-start">
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold"
                style={{ color: accent, borderColor: `${accent}59`, backgroundColor: `${accent}14` }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
                {filteredAndSortedChallenges.length}{' '}
                {filteredAndSortedChallenges.length === 1 ? 'challenge' : 'challenges'}
              </span>

              <h1 className="mt-3 text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-fg">
                {activeCategoryData.label}
              </h1>
              <p className="mt-3 max-w-xl text-base md:text-lg text-muted mx-auto md:mx-0">
                {activeCategoryData.blurb}
              </p>
            </div>

            <ChallengeArt
              key={activeCategoryData.art}
              kind={activeCategoryData.art}
              glow
              className="h-36 w-44 flex-shrink-0 md:h-52 md:w-64 lg:h-60 lg:w-72"
            />
          </div>
        </div>
      </div>

      {/* ── HORIZONTAL CATEGORY TABS ── */}
      <div className="bg-panel border-b border-edge sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex scroll-x py-4 gap-2">
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 touch:min-h-tap rounded-lg text-sm font-semibold transition-all border ${
                  isActive
                    ? 'bg-surface border-edge-light text-fg'
                    : 'bg-inset border-edge text-muted hover:text-fg-soft hover:border-edge-light'
                }`}
              >
                {/* The dot is the category's identity colour — the one place
                    on this page where colour carries meaning. */}
                <span
                  className="h-2 w-2 rounded-full transition-opacity"
                  style={{
                    backgroundColor: ART_ACCENT[cat.art],
                    opacity: isActive ? 1 : 0.45,
                  }}
                />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── SUB-NAVBAR: FILTERS & SEARCH ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="bg-panel border border-edge rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
          
          <div className="flex w-full lg:w-auto items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
              <input
                type="text"
                placeholder="Search..."
                aria-label="Search challenges by title"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-inset border border-edge rounded-lg py-2 pl-9 pr-4 text-sm text-fg focus:outline-none focus:border-brand-neon"
              />
            </div>

            {/* Super-admin: choose which university's challenges to view */}
            {isSuperAdmin && (
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                aria-label="View challenges for university"
                title="University"
                className="bg-inset border border-edge text-sm font-semibold text-fg-soft rounded-lg px-3 py-2 outline-none focus:border-brand-neon"
              >
                {universities.length === 0 && <option value="">No universities</option>}
                {universities.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.name} ({u.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex w-full lg:w-auto items-center gap-3 overflow-x-auto pb-2 lg:pb-0">
            {/* Status Filter */}
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-inset border border-edge text-sm font-semibold text-fg-soft rounded-lg px-3 py-2 outline-none focus:border-brand-neon"
            >
              <option value="all">All challenges</option>
              <option value="uncompleted">Unsolved</option>
              <option value="completed">Solved</option>
            </select>

            {/* Difficulty Filter */}
            <select
              aria-label="Filter by difficulty"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="bg-inset border border-edge text-sm font-semibold text-fg-soft rounded-lg px-3 py-2 outline-none focus:border-brand-neon"
            >
              <option value="all">Any difficulty</option>
              <option value="Very Easy">Very Easy</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Expert">Expert</option>
            </select>

            {/* Sort */}
            <select
              aria-label="Sort challenges"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-inset border border-edge text-fg-soft text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:border-brand-neon"
            >
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

        </div>
      </div>

      {/* ── TARGET LIST (Clean Table Layout) ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredAndSortedChallenges.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12">
              <EmptyState
                icon={Target}
                title="No challenges found"
                description="Adjust your search and filter parameters."
                actionLabel="Reset filters"
                onAction={() => { setSearchTerm(''); setSelectedCategory('all'); setDifficultyFilter('all'); setStatusFilter('all'); }}
              />
            </motion.div>
          ) : (
            <div className="bg-panel border border-edge rounded-xl overflow-hidden">
              {filteredAndSortedChallenges.map((challenge, index) => {
                const solved = isSolved(challenge._id);
                const diffColor = DIFFICULTY_COLORS[challenge.difficulty] || '#9aa5bf';
                
                return (
                  <MotionLink
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    /* Capped: this list re-mounts on every category tab, search
                       keystroke and sort change, so an uncapped index delay made
                       the 40th row arrive 800ms late over and over. */
                    transition={{ delay: Math.min(index * 0.02, 0.3) }}
                    key={challenge._id}
                    to={`/challenges/${challenge._id}`}
                    className="group border-b border-edge last:border-b-0 hover:bg-surface cursor-pointer select-none transition-colors p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-neon focus-visible:-outline-offset-2"
                  >
                    
                    {/* Left: Status & Identity.
                        min-w-0 next to flex-1: a flex item's min-width is
                        auto, so without it the title and description set a
                        floor wider than the phone and shove the row
                        off-screen rather than truncating. */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full">
                      <div
                        className={`relative w-12 h-12 rounded-lg flex items-center justify-center border overflow-hidden shrink-0 transition-colors ${
                          solved ? 'bg-brand/10 border-brand/30' : 'bg-inset border-edge group-hover:border-edge-light'
                        }`}
                      >
                        <ChallengeArt
                          kind={artKindFor(challenge.category)}
                          detailed={false}
                          className={`h-11 w-11 transition-opacity ${solved ? 'opacity-25' : 'opacity-100'}`}
                        />
                        {solved && <CheckCircle2 className="absolute w-6 h-6 text-brand" />}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-fg truncate group-hover:text-brand-neon transition-colors">{challenge.title}</h3>
                          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-inset border border-edge text-muted">
                            {challenge.category}
                          </span>
                        </div>
                        <p className="text-sm text-faint line-clamp-1 group-hover:text-muted transition-colors">{challenge.description}</p>
                      </div>
                    </div>

                    {/* Right: Metrics & CTA */}
                    <div className="flex items-center justify-between md:justify-start w-full md:w-auto gap-4 sm:gap-12 shrink-0 border-t md:border-t-0 border-edge pt-3 md:pt-0 ps-0 sm:ps-16 md:ps-0">
                      
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: diffColor }} />
                        <span className="text-xs font-semibold text-fg-soft">{challenge.difficulty}</span>
                      </div>

                      <div className="text-right">
                        <span className="block text-base font-bold text-brand-neon leading-none mb-1">+{challenge.currentPoints || challenge.points} <span className="text-xs text-dim">pts</span></span>
                        <span className="text-[11px] text-faint">{challenge.solves || 0} {challenge.solves === 1 ? 'solve' : 'solves'}</span>
                      </div>
                    </div>

                  </MotionLink>
                )
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default EnhancedChallengesPage;
