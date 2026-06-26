import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ className, children, ...props }) => {
  const baseClasses = 'w-full px-4 py-2 bg-[#0d1522] border border-[#263248] rounded-md text-[#f3f6ff] focus:outline-none focus:ring-2 focus:ring-[#9fef00]/50 focus:border-[#9fef00]/50 transition-all duration-200 appearance-none';

  return (
    <div className="relative">
      <select className={`${baseClasses} ${className}`} {...props}>
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#9aa5bf]">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
      </div>
    </div>
  );
};

export default Select;