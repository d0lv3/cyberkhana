"use client";

import { motion } from "framer-motion";
import { useLang } from "./LangContext";

interface TimelineNode {
  readonly year: string;
  readonly image: string;
}

const timelineNodes: readonly TimelineNode[] = [
  {
    year: "2025",
    image: "/assets/landing/story-spark.jpg",
  },
  {
    year: "2025",
    image: "/assets/landing/story-club.jpg",
  },
  {
    year: "2025",
    image: "/assets/landing/story-alliance.jpg",
  },
  {
    year: "2025",
    image: "/assets/landing/story-platform.jpg",
  },
  {
    year: "2025",
    image: "/assets/landing/story-academy.jpg",
  },
] as const;

function TimelineCard({
  node,
  index,
  isLeft,
  nodeIndex,
}: {
  readonly node: TimelineNode;
  readonly index: number;
  readonly isLeft: boolean;
  readonly nodeIndex: number;
}) {
  const { t } = useLang();
  const title = t(`story.node${nodeIndex}.title`);
  const text = t(`story.node${nodeIndex}.text`);

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.1 }}
      className="bg-[#121a2a]/80 backdrop-blur-sm border border-[#263248] rounded-2xl overflow-hidden"
    >
      <div className="relative h-48 w-full">
        <img
          src={node.image}
          alt={title}
          loading="lazy"
          className="h-48 object-cover w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121a2a] to-transparent" />
      </div>
      <div className="p-6">
        <span className="bg-[#00a859]/20 text-[#00a859] text-xs font-bold px-3 py-1 rounded-full">
          {node.year}
        </span>
        <h3
          className="text-xl font-bold text-[#f3f6ff] mt-3 mb-2"
          style={{ fontWeight: 800 }}
        >
          {title}
        </h3>
        <p className="text-[#9aa5bf] text-sm leading-relaxed">
          {text}
        </p>
      </div>
    </motion.div>
  );
}

function MobileTimeline() {
  const { t } = useLang();

  return (
    <div className="md:hidden relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#00a859] via-[#00a859] to-transparent" />
      <div className="flex flex-col gap-10">
        {timelineNodes.map((node, index) => {
          const nodeIndex = index + 1;
          const title = t(`story.node${nodeIndex}.title`);
          const text = t(`story.node${nodeIndex}.text`);

          return (
            <div key={nodeIndex} className="relative pl-12">
              <div className="absolute left-2 top-6 w-4 h-4 rounded-full bg-[#00a859] shadow-[0_0_15px_rgba(0,168,89,0.6)]" />
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.6,
                  ease: "easeOut",
                  delay: index * 0.1,
                }}
                className="bg-[#121a2a]/80 backdrop-blur-sm border border-[#263248] rounded-2xl overflow-hidden"
              >
                <div className="relative h-48 w-full">
                  <img
                    src={node.image}
                    alt={title}
                    loading="lazy"
                    className="h-48 object-cover w-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121a2a] to-transparent" />
                </div>
                <div className="p-6">
                  <span className="bg-[#00a859]/20 text-[#00a859] text-xs font-bold px-3 py-1 rounded-full">
                    {node.year}
                  </span>
                  <h3
                    className="text-xl font-bold text-[#f3f6ff] mt-3 mb-2"
                    style={{ fontWeight: 800 }}
                  >
                    {title}
                  </h3>
                  <p className="text-[#9aa5bf] text-sm leading-relaxed">
                    {text}
                  </p>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DesktopTimeline() {
  return (
    <div className="hidden md:block relative">
      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#00a859] via-[#00a859] to-transparent" />
      <div className="flex flex-col gap-16">
        {timelineNodes.map((node, index) => {
          const isLeft = index % 2 === 0;
          const nodeIndex = index + 1;
          return (
            <div key={nodeIndex} className="relative grid grid-cols-2 gap-12">
              <div
                className="absolute left-1/2 -translate-x-1/2 top-6 w-4 h-4 rounded-full bg-[#00a859] shadow-[0_0_15px_rgba(0,168,89,0.6)] z-10"
              />
              {isLeft ? (
                <>
                  <div className="pr-8">
                    <TimelineCard
                      node={node}
                      index={index}
                      isLeft={true}
                      nodeIndex={nodeIndex}
                    />
                  </div>
                  <div />
                </>
              ) : (
                <>
                  <div />
                  <div className="pl-8">
                    <TimelineCard
                      node={node}
                      index={index}
                      isLeft={false}
                      nodeIndex={nodeIndex}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FoundingStory() {
  const { t } = useLang();

  return (
    <section className="bg-[#0d1117] py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2
            className="text-4xl md:text-5xl font-extrabold text-[#f3f6ff] mb-3"
            style={{ fontWeight: 800 }}
          >
            {t('story.heading')}
          </h2>
          <p className="text-[#9aa5bf] text-lg">
            {t('story.subtitle')}
          </p>
        </div>
        <DesktopTimeline />
        <MobileTimeline />
      </div>
    </section>
  );
}
