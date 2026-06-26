
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input: React.FC<InputProps> = ({ className, ...props }) => {
  const baseClasses = 'w-full px-4 py-2 bg-[#0d1522] border border-[#263248] rounded-md placeholder-[#8390ac] text-[#f3f6ff] focus:outline-none focus:ring-2 focus:ring-[#9fef00]/50 focus:border-[#9fef00]/50 transition-all duration-200';

  return (
    <input className={`${baseClasses} ${className}`} {...props} />
  );
};

export default Input;