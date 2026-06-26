import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
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
  const { t, isArabic } = useLang();

  return (
    <section className="relative h-screen w-full bg-[#0d1117] overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `linear-gradient(rgba(159,239,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(159,239,0,0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d1117]/50 to-[#0d1117]" />

      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="max-w-4xl mx-auto px-6 w-full text-center">
          {/* Logo */}
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <BrandLogo variant="mark" loading="eager" className="h-20 md:h-28 w-auto mx-auto mb-8" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-[#f3f6ff] leading-tight"
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
            className="mt-6 text-lg md:text-xl text-[#9aa5bf] max-w-2xl mx-auto"          >
            {isArabic
              ? 'تعلّم. تدرّب. تنافس. — منصتك لتطوير مهارات الأمن السيبراني.'
              : 'Learn. Practice. Compete. — Your platform to sharpen real cybersecurity skills.'}
          </motion.p>

          {/* Typewriter */}
          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mt-4 text-base md:text-lg text-[#6e7a94] h-8"          >
            <span>{typedText}</span>
            <span className="inline-block w-[2px] h-5 bg-[#9fef00] ml-1 align-middle animate-pulse" />
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            custom={4}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mt-10 flex flex-wrap justify-center gap-4"
          >
            <Link
              to="/register"
              className="bg-[#9fef00] text-[#0d1117] font-bold px-8 py-4 rounded-lg hover:bg-[#b8ff3a] transition-all"
            >
              {t('hero.cta.enter')}
            </Link>
            <Link
              to="/login"
              className="border border-[#263248] text-[#d2d7e3] px-8 py-4 rounded-lg hover:border-[#00a859] hover:text-[#00a859] transition-all"
            >
              {t('hero.cta.login')}
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowDown className="h-6 w-6 text-[#9aa5bf]" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
