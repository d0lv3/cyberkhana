import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLang } from "./LangContext";
import BrandLogo from "../ui/BrandLogo";

const TYPEWRITER_WORDS = [
  "Capture The Flag",
  "Academy",
  "Competitions",
  "Leaderboards",
];

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2 + 0.3,
      duration: 0.8,
      ease: "easeInOut",
    },
  }),
};

function useTypewriter(words: readonly string[], typingSpeed = 100, deletingSpeed = 60, pauseDuration = 1800) {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setText(currentWord.slice(0, text.length + 1));
          if (text.length + 1 === currentWord.length) {
            setTimeout(() => setIsDeleting(true), pauseDuration);
            return;
          }
        } else {
          setText(currentWord.slice(0, text.length - 1));
          if (text.length - 1 === 0) {
            setIsDeleting(false);
            setWordIndex((prev) => (prev + 1) % words.length);
          }
        }
      },
      isDeleting ? deletingSpeed : typingSpeed
    );

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseDuration]);

  return text;
}

const HeroSection: React.FC = () => {
  const typedText = useTypewriter(TYPEWRITER_WORDS);
  const { t } = useLang();

  // app-hero-min, not app-hero: a fixed 100svh box with overflow-hidden was
  // clipping its own CTAs on any short viewport — in landscape both buttons sat
  // past the cut and were unreachable. As a minimum height the section still
  // fills a tall screen but grows rather than hiding content.
  return (
    <section className="relative app-hero-min w-full bg-canvas overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `linear-gradient(rgba(159,239,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(159,239,0,0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-canvas/50 to-canvas" />

      {/* Top padding clears the fixed navbar, which the centred content used to
          sit directly underneath — the mark was tucked behind it at 375px. */}
      <div className="relative z-10 flex min-h-[inherit] items-center justify-center px-5 sm:px-6 pt-24 pb-20 sm:pt-28 sm:pb-24">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mx-auto w-full max-w-4xl text-center">
            {/* Logo */}
            <motion.div
              custom={0}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
            >
              <BrandLogo variant="mark" loading="eager" className="h-14 sm:h-20 md:h-28 w-auto mx-auto mb-5 sm:mb-8" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              custom={1}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-fg leading-tight"
              style={{ fontWeight: 800 }}
            >
              {t('hero.headline')}
            </motion.h1>

            {/* Slogan */}
            <motion.p
              custom={2}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-muted max-w-2xl mx-auto"          >
              {t('hero.model')}
            </motion.p>

            {/* Typewriter */}
            <motion.div
              custom={3}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-faint h-8"          >
              <span>{typedText}</span>
              <span className="inline-block w-[2px] h-5 bg-brand-neon ml-1 align-middle animate-pulse" />
            </motion.div>
          </div>

          {/* This page is the platform's own front door, so the way on from
              here is into the platform — not out to a product picker. */}
          <motion.div
            custom={4}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mx-auto mt-8 flex w-full max-w-md flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4"
          >
            <Link
              to="/register"
              // A transparent border of its own: without one this button is two pixels
              // shorter than the outlined one beside it, which shows the moment they
              // stack.
              className="inline-flex min-h-tap w-full items-center justify-center gap-2 rounded-lg border border-transparent bg-brand-neon px-7 py-3.5 font-bold text-canvas transition-all hover:bg-[#b8ff3a] sm:w-auto"
            >
              {t('hero.cta.enter')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
            <Link
              to="/login"
              className="inline-flex min-h-tap w-full items-center justify-center rounded-lg border border-edge px-7 py-3.5 font-bold text-fg-soft transition-all hover:border-brand hover:text-brand sm:w-auto"
            >
              {t('hero.cta.login')}
            </Link>
          </motion.div>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;
