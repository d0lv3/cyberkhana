
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input: React.FC<InputProps> = ({ className, ...props }) => {
  const baseClasses = 'w-full px-4 py-2 bg-[#0d1522] border border-edge rounded-md placeholder-dim text-fg focus:outline-none focus:ring-2 focus:ring-brand-neon/50 focus:border-brand-neon/50 transition-all duration-200';

  return (
    <input className={`${baseClasses} ${className}`} {...props} />
  );
};

export default Input;