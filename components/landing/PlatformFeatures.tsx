import { motion } from 'framer-motion';
import { useLang } from './LangContext';

interface FeatureCard {
  color: string;
  image: string;
}

const features: FeatureCard[] = [
  {
    color: '#00a859',
    image: '/assets/landing/hero-hacker.jpg',
  },
  {
    color: '#f3a43a',
    image: '/assets/landing/features-arena.jpg',
  },
  {
    color: '#60a5fa',
    image: '/assets/landing/story-academy.jpg',
  },
  {
    color: '#a855f7',
    image: '/assets/landing/story-platform.jpg',
  },
];

const featureKeys = [
  { title: 'features.ctf.title', desc: 'features.ctf.desc' },
  { title: 'features.comp.title', desc: 'features.comp.desc' },
  { title: 'features.academy.title', desc: 'features.academy.desc' },
  { title: 'features.leaderboard.title', desc: 'features.leaderboard.desc' },
];

const hexToRgb = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
};

const PlatformFeatures = () => {
  const { t, isArabic } = useLang();

  return (
    <section className="py-24 md:py-32 bg-[#0d1117]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center">
          <h2
            className="text-4xl md:text-5xl text-[#f3f6ff] font-extrabold"
            style={{ fontWeight: 800 }}
          >
            {t('features.heading')}
          </h2>
          <p className="text-[#9aa5bf] text-lg mt-3">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
          {features.map((feature, index) => {
            const keys = featureKeys[index];
            const title = t(keys.title);
            const description = t(keys.desc);

            return (
              <motion.div
                key={keys.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative overflow-hidden rounded-2xl border border-[#263248] group cursor-pointer transition-all duration-100"
                style={{
                  ['--card-color' as string]: feature.color,
                  ['--card-rgb' as string]: hexToRgb(feature.color),
                }}
                whileHover={{
                  borderColor: feature.color,
                  boxShadow: `0 0 30px rgba(${hexToRgb(feature.color)},0.15)`,
                }}
              >
                <img
                  src={feature.image}
                  alt={title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-150"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/80 to-transparent" />
                <div className="relative z-10 p-8">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: feature.color }}
                  />
                  <h3
                    className="text-2xl font-bold text-[#f3f6ff] mt-4"
                    style={{ fontWeight: 800 }}
                  >
                    {title}
                  </h3>
                  <p
                    className="text-[#9aa5bf] mt-2 text-sm leading-relaxed"
                    style={undefined}
                  >
                    {description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PlatformFeatures;
