
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all duration-200 ease-in-out inline-flex items-center justify-center gap-2';

  const variantClasses = {
    primary: 'bg-[#00a859] text-white hover:bg-[#007a42] focus:ring-[#00a859] disabled:bg-[#005a32] disabled:text-[#9aa5bf] disabled:cursor-not-allowed shadow-lg hover:shadow-[#00a859]/20',
    secondary: 'bg-[#263248] text-[#f3f6ff] hover:bg-[#354562] focus:ring-[#9fef00] border border-[#2a3346]',
    ghost: 'text-[#9aa5bf] hover:bg-[#263248]/50 hover:text-[#f3f6ff]',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;