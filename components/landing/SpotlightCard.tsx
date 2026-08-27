import React, { useRef, useState } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  /** rgba() colour of the glow that follows the cursor. */
  spotlightColor?: string;
  /** Radius of the glow, in px. */
  radius?: number;
}

/**
 * React Bits-style spotlight card: a soft radial glow follows the cursor and
 * fades in on hover. No dependencies — pointer tracking and a gradient overlay
 * clipped to the card.
 *
 * The same component the Academy uses, so a card behaves the same way across
 * the project. Surface styles come in through `className`; this only owns the
 * glow.
 *
 * There is no hover on a touch screen, so whatever is passed in has to stand up
 * without the glow. It decorates a card; it is never the thing that makes one
 * look interactive.
 */
const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(159,239,0,0.14)',
  radius = 320,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(${radius}px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
};

export default SpotlightCard;
