import { Instagram, Send, Linkedin, Globe, ExternalLink } from 'lucide-react';

import { useLang } from './LangContext';

const SOCIALS = [
  { label: 'Instagram', Icon: Instagram, href: 'https://www.instagram.com/cyberkhana' },
  { label: 'Telegram', Icon: Send, href: 'https://t.me/cyberkhana' },
  { label: 'LinkedIn', Icon: Linkedin, href: 'https://www.linkedin.com/company/cyberkhana/' },
];

const ACADEMY_URL = 'https://academy.cyberkhana.tech';

const socialBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-edge bg-white/[0.02] px-3.5 py-2 text-xs font-bold text-fg-soft transition-all hover:border-brand-neon/40 hover:bg-brand-neon/10 hover:text-brand-neon touch:min-h-tap';

/**
 * The connect bar, matching the one on the Academy's landing page.
 *
 * The same shape on all three sites, so somebody moving between them finds the
 * project's accounts in the same place each time. What differs is the product
 * button beside the socials, which points at whichever of the three you are not
 * currently looking at.
 *
 * Here that is the Academy. This page stopped introducing it when it became the
 * platform's own front door rather than the umbrella, which left the Academy
 * with no route off this page at all — this is that route.
 */
const ConnectBar = () => {
  const { t, isArabic } = useLang();

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-edge bg-panel px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 md:justify-start">
        <img
          src="/assets/brand/cyberkhana-text-logo.png"
          alt="CyberKhana"
          loading="lazy"
          className="h-9 w-auto max-w-[160px] flex-shrink-0 object-contain"
        />
        <span aria-hidden className="hidden h-9 w-px flex-shrink-0 bg-edge sm:block" />
        <p className="max-w-[340px] text-center text-sm leading-snug text-muted md:text-start">
          {t('footer.tagline')}
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap md:w-auto md:justify-end">
        <a
          href={ACADEMY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-3.5 py-2 text-xs font-bold text-brand transition-all hover:bg-brand/20 hover:shadow-[0_0_16px_rgba(0,168,89,0.25)] touch:min-h-tap sm:w-auto"
        >
          <Globe size={13} aria-hidden />
          {isArabic ? 'أكاديمية سايبر خانة' : 'CyberKhana Academy'}
          <ExternalLink size={11} aria-hidden />
        </a>

        {/* An even three-up on a phone, back in the row from sm. */}
        <div className="grid w-full grid-cols-3 gap-2 sm:contents">
          {SOCIALS.map(({ label, Icon, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={socialBtn}
            >
              <Icon size={13} aria-hidden />
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConnectBar;
