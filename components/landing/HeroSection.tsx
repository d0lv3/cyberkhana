import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLang } from "./LangContext";
import HeroPodium from "./HeroPodium";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12 + 0.15,
      duration: 0.7,
      ease: "easeInOut",
    },
  }),
};

/**
 * The platform's hero.
 *
 * Built to be a different shape from the umbrella site's, not merely different
 * copy. That one is a centred stack beneath a mark assembling itself out of
 * characters, and for a page whose job is to introduce two products, centred is
 * right — it favours neither of them.
 *
 * This page sells one product and has somewhere specific to send you, so it is
 * asymmetric: everything to read runs down the left against a hard edge, and
 * the right is given over to a board that is quietly playing. The wordmark sits
 * at the head of that column rather than centred above everything, which is
 * what stops the two pages reading as the same page twice.
 *
 * The typewriter went with the old layout. It exists on the umbrella site, and
 * a second piece of looping text beside a board that is already moving was two
 * things asking for the same glance.
 */
const HeroSection = () => {
  const { t } = useLang();

  return (
    <section className="relative app-hero-min w-full overflow-hidden bg-canvas">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(159,239,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(159,239,0,0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Weighted towards the side the board sits on, so the two halves do not
          read as equal columns of the same thing. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(45% 50% at 78% 30%, rgba(0,168,89,0.14), transparent 70%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-canvas/40 to-canvas" />

      <div className="relative z-10 flex min-h-[inherit] items-center px-5 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-28">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          {/* ── the half you read ── */}
          <div className="text-start">
            {/* Mark and headline as one unit, divided by a rule. The square mark
                rather than the wordmark: set beside type this size, a wordmark
                would be a second piece of lettering competing with the sentence
                next to it. The rule stretches to whatever height the headline
                wraps to, so it reads as a division between two things rather
                than a fixed tick sitting near them. */}
            <motion.div
              custom={0}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="flex items-stretch gap-4 sm:gap-5"
            >
              <img
                src="/assets/brand/cyberkhana-mark-sq.png"
                alt="CyberKhana"
                className="h-12 w-auto flex-shrink-0 self-center sm:h-16"
              />
              <span aria-hidden className="w-px flex-shrink-0 bg-edge" />
              <h1
                className="text-2xl font-extrabold leading-tight text-fg sm:text-3xl lg:text-4xl"
                style={{ fontWeight: 800 }}
              >
                {t("hero.headline")}
              </h1>
            </motion.div>

            <motion.p
              custom={1}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="mt-6 max-w-xl text-sm leading-relaxed text-muted sm:text-base"
            >
              {t("hero.model")}
            </motion.p>

            <motion.div
              custom={2}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <Link
                to="/register"
                // A transparent border of its own, or this sits two pixels
                // shorter than the outlined button beside it.
                className="inline-flex min-h-tap w-full items-center justify-center gap-2 rounded-lg border border-transparent bg-brand-neon px-7 py-3.5 font-bold text-canvas transition-all hover:bg-[#b8ff3a] sm:w-auto"
              >
                {t("hero.cta.enter")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
              <Link
                to="/login"
                className="inline-flex min-h-tap w-full items-center justify-center rounded-lg border border-edge px-7 py-3.5 font-bold text-fg-soft transition-all hover:border-brand hover:text-brand sm:w-auto"
              >
                {t("hero.cta.login")}
              </Link>
            </motion.div>

            <motion.p
              custom={3}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="mt-6 text-xs text-faint"
            >
              {t("hero.proof")}
            </motion.p>
          </div>

          {/* ── the half that moves ── */}
          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="w-full"
          >
            <HeroPodium />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
