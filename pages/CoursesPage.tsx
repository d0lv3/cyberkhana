import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, TerminalSquare, Shield, Activity, Users, ArrowRight, Zap, Target } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';




const PathCard = ({
  title,
  description,
  icon: Icon,
  color,
  modules,
  students,
  to,
  active = false
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  modules: number;
  students: number;
  to: string;
  active?: boolean;
}) => (
  <Link to={to} className="block group">
    <div 
      className="relative h-64 flex flex-col p-6 sm:p-8 rounded-2xl border bg-[#121a2a] overflow-hidden transition-all duration-300"
      style={{
        borderColor: active ? color : '#263248',
        boxShadow: active ? `0 0 20px ${color}15` : 'none'
      }}
    >
      {/* Background glow lines */}
      <div 
        className="absolute bottom-0 right-0 w-64 h-64 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: color }}
      />
      
      {active && (
        <div className="absolute top-0 right-0 px-3 py-1 bg-[#1a2332] border-b border-l border-[#263248] rounded-bl-xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#9fef00] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9fef00] animate-pulse" />
            Active Enrollment
          </span>
        </div>
      )}

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div 
          className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon className="w-7 h-7" style={{ color }} />
        </div>
      </div>

      <h3 className="text-2xl font-black text-[#f3f6ff] mb-2 relative z-10 group-hover:text-white transition-colors">{title}</h3>
      <p className="text-sm text-[#9aa5bf] mb-8 flex-grow relative z-10 leading-relaxed">{description}</p>

      <div className="flex items-center justify-between pt-6 border-t border-[#263248] relative z-10">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8390ac]">
            <Target className="w-4 h-4" />
            {modules} Modules
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8390ac]">
            <Users className="w-4 h-4" />
            {students.toLocaleString()} Users
          </div>
        </div>
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-translate-y-1"
          style={{ backgroundColor: `${color}15` }}
        >
          <ArrowRight className="w-4 h-4" style={{ color }} />
        </div>
      </div>
    </div>
  </Link>
);

const CoursesPage: React.FC = () => {
  return (
    <div className="min-h-screen pb-24 bg-[#0d1117] text-[#d2d7e3]">
      {/* ── HERO SECTION ── */}
      <div
        className="relative pt-12 pb-20 border-b border-[#263248] overflow-hidden bg-[#0a0d12]"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(10, 13, 18, 0.92) 0%, rgba(10, 13, 18, 0.92) 45%, rgba(10, 13, 18, 0.65) 100%), url(/assets/academy/Gemini_Generated_Image_se59kdse59kdse59.jpg)',
          backgroundSize: 'contain',
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,168,89,0.03),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_100%,rgba(96,165,250,0.03),transparent_50%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <Breadcrumbs />
          
          <div className="mt-8 flex flex-col md:flex-row items-center gap-8 md:gap-16">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center md:text-left flex flex-col items-center md:items-start"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#263248] bg-[#121a2a] text-[#00a859] text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                <Zap className="w-3 h-3" /> Training Environment
              </div>
              
              <img 
                src="/assets/brand/cyberkhana-academy.png" 
                alt="CyberKhana Academy" 
                className="h-16 md:h-24 w-auto object-contain filter drop-shadow-lg mb-6"
              />
              
              <p className="text-[#9aa5bf] max-w-2xl text-base md:text-lg leading-relaxed pt-2">
                Master the fundamentals of cybersecurity through guided theory and hands-on practical exploitation. Learn, practice, and prove your skills.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── CONTENT GRID ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-16 space-y-16">
        
        {/* Section: Your Learning Paths */}
        <section>
          <div className="flex items-center gap-3 mb-8 border-b border-[#263248] pb-4">
            <div className="w-2 h-2 rounded-full bg-[#9fef00]" />
            <h2 className="text-xl font-bold text-[#f3f6ff] uppercase tracking-widest">Active Paths</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <PathCard
                title="Linux Fundamentals"
                description="Master the Linux command line, file permissions, and basic system administration essential for any cybersecurity operative."
                icon={TerminalSquare}
                color="#9fef00"
                modules={9}
                students={248}
                to="/courses/linux"
                active={true}
              />
            </motion.div>
          </div>
        </section>


      </div>
    </div>
  );
};

export default CoursesPage;