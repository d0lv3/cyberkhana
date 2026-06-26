import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { challengeService } from '../services/challengeService';
import { userService } from '../services/userService';
import { Challenge } from '../types';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import Button from '../components/ui/EnhancedButton';
import EmptyState from '../components/ui/EmptyState';
import { Search, Target, Award, Rocket, CheckCircle2, ChevronDown, Flag, Skull, Shield, Monitor, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const useToast = () => ({ toast: (type: string, msg: string) => console.log(msg) });

const CATEGORIES = [
  { label: 'All Challenges', value: 'all', customIcon: '/assets/icons/icon_all.png', mascotBg: 'from-gray-900 to-[#121a2a]', bgImage: '/assets/academy/Gemini_Generated_Image_fwektofwektofwek.jpg' },
  { label: 'Web', value: 'Web Exploitation', color: '#60a5fa', customIcon: '/assets/icons/icon_web.png', mascotBg: 'from-[#60a5fa]/20 to-[#121a2a]', bgImage: '/assets/academy/Gemini_Generated_Image_cx4kdzcx4kdzcx4k.jpg' },
  { label: 'Pwn', value: 'Binary Exploitation', color: '#f43f5e', customIcon: '/assets/icons/icon_pwn.png', mascotBg: 'from-[#f43f5e]/20 to-[#121a2a]', bgImage: '/assets/academy/Gemini_Generated_Image_93kgsv93kgsv93kg.jpg' },
  { label: 'Crypto', value: 'Cryptography', color: '#f3a43a', customIcon: '/assets/icons/icon_crypto.png', mascotBg: 'from-[#f3a43a]/20 to-[#121a2a]', bgImage: '/assets/academy/Gemini_Generated_Image_xonlj2xonlj2xonl.jpg' },
  { label: 'Reversing', value: 'Reverse Engineering', color: '#a855f7', customIcon: '/assets/icons/icon_forensics.png', mascotBg: 'from-[#a855f7]/20 to-[#121a2a]', bgImage: '/assets/academy/Gemini_Generated_Image_ijgy1cijgy1cijgy.jpg' },
  { label: 'Forensics', value: 'Forensics', color: '#34d399', customIcon: '/assets/icons/icon_reversing.png', mascotBg: 'from-[#34d399]/20 to-[#121a2a]', bgImage: '/assets/academy/Gemini_Generated_Image_454bls454bls454b.jpg' },
];

const HERO_CATEGORY_ICONS = CATEGORIES
  .filter((category) => category.value !== 'all')
  .map((category) => ({ label: category.label, icon: category.customIcon }));

const DIFFICULTY_COlORS: Record<string, string> = {
  'Very Easy': '#34d399',
  'Easy': '#00a859',
  'Medium': '#f3a43a',
  'Hard': '#f43f5e',
  'Expert': '#9fef00',
};

const DIFFICULTY_OPTIONS = ['all', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Expert'];
const SORT_OPTIONS = [
  { label: 'Points ↓', value: 'points-desc' },
  { label: 'Points ↑', value: 'points-asc' },
  { label: 'Most Solves', value: 'solves-desc' },
];

const EnhancedChallengesPage: React.FC = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [solvedChallenges, setSolvedChallenges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'uncompleted'>('all');
  const [sortBy, setSortBy] = useState('points-desc');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      const universityCode = userData ? JSON.parse(userData).universityCode : undefined;

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

  const activeCategoryData = CATEGORIES.find(c => c.value === selectedCategory) || CATEGORIES[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[#9aa5bf]">
          <div className="w-10 h-10 border-4 border-[#00a859]/20 border-t-[#00a859] rounded-full animate-spin" />
          <p className="tracking-widest uppercase text-xs font-bold text-[#00a859]">Loading Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#d2d7e3] pb-24">
      
      {/* ── TOP HERO BANNERS & MASCOTS ── */}
      <div 
        className={`pt-20 pb-10 border-b border-[#263248] relative overflow-hidden transition-colors duration-500 min-h-[340px] flex items-end`}
        style={activeCategoryData.bgImage ? {
          backgroundImage: `linear-gradient(to right, rgba(13, 17, 23, 0.95) 0%, rgba(13, 17, 23, 0.7) 45%, rgba(13, 17, 23, 0.15) 100%), url(${activeCategoryData.bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 25%',
          backgroundRepeat: 'no-repeat'
        } : {}}
      >
        {/* Fallback gradient if no image */}
        {!activeCategoryData.bgImage && (
          <div className={`absolute inset-0 bg-gradient-to-b ${activeCategoryData.mascotBg} opacity-50`} />
        )}
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 w-full relative z-10">
          <Breadcrumbs />
          
          <div className="mt-8">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-[#f3f6ff] tracking-tight uppercase flex items-center gap-3 drop-shadow-lg">
              {selectedCategory === 'all' ? (
                <div className="flex items-center -space-x-2 lg:-space-x-3">
                  {HERO_CATEGORY_ICONS.map((categoryIcon) => (
                    <img
                      key={categoryIcon.label}
                      src={categoryIcon.icon}
                      alt={`${categoryIcon.label} icon`}
                      className="w-10 h-10 lg:w-14 lg:h-14 rounded-lg border border-white/20 bg-[#121a2a] object-cover drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                    />
                  ))}
                </div>
              ) : (activeCategoryData as any).customIcon ? (
                <img src={(activeCategoryData as any).customIcon} alt="Icon" className="w-12 h-12 lg:w-16 lg:h-16 rounded-lg drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
              ) : (activeCategoryData as any).icon ? (
                <div className="w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center">
                  {React.createElement((activeCategoryData as any).icon, { className: "w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]", style: { color: activeCategoryData.color || '#9fef00' } })}
                </div>
              ) : null}
              {activeCategoryData.label}
            </h1>
            <p className="text-[#9aa5bf] mt-4 max-w-2xl text-lg lg:text-xl font-medium drop-shadow-md">
              Pwn systems, uncover flags, and rise through the ranks. Select an operation to deploy your container.
            </p>
          </div>
        </div>
      </div>

      {/* ── HORIZONTAL CATEGORY TABS ── */}
      <div className="bg-[#121a2a] border-b border-[#263248] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex overflow-x-auto custom-scrollbar no-scrollbar py-4 gap-2">
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all border ${
                  isActive 
                    ? 'bg-[#1e293b] border-[#9fef00] text-[#f3f6ff] shadow-[0_0_15px_rgba(159,239,0,0.1)]' 
                    : 'bg-[#0d1422] border-[#263248] text-[#8390ac] hover:text-[#d2d7e3] hover:border-[#6e7a94]'
                }`}
              >
                {isActive && <span className="w-2 h-2 rounded bg-[#9fef00] animate-pulse" />}
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── SUB-NAVBART: FILTERS & SEARCH ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="bg-[#121a2a] border border-[#263248] rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
          
          <div className="flex w-full lg:w-auto items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e7a94]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0e1522] border border-[#263248] rounded-lg py-2 pl-9 pr-4 text-sm text-[#f3f6ff] focus:outline-none focus:border-[#9fef00]"
              />
            </div>
          </div>

          <div className="flex w-full lg:w-auto items-center gap-3 overflow-x-auto pb-2 lg:pb-0">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#0e1522] border border-[#263248] text-sm font-bold text-[#d2d7e3] rounded-lg px-3 py-2 outline-none focus:border-[#9fef00] uppercase tracking-wider"
            >
              <option value="all">All Challenges</option>
              <option value="uncompleted">Unsolved</option>
              <option value="completed">Solved</option>
            </select>

            {/* Difficulty Filter */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="bg-[#0e1522] border border-[#263248] text-sm font-bold text-[#d2d7e3] rounded-lg px-3 py-2 outline-none focus:border-[#9fef00] uppercase tracking-wider"
            >
              <option value="all">Any Difficulty</option>
              <option value="Very Easy">Very Easy</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Expert">Expert</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#1e293b] border border-[#263248] text-[#9fef00] text-sm font-bold rounded-lg px-3 py-2 outline-none uppercase tracking-wider"
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
                actionLabel="Reset Filters"
                onAction={() => { setSearchTerm(''); setSelectedCategory('all'); setDifficultyFilter('all'); setStatusFilter('all'); }}
              />
            </motion.div>
          ) : (
            <div className="bg-[#121a2a] border border-[#263248] rounded-xl overflow-hidden">
              {filteredAndSortedChallenges.map((challenge, index) => {
                const solved = isSolved(challenge._id);
                const diffColor = DIFFICULTY_COlORS[challenge.difficulty] || '#9aa5bf';
                
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    key={challenge._id}
                    onClick={() => navigate(`/challenges/${challenge._id}`)}
                    className="group border-b border-[#263248] last:border-b-0 hover:bg-[#1a2332] cursor-pointer transition-colors p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    
                    {/* Left: Status & Identity */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 mt-1 rounded-lg flex items-center justify-center border overflow-hidden shrink-0 transition-colors ${
                        solved ? 'bg-[#152015] border-[#9fef00]/30' : 'bg-[#0E1522] border-[#263248] group-hover:border-[#60a5fa]'
                      }`}>
                        {solved ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <img 
                              src={CATEGORIES.find(c => c.value === challenge.category)?.customIcon || '/assets/icons/icon_all.png'} 
                              className="w-full h-full object-cover opacity-40"
                              alt="Solved Icon"
                            />
                            <CheckCircle2 className="absolute w-6 h-6 text-[#9fef00]" />
                          </div>
                        ) : (
                          <img 
                            src={CATEGORIES.find(c => c.value === challenge.category)?.customIcon || '/assets/icons/icon_all.png'} 
                            className="w-full h-full object-cover" 
                            alt="Challenge Icon"
                          />
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-black text-[#f3f6ff] truncate group-hover:text-[#9fef00] transition-colors">{challenge.title}</h3>
                          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest bg-[#0e1522] border border-[#263248] text-[#8390ac]">
                            {challenge.category}
                          </span>
                        </div>
                        <p className="text-sm text-[#6e7a94] line-clamp-1 group-hover:text-[#9aa5bf] transition-colors">{challenge.description}</p>
                      </div>
                    </div>

                    {/* Right: Metrics & CTA */}
                    <div className="flex items-center w-full md:w-auto gap-6 sm:gap-12 shrink-0 border-t md:border-t-0 border-[#263248] pt-4 md:pt-0 pl-16 md:pl-0">
                      
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: diffColor }} />
                        <span className="text-xs font-bold uppercase tracking-widest text-[#d2d7e3]">{challenge.difficulty}</span>
                      </div>

                      <div className="text-right">
                        <span className="block text-base font-bold text-[#9fef00] leading-none mb-1">+{challenge.currentPoints || challenge.points} <span className="text-xs text-[#8390ac]">pts</span></span>
                        <span className="text-[10px] text-[#6e7a94] uppercase tracking-wider font-bold">{challenge.solves || 0} Solves</span>
                      </div>
                    </div>

                  </motion.div>
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
