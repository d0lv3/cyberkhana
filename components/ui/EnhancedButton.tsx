import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'neon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = [
    'relative inline-flex items-center justify-center font-semibold transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0d1117]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-95',
    'select-none',
  ].join(' ');

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
    md: 'px-4 py-2 text-sm rounded-lg gap-2',
    lg: 'px-6 py-2.5 text-base rounded-lg gap-2.5',
    xl: 'px-8 py-3.5 text-lg rounded-xl gap-3',
  };

  const variantClasses = {
    primary: [
      'bg-[#00a859] text-white',
      'hover:bg-[#007a42]',
      'focus:ring-[#00a859]',
      'shadow-md hover:shadow-[0_0_16px_rgba(0,168,89,0.35)]',
    ].join(' '),
    neon: [
      'bg-[#9fef00] text-[#0d1117]',
      'hover:bg-[#8dd900]',
      'focus:ring-[#9fef00]',
      'font-black shadow-md hover:shadow-[0_0_16px_rgba(159,239,0,0.4)]',
    ].join(' '),
    secondary: [
      'bg-[#1a2332] text-[#d2d7e3]',
      'hover:bg-[#182235]',
      'focus:ring-[#263248]',
      'border border-[#263248] hover:border-[#354562]',
    ].join(' '),
    ghost: [
      'text-[#9aa5bf]',
      'hover:bg-[#182235] hover:text-[#d2d7e3]',
      'focus:ring-[#263248]',
    ].join(' '),
    outline: [
      'bg-transparent text-[#d2d7e3]',
      'border border-[#263248]',
      'hover:border-[#00a859] hover:text-[#00a859]',
      'focus:ring-[#00a859]',
    ].join(' '),
    danger: [
      'bg-red-500/90 text-white',
      'hover:bg-red-600',
      'focus:ring-red-400',
      'shadow-md',
    ].join(' '),
  };

  const classes = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || isLoading} {...props}>
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span className="flex-1 text-center">{children}</span>
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
