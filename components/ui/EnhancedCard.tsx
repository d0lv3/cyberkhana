import React from 'react';

interface EnhancedCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  onClick?: () => void;
  glowColor?: 'none' | 'green' | 'neon' | 'blue' | 'holo';
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
  xl: 'p-6',
};

const glowMap = {
  none: '',
  green: 'hover:shadow-[0_0_20px_rgba(0,168,89,0.2)] hover:border-[#00a859]/40',
  neon: 'hover:shadow-[0_0_20px_rgba(159,239,0,0.15)] hover:border-[#9fef00]/30',
  blue: 'hover:shadow-[0_0_20px_rgba(96,165,250,0.2)] hover:border-[#60a5fa]/35',
  holo: 'hover:shadow-[0_0_24px_rgba(111,86,217,0.25)] hover:border-[#6f56d9]/40',
};

const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  className = '',
  padding = 'md',
  hoverable = false,
  onClick,
  glowColor = 'none',
}) => {
  return (
    <div
      onClick={onClick}
      className={[
        'rounded-xl border bg-[#121a2a] border-[#263248]',
        paddingMap[padding],
        hoverable
          ? `transition-all duration-200 ${glowMap[glowColor] || 'hover:border-[#354562] hover:bg-[#182235]'}`
          : '',
        onClick ? 'cursor-pointer' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
};

export default EnhancedCard;
