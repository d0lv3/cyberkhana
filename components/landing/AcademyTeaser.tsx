import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { useLang } from './LangContext';

const bulletKeys = [
  'academy.bullet1',
  'academy.bullet2',
  'academy.bullet3',
  'academy.bullet4',
  'academy.bullet5',
];

const AcademyTeaser = () => {
  const { t } = useLang();


  return (
    <section className="py-24 md:py-32 bg-[#0d1117]">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12 md:gap-16">
        <motion.div
          className="md:w-1/2"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <img
            src="/assets/brand/cyberkhana-academy.png"
            alt="CyberKhana Academy"
            className="h-12 w-auto mb-6"
          />
          <h2
            className="text-3xl md:text-4xl text-[#f3f6ff] font-extrabold"
            style={{ fontWeight: 800 }}
          >
            {t('academy.heading')}
          </h2>

          <ul className="mt-8 space-y-4">
            {bulletKeys.map((key, index) => (
              <motion.li
                key={key}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00a859]/20 flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5 text-[#00a859]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span
                  className="text-[#f3f6ff] text-sm"
                  style={undefined}
                >
                  {t(key)}
                </span>
              </motion.li>
            ))}
          </ul>

          <p
            className="text-2xl md:text-3xl font-bold text-[#9fef00] mt-8"
            style={{
              textShadow: '0 0 20px rgba(159,239,0,0.3)',
            }}
          >
            {t('academy.arabicCallout')}
          </p>

          <Link
            to="/register"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-[#9fef00] px-6 py-3 font-bold text-[#0d1117] transition-all hover:bg-[#b8ff3a]"
          >
            {t('academy.cta')}
          </Link>

        </motion.div>

        <motion.div
          className="md:w-1/2 hidden md:flex"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <img
            src="/assets/landing/story-academy.jpg"
            alt="CyberKhana Academy Preview"
            loading="lazy"
            className="rounded-2xl shadow-2xl border border-[#263248] w-full"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default AcademyTeaser;
