import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import BrandLogo from '../ui/BrandLogo';
import type { LegalSection } from '../../data/legalTypes';

interface LegalDocumentProps {
  /** Sets document.title, suffixed with the brand. */
  title: string;
  subtitle: string;
  updated: string;
  version: string;
  /** The warning panel above the sections. */
  callout: { heading: string; body: React.ReactNode };
  sections: LegalSection[];
}

/**
 * Page chrome and section rendering shared by the Terms and the Ambassador
 * Agreement. Both documents have identical structure — numbered sections with
 * paragraphs, bullets and an occasional emphasised one — so only the content
 * and the callout differ.
 */

const Section: React.FC<{ s: LegalSection }> = ({ s }) => (
  <section
    id={`section-${s.n}`}
    className={
      s.emphasis
        ? 'scroll-mt-24 rounded-xl border border-amber/30 bg-amber/5 p-5 sm:p-6'
        : 'scroll-mt-24'
    }
  >
    <h2 className="flex items-start gap-3 text-lg sm:text-xl font-semibold text-fg">
      {s.emphasis && (
        <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber" aria-hidden="true" />
      )}
      <span>
        <span className="text-brand tabular-nums">{s.n}.</span> {s.h}
      </span>
    </h2>

    {s.body?.map((p, i) => (
      <p key={`b${i}`} className="mt-3 text-sm sm:text-[0.95rem] leading-relaxed text-fg-soft">
        {p}
      </p>
    ))}

    {s.list && (
      <ul className="mt-3 space-y-2">
        {s.list.map((li, i) => (
          <li
            key={`l${i}`}
            className="flex gap-3 text-sm sm:text-[0.95rem] leading-relaxed text-fg-soft"
          >
            <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>{li}</span>
          </li>
        ))}
      </ul>
    )}

    {s.after?.map((p, i) => (
      <p key={`a${i}`} className="mt-3 text-sm sm:text-[0.95rem] leading-relaxed text-fg-soft">
        {p}
      </p>
    ))}
  </section>
);

const LegalDocument: React.FC<LegalDocumentProps> = ({
  title,
  subtitle,
  updated,
  version,
  callout,
  sections,
}) => {
  useEffect(() => {
    document.title = `${title} · CyberKhana`;
  }, [title]);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-edge bg-panel/60 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md text-sm text-muted transition-colors hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
          <BrandLogo variant="text" alt="CyberKhana" className="h-7 w-auto object-contain" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-muted">
          {subtitle} · Last updated {updated}{' '}
          <span className="text-faint">(version {version})</span>
        </p>

        <div className="mt-8 rounded-xl border border-amber/30 bg-amber/5 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-amber">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            {callout.heading}
          </h2>
          {callout.body}
        </div>

        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <Section key={s.n} s={s} />
          ))}
        </div>

        <footer className="mt-14 border-t border-edge pt-6">
          <p className="text-sm text-muted">
            Questions?{' '}
            <a
              href="mailto:support@cyberkhana.tech"
              className="text-brand underline underline-offset-4 hover:text-brand-neon"
            >
              support@cyberkhana.tech
            </a>
          </p>
          <p className="mt-2 text-xs text-faint">CyberKhana · app.cyberkhana.tech</p>
        </footer>
      </main>
    </div>
  );
};

export default LegalDocument;

/**
 * Scrolls to a numbered section.
 *
 * A plain href="#section-6" cannot be used: the app is on a HashRouter, so
 * writing to the hash navigates the router rather than the page, and such a
 * link would blow away the route the reader is on.
 */
export const scrollToSection = (n: string) =>
  document.getElementById(`section-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
