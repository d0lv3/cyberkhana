import { motion } from 'framer-motion';
import { useLang } from './LangContext';

interface Mascot {
  domainKey: string;
  tagKey: string;
  image: string;
  color: string;
}

const mascots: Mascot[] = [
  {
    domainKey: 'mascots.web',
    tagKey: 'mascots.web.tag',
    image: '/assets/icons/icon_web.png',
    color: '#60a5fa',
  },
  {
    domainKey: 'mascots.crypto',
    tagKey: 'mascots.crypto.tag',
    image: '/assets/icons/icon_crypto.png',
    color: '#f3a43a',
  },
  {
    domainKey: 'mascots.forensics',
    tagKey: 'mascots.forensics.tag',
    image: '/assets/icons/icon_forensics.png',
    color: '#34d399',
  },
  {
    domainKey: 'mascots.reversing',
    tagKey: 'mascots.reversing.tag',
    image: '/assets/icons/icon_reversing.png',
    color: '#a855f7',
  },
  {
    domainKey: 'mascots.pwn',
    tagKey: 'mascots.pwn.tag',
    image: '/assets/icons/icon_pwn.png',
    color: '#f43f5e',
  },
  {
    domainKey: 'mascots.all',
    tagKey: 'mascots.all.tag',
    image: '/assets/icons/icon_all.png',
    color: '#00a859',
  },
];

const hexToRgb = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
};

const MascotGallery = () => {
  const { t } = useLang();

  return (
    <section className="py-24 md:py-32 bg-[#0a0f18]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center">
          <h2
            className="text-4xl md:text-5xl text-[#f3f6ff] font-extrabold"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {t('mascots.heading')}
          </h2>
          <p className="text-[#9aa5bf] text-lg mt-3">
            {t('mascots.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-16">
          {mascots.map((mascot, index) => {
            const domain = t(mascot.domainKey);
            const tagline = t(mascot.tagKey);

            return (
              <motion.div
                key={mascot.domainKey}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -6 }}
                className="bg-[#121a2a] border border-[#263248] rounded-2xl overflow-hidden group transition-all duration-300"
                style={{
                  ['--mascot-color' as string]: mascot.color,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = mascot.color;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px rgba(${hexToRgb(mascot.color)},0.15)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#263248';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <div
                  className="h-1"
                  style={{ backgroundColor: mascot.color }}
                />
                <img
                  src={mascot.image}
                  alt={domain}
                  loading="lazy"
                  className="w-full h-48 md:h-56 object-contain p-4 bg-[#0a0f18]"
                />
                <div className="p-5">
                  <h3
                    className="text-lg font-bold text-[#f3f6ff]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {domain}
                  </h3>
                  <p className="text-sm text-[#9aa5bf] mt-1 italic">
                    {tagline}
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

export default MascotGallery;
