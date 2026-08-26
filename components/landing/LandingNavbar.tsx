import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PlatformLink from './PlatformLink';
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
      className={`fixed top-0 w-full z-50 pt-safe-t transition-all duration-300 ${
        scrolled
          ? 'bg-canvas/90 backdrop-blur-xl border-b border-edge/50'
          : 'bg-transparent'
      }`}
    >
      {/* A wordmark plus three actions measured ~294px of content at 375px,
          leaving almost nothing for gutters and gaps — the row ran edge to
          edge. On a phone the bar goes shorter, the gutter narrows and the
          wordmark steps down so the row has room to breathe. */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* The wordmark is ~137px wide and left 11px of slack for three
            actions on a 375px screen. The square mark carries the same
            identity in a quarter of the width; the wordmark returns at sm. */}
        <Link to="/" aria-label="CyberKhana" className="flex-shrink-0 inline-flex items-center min-h-tap min-w-tap sm:min-w-0">
          <img
            src="/assets/brand/cyberkhana-mark-sq.png"
            alt="CyberKhana"
            className="h-8 w-auto sm:hidden"
          />
          <img
            src="/assets/brand/cyberkhana-text-logo.png"
            alt="CyberKhana"
            className="hidden sm:block h-8 w-auto"
          />
        </Link>

        <div className="flex items-center gap-1 sm:gap-4">
          {/* Was a bare text link measuring 40x24 — under any usable target. */}
          <PlatformLink
            to="/login"
            className="inline-flex items-center px-2 sm:px-0 min-h-tap text-sm sm:text-base text-fg-soft hover:text-brand transition-colors font-medium select-none"
          >
            {t('nav.login')}
          </PlatformLink>

          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            aria-label={lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
            className="inline-flex items-center justify-center min-h-tap min-w-tap px-2 text-xs font-bold rounded border border-edge text-muted hover:text-brand-neon hover:border-brand-neon transition-all select-none"
          >
            {lang === 'en' ? 'AR' : 'EN'}
          </button>

          <PlatformLink
            to="/register"
            className="inline-flex items-center justify-center min-h-tap bg-brand-neon text-canvas font-bold px-3 sm:px-5 rounded-lg hover:bg-[#b8ff3a] transition-all text-sm whitespace-nowrap select-none"
          >
            {t('nav.getStarted')}
          </PlatformLink>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
