import { motion } from 'framer-motion';
import { GraduationCap, PenTool, Users, Trophy } from 'lucide-react';

import { useLang } from './LangContext';

const STEPS = [
  { key: 'step1', Icon: GraduationCap },
  { key: 'step2', Icon: PenTool },
  { key: 'step3', Icon: Users },
  { key: 'step4', Icon: Trophy },
] as const;

/**
 * The model, walked through.
 *
 * One ambassador per campus authoring their own challenges is not how anyone
 * expects a CTF platform to work, and the hero can only afford a sentence of
 * it. Four numbered steps carry the rest: what the ambassador is given, what
 * they build, the shape of the week, and where the scores end up.
 *
 * Numbered rather than a feature grid, because the point is the order — each
 * step only makes sense once the one before it has happened.
 */
const HowItWorks = () => {
  const { t } = useLang();

  return (
    <section className="bg-canvas-alt py-16 sm:py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2
            className="text-2xl text-fg sm:text-3xl md:text-4xl"
            style={{ fontWeight: 800 }}
          >
            {t('how.heading')}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted sm:text-base">
            {t('how.subtitle')}
          </p>
        </motion.div>

        <ol className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map(({ key, Icon }, i) => (
            <motion.li
              key={key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative flex h-full flex-col rounded-2xl border border-edge bg-panel p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                {/* The step number, kept quiet. It carries the order without
                    competing with the heading beneath it. */}
                <span
                  className="font-mono text-3xl font-bold leading-none text-edge-light"
                  aria-hidden
                >
                  {i + 1}
                </span>
              </div>

              <h3 className="mt-5 text-base font-extrabold text-fg" style={{ fontWeight: 800 }}>
                {t(`how.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t(`how.${key}.body`)}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default HowItWorks;
