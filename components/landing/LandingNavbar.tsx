import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from './LangContext';

const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { lang, setLang, t } = useLang();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0d1117]/90 backdrop-blur-xl border-b border-[#263248]/50'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/">
          <img
            src="/assets/brand/cyberkhana-text-logo.png"
            alt="CyberKhana"
            className="h-8 w-auto"
          />
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-[#d2d7e3] hover:text-[#00a859] transition-colors font-medium"
          >
            {t('nav.login')}
          </Link>
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="text-xs font-bold px-3 py-1.5 rounded border border-[#263248] text-[#9aa5bf] hover:text-[#9fef00] hover:border-[#9fef00] transition-all"
          >
            {lang === 'en' ? 'AR' : 'EN'}
          </button>
          <Link
            to="/register"
            className="bg-[#9fef00] text-[#0d1117] font-bold px-5 py-2 rounded-lg hover:bg-[#b8ff3a] transition-all text-sm"
          >
            {t('nav.getStarted')}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
