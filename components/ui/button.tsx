
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className, ...props }) => {
  // `touch:` keys off pointer type rather than screen width: what has to fit
  // is the finger, and a tablet in landscape is wider than a laptop.
  const baseClasses = 'px-4 py-2 rounded-md font-semibold text-sm touch:min-h-tap touch:px-5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all duration-200 ease-in-out inline-flex items-center justify-center gap-2 select-none';

  const variantClasses = {
    primary: 'bg-brand text-white hover:bg-brand-deep focus:ring-brand disabled:bg-[#005a32] disabled:text-muted disabled:cursor-not-allowed shadow-lg hover:shadow-brand/20',
    secondary: 'bg-edge text-fg hover:bg-edge-light focus:ring-brand-neon border border-edge-soft',
    ghost: 'text-muted hover:bg-edge/50 hover:text-fg',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className ?? ''}`} {...props}>
      {children}
    </button>
  );
};

export default Button;