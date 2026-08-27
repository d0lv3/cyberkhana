import { motion } from 'framer-motion';
import { GraduationCap, Mail } from 'lucide-react';

import { useLang } from './LangContext';

/**
 * Where ambassador applications go.
 *
 * A mailbox rather than a form, deliberately for now: there is nothing to set
 * up, and the first applications are worth reading as letters rather than rows
 * in a spreadsheet. Swap this one constant for a form URL when the volume makes
 * an inbox the wrong place for them.
 *
 * It is a personal address on a public page, which is a fair trade while the
 * numbers are small — but it is public, so it will be scraped, and it names a
 * person rather than the project. A forwarding address on the domain would fix
 * both without changing anything else here.
 */
const APPLY_EMAIL = 'abod4bus@gmail.com';

/**
 * The ask, at the foot of the page.
 *
 * Everything above explains a model that only works if someone volunteers to
 * run it, so the page ends by asking for exactly that. It is last because the
 * question only lands once the reader knows what they would be taking on.
 */
const AmbassadorCTA = () => {
  const { t, isArabic } = useLang();

  const subject = encodeURIComponent(
    isArabic ? 'طلب سفير — سايبر خانة' : 'Ambassador application — CyberKhana'
  );
  const body = encodeURIComponent(
    isArabic
      ? 'الجامعة:\nالسنة الدراسية:\nلماذا أريد قيادة حرمي الجامعي:\n'
      : 'University:\nYear of study:\nWhy I want to run my campus:\n'
  );

  return (
    <section className="relative overflow-hidden bg-canvas py-16 sm:py-24 md:py-28">
      {/* A wash rather than a photograph: this section is a question, and the
          eye should land on the question rather than on the picture. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 55% at 50% 0%, rgba(0,168,89,0.16), transparent 70%)',
        }}
      />

      {/* The cap as a watermark. White at three percent rather than the brand
          green: green here would compete with the button, which is the one
          thing in this section that has to be found. Big enough to read as a
          shape behind the words and faint enough never to be read as content —
          and clipped by the section, so it does not add height. */}
      <GraduationCap
        aria-hidden
        strokeWidth={1}
        className="pointer-events-none absolute -bottom-16 start-[-3rem] h-[22rem] w-[22rem] text-white/[0.03] sm:start-[-2rem] sm:h-[26rem] sm:w-[26rem]"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto max-w-3xl px-6 text-center"
      >
        <span className="text-[11px] font-bold text-brand ltr:uppercase ltr:tracking-[0.16em]">
          {t('amb.eyebrow')}
        </span>

        <h2
          className="mt-4 text-2xl text-fg sm:text-3xl md:text-4xl"
          style={{ fontWeight: 800 }}
        >
          {t('amb.heading')}
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          {t('amb.body')}
        </p>

        <a
          href={`mailto:${APPLY_EMAIL}?subject=${subject}&body=${body}`}
          className="mt-8 inline-flex min-h-tap items-center justify-center gap-2 rounded-lg bg-brand-neon px-7 py-3.5 font-bold text-canvas transition-all hover:bg-[#b8ff3a]"
        >
          <Mail className="h-[18px] w-[18px]" aria-hidden />
          {t('amb.cta')}
        </a>

        <p className="mt-4 text-xs text-faint">{t('amb.note')}</p>
      </motion.div>
    </section>
  );
};

export default AmbassadorCTA;
