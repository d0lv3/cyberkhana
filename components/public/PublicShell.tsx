import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../ui/BrandLogo';

/**
 * Frame for pages anyone can open without an account (published results, certificate
 * verification). Routed outside AppLayout, like the Terms, so a visitor with no session
 * gets a page rather than a login redirect. The header stays out of print.
 */
const PublicShell: React.FC<{ children: React.ReactNode; width?: string }> = ({ children, width = 'max-w-6xl' }) => (
  <div className="min-h-screen bg-canvas text-fg-soft">
    <header className="border-b border-edge bg-panel/60 backdrop-blur print:hidden">
      <div className={`mx-auto flex ${width} items-center justify-between gap-4 px-4 py-4 sm:px-6`}>
        <Link to="/" className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon" aria-label="CyberKhana home">
          <BrandLogo variant="text" alt="CyberKhana" className="h-7 w-auto object-contain" />
        </Link>
        <Link to="/login" className="text-sm font-semibold text-muted transition-colors hover:text-fg">Sign in</Link>
      </div>
    </header>
    <main className={`mx-auto ${width} px-4 py-8 sm:px-6 sm:py-12`}>{children}</main>
  </div>
);

export default PublicShell;
