
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
  const baseClasses = 'bg-[#121a2a] border border-[#263248] rounded-lg';

  return (
    <div
      className={`${baseClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;