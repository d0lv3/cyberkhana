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
  ArrowLeft, Trophy, Users, CheckCircle, XCircle,
  HelpCircle, Download, Lock, ExternalLink,
  Crown, User, Zap, Target, Star, Book, Clock, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const CATEGORY_STYLES: Record<string, { gradient: string; icon: any; color: string; bg: string; bgImage?: string; customIcon?: string }> = {
  'Web Exploitation': { gradient: 'from-[#60a5fa]/20 to-[#121a2a]', icon: Zap, color: 'text-[#60a5fa]', bg: 'bg-[#60a5fa]/10', bgImage: '/assets/academy/Gemini_Generated_Image_cx4kdzcx4kdzcx4k.jpg', customIcon: '/assets/icons/icon_web.png' },
  'Reverse Engineering': { gradient: 'from-[#a855f7]/20 to-[#121a2a]', icon: Target, color: 'text-[#a855f7]', bg: 'bg-[#a855f7]/10', bgImage: '/assets/academy/Gemini_Generated_Image_ijgy1cijgy1cijgy.jpg', customIcon: '/assets/icons/icon_reversing.png' },
  'Cryptography': { gradient: 'from-[#f3a43a]/20 to-[#121a2a]', icon: Star, color: 'text-[#f3a43a]', bg: 'bg-[#f3a43a]/10', bgImage: '/assets/academy/Gemini_Generated_Image_xonlj2xonlj2xonl.jpg', customIcon: '/assets/icons/icon_crypto.png' },
  'Binary Exploitation': { gradient: 'from-[#f43f5e]/20 to-[#121a2a]', icon: Zap, color: 'text-[#f43f5e]', bg: 'bg-[#f43f5e]/10', bgImage: '/assets/academy/Gemini_Generated_Image_93kgsv93kgsv93kg.jpg', customIcon: '/assets/icons/icon_pwn.png' },
  'Forensics': { gradient: 'from-[#34d399]/20 to-[#121a2a]', icon: Target, color: 'text-[#34d399]', bg: 'bg-[#34d399]/10', bgImage: '/assets/academy/Gemini_Generated_Image_454bls454bls454b.jpg', customIcon: '/assets/icons/icon_forensics.png' },
  'Social Engineering': { gradient: 'from-[#818cf8]/20 to-[#121a2a]', icon: Users, color: 'text-[#818cf8]', bg: 'bg-[#818cf8]/10' },
  'Miscellaneous': { gradient: 'from-gray-900 to-[#121a2a]', icon: Book, color: 'text-[#9aa5bf]', bg: 'bg-[#9aa5bf]/10', bgImage: '/assets/academy/Gemini_Generated_Image_pj2knxpj2knxpj2k.jpg', customIcon: '/assets/icons/icon_all.png' },
  Competition: { gradient: 'from-[#60a5fa]/20 to-[#121a2a]', icon: Trophy, color: 'text-[#60a5fa]', bg: 'bg-[#60a5fa]/10', bgImage: '/assets/academy/Gemini_Generated_Image_x94uvzx94uvzx94u.jpg', customIcon: '/assets/icons/icon_all.png' },
  'Competition Challenge': { gradient: 'from-[#00a859]/20 to-[#121a2a]', icon: Trophy, color: 'text-[#00a859]', bg: 'bg-[#00a859]/10', bgImage: '/assets/academy/Gemini_Generated_Image_rwzshhrwzshhrwzs.jpg', customIcon: '/assets/icons/icon_all.png' },
  Academy: { gradient: 'from-[#00a859]/20 to-[#121a2a]', icon: Book, color: 'text-[#00a859]', bg: 'bg-[#00a859]/10', bgImage: '/assets/academy/Gemini_Generated_Image_se59kdse59kdse59.jpg', customIcon: '/assets/icons/icon_all.png' },
};

const DIFFICULTY_STYLES: Record<string, { color: string; bg: string; dot: string }> = {
  'Very Easy': { color: 'text-[#00a859]', bg: 'bg-[#00a859]/10', dot: 'bg-[#00a859]' },
  'Easy': { color: 'text-[#34d399]', bg: 'bg-[#34d399]/10', dot: 'bg-[#34d399]' },
  'Medium': { color: 'text-[#f3a43a]', bg: 'bg-[#f3a43a]/10', dot: 'bg-[#f3a43a]' },
  'Hard': { color: 'text-[#f43f5e]', bg: 'bg-[#f43f5e]/10', dot: 'bg-[#f43f5e]' },
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
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#00a859]/20 border-t-[#00a859] rounded-full animate-spin" />
          <p className="text-[#9aa5bf] font-medium animate-pulse uppercase tracking-widest text-xs">Loading Challenge...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center border-[#263248] bg-[#121a2a]">
          <XCircle className="w-16 h-16 text-[#f43f5e] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#f3f6ff] mb-2">Challenge Missing</h2>
          <p className="text-[#9aa5bf] mb-6">The challenge you are looking for does not exist or has been removed.</p>
          <Button onClick={() => navigate('/challenges')} className="w-full">
            Return to Challenges
          </Button>
        </Card>
      </div>
    );
  }

  const categoryStyle = CATEGORY_STYLES[challenge.category] || CATEGORY_STYLES['Miscellaneous'];
  const difficulty = challenge.difficulty || 'Medium';
  const difficultyStyle = DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.Medium;
  const CategoryIcon = categoryStyle.icon;

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#d2d7e3] pb-24">
      {/* Hero Header */}
      <div 
        className="relative pt-12 pb-24 border-b border-[#263248] min-h-[400px] flex items-center transition-colors duration-500"
        style={categoryStyle.bgImage ? {
          backgroundImage: `linear-gradient(to right, rgba(13, 17, 23, 1) 0%, rgba(13, 17, 23, 0.85) 45%, rgba(13, 17, 23, 0.3) 100%), url(${categoryStyle.bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat'
        } : {}}
      >
        {/* Background Effects Fallback */}
        {!categoryStyle.bgImage && (
           <div className={`absolute inset-0 bg-gradient-to-b ${categoryStyle.gradient} opacity-50`} />
        )}

        <div className="max-w-7xl mx-auto px-4 md:px-8 w-full relative z-10">
          <button
            onClick={() => navigate('/challenges')}
            className="group flex items-center gap-2 text-[#9aa5bf] hover:text-[#9fef00] mb-8 transition-colors duration-300"
          >
            <div className="p-2 rounded-lg bg-[#263248]/50 border border-[#263248] group-hover:border-[#9fef00]/50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-semibold tracking-tight uppercase text-sm">Return to Grid</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {categoryStyle.customIcon ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-current opacity-90 shadow-lg">
                    <img src={categoryStyle.customIcon} alt="Icon" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`p-2 rounded-lg ${categoryStyle.bg} ${categoryStyle.color} border border-current opacity-70`}>
                    <CategoryIcon size={18} />
                  </div>
                )}
                <span className={`text-sm font-black uppercase tracking-widest ${categoryStyle.color}`}>
                  {challenge.category}
                </span>
                <div className="h-4 w-px bg-[#263248] mx-1" />
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${difficultyStyle.bg} border border-current opacity-80`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${difficultyStyle.dot}`} />
                  <span className={`text-[10px] font-black uppercase tracking-wider ${difficultyStyle.color}`}>
                    {difficulty}
                  </span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight text-[#f3f6ff] drop-shadow-lg leading-tight break-words">
                {challenge.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-[#9aa5bf] pt-4">
                <div className="flex items-center gap-2 bg-[#121a2a]/50 px-3 py-1.5 rounded-full border border-[#263248]">
                  <User size={14} className="text-[#60a5fa]" />
                  <span className="text-xs font-bold uppercase tracking-widest">Op By: <span className="text-[#f3f6ff]">{challenge.author}</span></span>
                </div>
                <div className="flex items-center gap-2 bg-[#121a2a]/50 px-3 py-1.5 rounded-full border border-[#263248]">
                  <Clock size={14} className="text-[#f3a43a]" />
                  <span className="text-xs font-bold uppercase tracking-widest">Duration: ~{challenge.estimatedTime || 30}m</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
              <div className="relative group">
                <div className="absolute -inset-4 bg-[#9fef00]/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-[#121a2a]/80 backdrop-blur-xl border border-[#263248] p-6 rounded-3xl flex flex-col items-center min-w-[140px] shadow-2xl">
                  <span className="text-4xl font-black text-[#9fef00] leading-none drop-shadow-[0_0_10px_rgba(159,239,0,0.3)]">
                    {challenge.currentPoints || challenge.points}
                  </span>
                  <span className="text-xs font-bold text-[#9aa5bf] uppercase tracking-widest mt-2">Bounty</span>
                </div>
              </div>
              {solved && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-4 py-1.5 bg-[#9fef00]/20 text-[#9fef00] border border-[#9fef00]/30 rounded-full text-xs font-black uppercase tracking-widest mt-2"
                >
                  <Award size={14} />
                  Pwned
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Description Section */}
            <Card className="p-8 bg-[#121a2a]/80 backdrop-blur-md border-[#263248] shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Book size={120} className={categoryStyle.color} />
              </div>

              <h2 className="text-xl font-bold text-[#f3f6ff] mb-6 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#9fef00] rounded-full" />
                Description
              </h2>

              <div className="relative z-10">
                <div className="text-[#d2d7e3] text-lg leading-relaxed font-medium whitespace-pre-wrap break-words bg-[#0d1117]/50 p-6 rounded-2xl border border-[#263248]/50">
                  {challenge.description}
                </div>
              </div>
            </Card>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Files */}
              {challenge.files && challenge.files.length > 0 && (
                <Card className="p-6 bg-[#121a2a]/80 border-[#263248]">
                  <h3 className="text-lg font-bold text-[#f3f6ff] mb-4 flex items-center gap-2">
                    <Download size={18} className="text-[#9aa5bf]" />
                    Attached Files
                  </h3>
                  <div className="space-y-3">
                    {challenge.files.map((file, index) => (
                      <a
                        key={index}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-[#0d1117]/80 rounded-xl border border-[#263248] hover:border-[#9fef00]/30 hover:bg-[#263248]/50 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fef00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1117]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#263248] group-hover:bg-[#9fef00]/20 group-hover:text-[#9fef00]">
                            <Book size={16} />
                          </div>
                          <span className="text-sm font-medium text-[#d2d7e3] truncate max-w-[150px]">{file.name}</span>
                        </div>
                        <Download size={14} className="text-[#9aa5bf] group-hover:text-[#9fef00]" />
                      </a>
                    ))}
                  </div>
                </Card>
              )}

              {/* Link */}
              {(challenge as any).challengeLink && (
                <Card className="p-6 bg-[#121a2a]/80 border-[#263248] flex flex-col h-full">
                  <h3 className="text-lg font-bold text-[#f3f6ff] mb-4 flex items-center gap-2">
                    <ExternalLink size={18} className="text-[#9aa5bf]" />
                    Environment
                  </h3>
                  <a
                    href={(challenge as any).challengeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto block p-5 bg-[#00a859]/10 hover:bg-[#00a859]/20 border border-[#00a859]/20 rounded-2xl transition-all group text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fef00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1117]"
                  >
                    <ExternalLink size={24} className="text-[#9fef00] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[#9fef00] font-bold block">Access Challenge Instance</span>
                    <span className="text-[10px] text-[#9fef00]/50 truncate block mt-1">{(challenge as any).challengeLink}</span>
                  </a>
                </Card>
              )}
            </div>

            {/* Writeup Section */}
            {challenge.writeup?.isUnlocked && (challenge.writeup.content || challenge.writeup.pdfFile) && (
              <Card className="p-8 bg-[#121a2a]/80 border-[#263248] border-l-4 border-l-[#00a859]">
                <h2 className="text-xl font-bold text-[#f3f6ff] mb-6 flex items-center gap-3">
                  <CheckCircle size={20} className="text-[#00a859]" />
                  Writeup
                </h2>
                <div className="space-y-6">
                  {challenge.writeup.pdfFile && (
                    <div className="p-6 bg-[#0d1117]/50 rounded-2xl border border-[#263248] flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                          <Download size={24} />
                        </div>
                        <div>
                          <p className="text-[#d2d7e3] font-bold">{challenge.writeup.pdfFile.name}</p>
                          <p className="text-[#9aa5bf] text-xs">PDF Document • {new Date(challenge.writeup.pdfFile.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => window.open(challenge.writeup!.pdfFile!.url, '_blank')}
                        className="bg-[#263248] hover:bg-[#263248]/80 text-white"
                      >
                        Source PDF
                      </Button>
                    </div>
                  )}
                  {challenge.writeup.content && (
                    <div className="prose prose-invert max-w-none text-[#d2d7e3] leading-relaxed font-normal bg-[#0d1117]/30 p-8 rounded-2xl border border-[#263248]/50 whitespace-pre-wrap">
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
            <Card className={`p-8 transition-all duration-500 ${solved ? 'bg-[#9fef00]/5 border-[#9fef00]/20' : 'bg-[#121a2a] border-[#263248] shadow-2xl shadow-[#9fef00]/5'}`}>
              <h2 className="text-xl font-bold text-[#f3f6ff] mb-6 flex items-center gap-2">
                <Target size={20} className={solved ? 'text-[#9fef00]' : 'text-[#9aa5bf]'} />
                Flag Submission
              </h2>

              {solved ? (
                <div className="space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-[#9fef00]/20 flex items-center justify-center border-2 border-[#9fef00]/30">
                    <CheckCircle className="w-10 h-10 text-[#9fef00]" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-white mb-1">Solved</p>
                    <p className="text-[#9aa5bf] text-sm">System integrity verified. Points awarded.</p>
                  </div>
                  <Button variant="outline" className="w-full border-[#263248]" onClick={() => navigate('/challenges')}>
                    Back to Terminal
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#9aa5bf] group-focus-within:text-[#9fef00] transition-colors">
                      <Zap size={18} />
                    </div>
                    <Input
                      type="text"
                      placeholder="khana{...}"
                      value={flag}
                      onChange={(e) => setFlag(e.target.value)}
                      className="w-full pl-12 py-4 bg-[#0d1117] border-[#263248] focus:border-[#9fef00]/50 rounded-2xl transition-all"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-[#007a42] hover:bg-[#006737] shadow-lg shadow-[#00a859]/20 h-auto rounded-2xl text-lg font-black"
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
                    className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'error' ? 'bg-[#f43f5e]/10 text-[#f43f5e] border border-[#f43f5e]/20' : 'bg-[#9fef00]/10 text-[#9fef00] border border-[#9fef00]/20'
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
              <Card className="p-8 bg-[#121a2a] border-[#263248]">
                <h2 className="text-xl font-bold text-[#f3f6ff] mb-6 flex items-center gap-2">
                  <HelpCircle size={20} className="text-[#9aa5bf]" />
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
                            ? 'bg-[#9fef00]/5 border-[#9fef00]/20'
                            : 'bg-[#0d1117] border-[#263248] hover:border-[#263248]/80'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              {isUnlocked ? <HelpCircle size={16} className="text-[#9fef00]" /> : <Lock size={16} className="text-[#9aa5bf]" />}
                              <span className={`text-xs font-black uppercase tracking-widest ${isUnlocked ? 'text-[#9fef00]' : 'text-[#9aa5bf]'}`}>
                                HINT {index + 1}
                              </span>
                            </div>
                            {!isUnlocked && (
                              <span className="text-xs font-black text-[#f3a43a] tracking-tighter">
                                COST: {hint.cost} UNIT
                              </span>
                            )}
                          </div>

                          {isUnlocked ? (
                            <p className="text-[#d2d7e3] text-sm italic font-medium leading-relaxed">{hint.text}</p>
                          ) : (
                            <Button
                              onClick={() => handlePurchaseHint(index, hint.cost)}
                              disabled={!currentUser || currentUser.points < hint.cost}
                              className="w-full bg-[#263248] hover:bg-[#263248]/80 h-9 rounded-xl text-[10px] font-black tracking-widest uppercase"
                              variant="secondary"
                            >
                              UNLOCK HINT
                            </Button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </Card>
            )}

            {/* Solvers Card */}
            <Card className="p-8 bg-[#121a2a] border-[#263248]">
              <h2 className="text-xl font-bold text-[#f3f6ff] mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-[#9aa5bf]" />
                  High Scores
                </div>
                <span className="text-xs font-black text-[#9fef00]">{solvers.length} Solved</span>
              </h2>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {solvers.length > 0 ? (
                  solvers.map((solver, index) => (
                    <div
                      key={solver.odId || index}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${solver.isFirstBlood
                        ? 'bg-[#f3a43a]/10 border border-[#f3a43a]/30'
                        : 'bg-[#0d1117]/50 border border-[#263248]/50'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${solver.isFirstBlood
                        ? 'bg-[#f3a43a] text-amber-950'
                        : 'bg-[#263248] text-[#9aa5bf]'
                        }`}>
                        {solver.isFirstBlood ? <Crown size={20} /> : <span className="text-xs font-black tracking-tighter">{index + 1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black truncate text-sm tracking-tight ${solver.isFirstBlood ? 'text-[#f3a43a]' : 'text-[#d2d7e3]'
                          }`}>
                          {solver.fullName || solver.username}
                        </p>
                        <p className="text-[10px] text-[#9aa5bf] font-bold uppercase tracking-tighter">
                          {solver.isFirstBlood && <span className="text-[#f3a43a] mr-2">🩸 ALPHA SOLVE</span>}
                          {new Date(solver.solvedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#0d1117] flex items-center justify-center border border-[#263248] opacity-50">
                      <Target size={24} className="text-[#9aa5bf]" />
                    </div>
                    <p className="text-[#9aa5bf] font-bold mb-1">No Solutions Yet</p>
                    <p className="text-[#64748b] text-xs font-medium">Be the first to breach this challenge.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} className="max-w-md">
        <div className="relative p-10 text-center bg-[#0d1117] border border-[#9fef00]/30 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(159,239,0,0.2),transparent)]" />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 mx-auto mb-8 rounded-full bg-[#9fef00]/20 flex items-center justify-center border-2 border-[#9fef00]/30 shadow-[0_0_50px_rgba(159,239,0,0.3)]">
            <CheckCircle className="w-14 h-14 text-[#9fef00]" />
          </motion.div>
          <h2 className="text-3xl font-black text-[#f3f6ff] mb-4 tracking-tighter uppercase italic">Challenge Solved</h2>
          <p className="text-[#9aa5bf] font-medium mb-8 leading-relaxed">Excellent work agent. Your credentials have been verified and points have been allocated to your profile.</p>
          <Button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-[#007a42] hover:bg-[#006737] text-[#f3f6ff] font-black rounded-2xl h-auto">
            ACKNOWLEDGE
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showHintModal} onClose={() => setShowHintModal(false)} className="max-w-sm">
        <div className="p-8 bg-[#0d1117] border border-[#263248] rounded-3xl">
          <h3 className="text-xl font-black text-[#f3f6ff] mb-4 tracking-tight uppercase italic flex items-center gap-2">
            <Lock className="text-[#f3a43a]" />
            Unlock Hint?
          </h3>
          {selectedHint && (
            <>
              <p className="text-[#9aa5bf] font-medium mb-8 leading-relaxed text-sm">
                Unlocking <strong className="text-[#f3f6ff]">Hint {selectedHint.index + 1}</strong> will cost <strong className="text-[#f3a43a]">{selectedHint.cost} Units</strong>. This budget allocation is permanent.
              </p>
              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => setShowHintModal(false)} className="flex-1 bg-[#121a2a] border-[#263248] rounded-xl h-12">
                  ABORT
                </Button>
                <Button onClick={confirmPurchaseHint} className="flex-1 bg-[#f3a43a] hover:bg-[#f3a43a]/80 text-black font-black rounded-xl h-12">
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
