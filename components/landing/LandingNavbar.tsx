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
          ? 'bg-base/90 backdrop-blur-xl border-b border-edge/50'
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
            className="text-fg-soft hover:text-brand transition-colors font-medium"
          >
            {t('nav.login')}
          </Link>
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="text-xs font-bold px-3 py-1.5 rounded border border-edge text-muted hover:text-brand-neon hover:border-brand-neon transition-all"
          >
            {lang === 'en' ? 'AR' : 'EN'}
          </button>
          <Link
            to="/register"
            className="bg-brand-neon text-base font-bold px-5 py-2 rounded-lg hover:bg-[#b8ff3a] transition-all text-sm"
          >
            {t('nav.getStarted')}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
