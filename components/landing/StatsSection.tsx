import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useLang } from './LangContext';

function useCountUp(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [hasStarted, target, duration]);

  return { count, ref };
}

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  labelKey: string;
}

const stats: StatItem[] = [
  { value: 300, suffix: "+", label: "Students", labelKey: "stats.students" },
  { value: 3, suffix: "", label: "Universities", labelKey: "stats.universities" },
  { value: 30, suffix: "+", label: "Challenges", labelKey: "stats.challenges" },
  { value: 10, suffix: "+", label: "Competitions", labelKey: "stats.competitions" },
];

function CounterCard({ value, suffix, labelKey }: StatItem) {
  const { count, ref } = useCountUp(value);
  const { t } = useLang();

  return (
    <div ref={ref} className="text-center p-6">
      <div
        className="text-4xl md:text-5xl font-black text-[#9fef00]"
        style={{
          textShadow: "0 0 20px rgba(159,239,0,0.3)",
        }}
      >
        {count}
        {suffix}
      </div>
      <div className="text-[#9aa5bf] text-sm mt-2 uppercase tracking-wider font-medium">
        {t(labelKey)}
      </div>
    </div>
  );
}

export default function StatsSection() {
  const { t } = useLang();

  return (
    <section className="py-24 md:py-32 bg-[#0a0f18] relative overflow-hidden">
      <img
        src="/assets/landing/stats-iraq-map.jpg"
        alt=""
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-[#0d1117]/80" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl text-[#f3f6ff] text-center"
          style={{
            fontWeight: 800,
          }}
        >
          {t('stats.heading')}
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
          {stats.map((stat) => (
            <CounterCard
              key={stat.labelKey}
              {...stat}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
