import React from 'react';
import { Link } from 'react-router-dom';
import { Challenge } from '../types';
import { Users, Award, Clock, Zap, Target, Star, Book, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface EnhancedChallengeCardProps {
  challenge: Challenge;
  isSolved?: boolean;
  isBookmarked?: boolean;
  onBookmark?: (id: string) => void;
}

const CATEGORY_META: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  'Web Exploitation':    { color: '#60a5fa', bg: 'rgba(96,165,250,0.07)',  border: 'rgba(96,165,250,0.2)',  icon: Zap },
  'Reverse Engineering': { color: '#a855f7', bg: 'rgba(168,85,247,0.07)', border: 'rgba(168,85,247,0.2)', icon: Target },
  Cryptography:          { color: '#f97316', bg: 'rgba(249,115,22,0.07)', border: 'rgba(249,115,22,0.2)',  icon: Star },
  'Binary Exploitation': { color: '#f43f5e', bg: 'rgba(244,63,94,0.07)',  border: 'rgba(244,63,94,0.2)',   icon: Zap },
  Forensics:             { color: '#34d399', bg: 'rgba(52,211,153,0.07)', border: 'rgba(52,211,153,0.2)',  icon: Target },
  'Social Engineering':  { color: '#fbbf24', bg: 'rgba(251,191,36,0.07)', border: 'rgba(251,191,36,0.2)',  icon: Users },
  Miscellaneous:         { color: '#9aa5bf', bg: 'rgba(154,165,191,0.07)',border: 'rgba(154,165,191,0.2)', icon: Book },
};

const DIFFICULTY_META: Record<string, { color: string; bg: string; dot: string }> = {
  'Very Easy': { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  dot: '#34d399' },
  Easy:        { color: '#9fef00', bg: 'rgba(159,239,0,0.10)',   dot: '#9fef00' },
  Medium:      { color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  dot: '#fbbf24' },
  Hard:        { color: '#f97316', bg: 'rgba(249,115,22,0.10)',  dot: '#f97316' },
  Expert:      { color: '#f43f5e', bg: 'rgba(244,63,94,0.10)',   dot: '#f43f5e' },
};

const EnhancedChallengeCard: React.FC<EnhancedChallengeCardProps> = ({
  challenge,
  isSolved = false,
}) => {
  const catMeta = CATEGORY_META[challenge.category] || CATEGORY_META.Miscellaneous;
  const difficulty = challenge.difficulty || 'Medium';
  const diffMeta = DIFFICULTY_META[difficulty] || DIFFICULTY_META.Medium;
  const displayPoints = challenge.currentPoints || challenge.points;
  const CategoryIcon = catMeta.icon;

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 400 }}>
      <div
        className={`group relative h-full rounded-xl border bg-[#121a2a] overflow-hidden transition-all duration-200
          ${isSolved
            ? 'border-[#00a859]/30 hover:border-[#00a859]/50'
            : 'border-[#263248] hover:border-[#354562] hover:bg-[#182235]'
          }`}
      >
        {/* Subtle glow on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top right, ${catMeta.color}09 0%, transparent 65%)` }}
        />

        {/* Solved left accent */}
        {isSolved && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#00a859]" />
        )}

        <Link to={`/challenges/${challenge._id || challenge.id}`} className="relative block h-full">
          {/* Card Header Band */}
          <div
            className="h-20 flex items-center justify-center relative border-b border-[#263248]"
            style={{ background: `linear-gradient(135deg, ${catMeta.bg} 0%, #121a2a 80%)` }}
          >
            <CategoryIcon
              size={36}
              style={{ color: catMeta.color, opacity: 0.7 }}
              className="group-hover:scale-110 transition-transform duration-300"
            />

            {/* Points badge */}
            <div className="absolute top-3 right-3 bg-[#0e1522] border border-[#263248] px-2.5 py-1 rounded flex flex-col items-center">
              <span className="text-lg font-black text-[#9fef00] leading-none">{displayPoints}</span>
              <span className="text-[9px] text-[#6e7a94] uppercase tracking-widest mt-0.5">PTS</span>
            </div>

            {/* Solved badge */}
            {isSolved && (
              <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 bg-[#00a859] text-[#0d1117] text-[9px] font-black rounded uppercase tracking-tight">
                <Award size={10} />
                SOLVED
              </div>
            )}
          </div>

          {/* Card Body */}
          <div className="p-5">
            {/* Category + Difficulty row */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: catMeta.color }}
              >
                {challenge.category}
              </span>
              <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded"
                style={{ backgroundColor: diffMeta.bg, border: `1px solid ${diffMeta.dot}30` }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: diffMeta.dot }} />
                <span className="text-[10px] font-black uppercase" style={{ color: diffMeta.color }}>
                  {difficulty}
                </span>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-base font-bold text-[#f3f6ff] mb-2 line-clamp-1 group-hover:text-white transition-colors">
              {challenge.title}
            </h3>

            {/* Description */}
            <p className="text-[#9aa5bf] text-xs line-clamp-2 leading-relaxed mb-4">
              {challenge.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1f2a40]">
              <div className="flex items-center gap-3 text-[#6e7a94]">
                <span className="flex items-center gap-1 text-xs">
                  <Users size={11} />
                  {challenge.solves || 0}
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <Clock size={11} />
                  ~{challenge.estimatedTime || 30}m
                </span>
              </div>
              {challenge.author && (
                <span className="text-[10px] text-[#6e7a94] truncate max-w-[80px]">
                  by {challenge.author}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* External link */}
        {(challenge as any).challengeLink && (
          <a
            href={(challenge as any).challengeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 p-1.5 rounded border border-[#263248] text-[#6e7a94] hover:text-[#00a859] hover:border-[#00a859]/40 opacity-0 group-hover:opacity-100 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </motion.div>
  );
};

export default EnhancedChallengeCard;
