import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ExternalLink, Flag } from "lucide-react";
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

/** Animated rotating gradient-border wrapper (React-Bits "Star Border" style). */
const GradientBorder: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="relative inline-flex overflow-hidden rounded-xl bg-[#263248] p-[1.5px]">
    <motion.span
      aria-hidden
      className="absolute left-1/2 top-1/2 h-[280%] w-[280%] -translate-x-1/2 -translate-y-1/2"
      style={{
        background:
          "conic-gradient(from 0deg, transparent 0deg, #00a859 50deg, #9fef00 95deg, transparent 150deg, transparent 360deg)",
      }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
    />
    <span className="relative z-[1] inline-flex h-14 items-center justify-center gap-2.5 rounded-[10.5px] bg-[#0b0f16] px-7">
      {children}
    </span>
  </span>
);

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
              aria-label="CyberKhana Main — register or sign in"
              className="inline-flex rounded-xl transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_26px_rgba(0,168,89,0.4)]"
            >
              <GradientBorder>
                <Flag className="w-5 h-5 text-[#9fef00]" />
                <span className="font-bold text-[#f3f6ff]">CyberKhana Main</span>
              </GradientBorder>
            </Link>
            <a
              href="https://academy.cyberkhana.tech"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="CyberKhana Academy (opens in a new tab)"
              className="inline-flex rounded-xl transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_26px_rgba(0,168,89,0.4)]"
            >
              <GradientBorder>
                <BrandLogo variant="academy" alt="CyberKhana Academy" className="h-7 w-auto object-contain" />
                <ExternalLink className="w-4 h-4 text-[#9aa5bf]" />
              </GradientBorder>
            </a>
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
