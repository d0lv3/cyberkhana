import React from 'react';

interface BrandLogoProps {
  variant?: 'text' | 'academy' | 'mark' | 'collapsed';
  className?: string;
  alt?: string;
  loading?: 'eager' | 'lazy';
}

const logoMap: Record<NonNullable<BrandLogoProps['variant']>, string> = {
  text: '/assets/brand/cyberkhana-text-logo.png',
  academy: '/assets/brand/cyberkhana-academy.png',
  mark: '/assets/brand/cyberkhana-favicon.png',
  // Square lockup for the collapsed sidebar rail, where the wordmark has no room.
  collapsed: '/assets/brand/cyberkhana-logo-afterToggle.png'
};

const defaultAlt: Record<NonNullable<BrandLogoProps['variant']>, string> = {
  text: 'CyberKhana logo',
  academy: 'CyberKhana Academy logo',
  mark: 'CyberKhana mark',
  collapsed: 'CyberKhana'
};

const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'text',
  className = '',
  alt,
  loading = 'lazy'
}) => {
  return (
    <img
      src={logoMap[variant]}
      alt={alt ?? defaultAlt[variant]}
      className={className}
      loading={loading}
      decoding="async"
    />
  );
};

export default BrandLogo;
