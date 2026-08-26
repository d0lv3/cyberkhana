import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useLang } from "./LangContext";
import BrandLogo from "../ui/BrandLogo";

const ACADEMY_URL = "https://academy.cyberkhana.tech";

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

/** Spotlight-border shell — mirrors the Academy login card container: a dark
 *  rounded panel with a green radial glow that tracks the cursor. */
const SpotlightFrame: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  const [spot, setSpot] = useState({ x: 50, y: 50, active: false });
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setSpot({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
      active: true,
    });
  };
  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={() => setSpot((s) => ({ ...s, active: false }))}
      className={`relative rounded-2xl p-px transition-all duration-300 ${className}`}
      style={{
        background: spot.active
          ? `radial-gradient(340px circle at ${spot.x}% ${spot.y}%, rgba(159,239,0,0.6), rgba(38,50,72,0.65) 70%)`
          : "rgba(38,50,72,0.65)",
      }}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[15px] bg-[#0f1624]/95 backdrop-blur-sm">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: spot.active ? 1 : 0,
            background: `radial-gradient(420px circle at ${spot.x}% ${spot.y}%, rgba(0,168,89,0.14), transparent 65%)`,
          }}
        />
        {children}
      </div>
    </div>
  );
};

interface ProductCardProps {
  /** Wordmark for the product — both ship as white-on-transparent. */
  logo: React.ReactNode;
  name: string;
  url: string;
  body: string;
  cta: string;
  /** Present for the Academy, which lives on its own subdomain. */
  href?: string;
  /** Present for the platform, which is a route in this app. */
  to?: string;
  ctaClassName: string;
}

/** One of the two product panels under the headline. Sized by a minimum rather
 *  than aspect-square: at the narrow end of the two-up range the card is 473px
 *  across and this much copy needs 544, so a hard 1:1 box would cut three lines
 *  off the bottom in both languages. The minimum keeps the square silhouette —
 *  564x546 at 1440 — and lets a long translation push the pair taller instead
 *  of clipping it. */
const ProductCard: React.FC<ProductCardProps> = ({
  logo,
  name,
  url,
  body,
  cta,
  href,
  to,
  ctaClassName,
}) => {
  const ctaClasses = `mt-6 inline-flex min-h-tap items-center justify-center gap-2 self-start rounded-lg px-6 py-3 font-bold transition-all ${ctaClassName}`;

  return (
    <SpotlightFrame className="h-full">
      <div className="relative z-[1] flex h-full flex-col p-6 sm:p-8 lg:min-h-[34rem]">
        <div className="flex h-8 items-center sm:h-9">{logo}</div>

        <h3 className="mt-5 text-lg font-extrabold text-fg sm:text-xl" style={{ fontWeight: 800 }}>
          {name}
        </h3>
        <span className="mt-1 font-mono text-xs text-brand-neon/80" dir="ltr">
          {url}
        </span>

        <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{body}</p>

        {to ? (
          <Link to={to} className={ctaClasses}>
            {cta}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Link>
        ) : (
          <a href={href} target="_blank" rel="noopener noreferrer" className={ctaClasses}>
            {cta}
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        )}
      </div>
    </SpotlightFrame>
  );
};

const HeroSection: React.FC = () => {
  const typedText = useTypewriter(TYPEWRITER_WORDS);
  const { t, isArabic } = useLang();

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
              className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-faint h-8"          >
              <span>{typedText}</span>
              <span className="inline-block w-[2px] h-5 bg-brand-neon ml-1 align-middle animate-pulse" />
            </motion.div>
          </div>

          {/* The two products, each with its own way in. One column until lg:
              at md these sit around 340px wide, which is too narrow for this
              much copy — the pair would stretch far taller than it is wide. */}
          <motion.div
            custom={4}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mt-10 grid grid-cols-1 gap-5 text-start sm:mt-12 lg:grid-cols-2 lg:gap-6"
          >
            <ProductCard
              logo={<BrandLogo variant="text" alt="CyberKhana" className="h-full w-auto object-contain" />}
              name={t('product.platform.name')}
              url="cyberkhana.tech"
              body={t('product.platform.body')}
              cta={t('product.platform.cta')}
              to="/register"
              ctaClassName="bg-brand-neon text-canvas hover:bg-[#b8ff3a]"
            />
            <ProductCard
              logo={<BrandLogo variant="academy" alt="CyberKhana Academy" className="h-full w-auto object-contain" />}
              name={t('product.academy.name')}
              url="academy.cyberkhana.tech"
              body={t('product.academy.body')}
              cta={t('product.academy.cta')}
              href={ACADEMY_URL}
              ctaClassName="bg-brand text-fg hover:bg-[#00c268]"
            />
          </motion.div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ArrowDown className="h-6 w-6 text-muted" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
