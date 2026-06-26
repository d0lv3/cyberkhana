import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useLang } from './LangContext';


function CTABlock() {
  const { t } = useLang();

  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <img
        src="/assets/landing/cta-arena-gate.jpg"
        alt=""
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-[#0d1117]/80" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative z-10 text-center px-6"
      >
        <h2
          className="text-3xl md:text-5xl text-[#f3f6ff]"
          style={{
            fontWeight: 800,
          }}
        >
          {t('cta.heading')}
        </h2>
        <p className="text-[#9aa5bf] text-lg mt-4">
          {t('cta.subtitle')}
        </p>
        <div className="flex gap-4 mt-8 justify-center flex-wrap">
          <Link
            to="/register"
            className="bg-[#9fef00] text-[#0d1117] font-bold px-8 py-4 rounded-lg hover:bg-[#b8ff3a] transition-all text-lg cursor-pointer"
          >
            {t('cta.getStarted')}
          </Link>
          <Link
            to="/login"
            className="border border-[#263248] text-[#d2d7e3] px-8 py-4 rounded-lg hover:border-[#00a859] hover:text-[#00a859] transition-all text-lg cursor-pointer"
          >
            {t('cta.signIn')}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  const { t } = useLang();

  return (
    <footer className="bg-[#0a0f18] border-t border-[#263248]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <img
            src="/assets/brand/cyberkhana-text-logo.png"
            alt="CyberKhana"
            loading="lazy"
            className="h-8 w-auto"
          />
        </div>

        <div className="border-t border-[#263248]/50 my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[#6e7a94] text-xs">
          <span>{t('footer.founded')}</span>
          <span className="inline-flex items-center gap-1.5">
            {t('footer.builtIn')}
            <img src="/assets/brand/flag-iraq.webp" alt="Iraq" className="h-3.5 w-auto inline-block" />
          </span>
          <span>{t('footer.copyright')}</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingFooter() {
  return (
    <>
      <CTABlock />
      <Footer />
    </>
  );
}
