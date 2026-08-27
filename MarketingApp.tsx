import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MarketingPage from './pages/MarketingPage';

/**
 * cyberkhana.tech — the umbrella page for the project, and nothing else.
 *
 * No auth, no token check, no routes: every platform destination on this build
 * is an absolute link to app.cyberkhana.tech (see config/site.ts). The router
 * is here only because the page uses <Link> for the wordmark, and because
 * anything that isn't the page should still render it rather than a blank
 * screen.
 *
 * The page itself is pages/MarketingPage.tsx. The platform's own logged-out
 * page is pages/LandingPage.tsx — separate file, edited independently.
 */
const MarketingApp: React.FC = () => (
  <HashRouter>
    <Routes>
      <Route path="*" element={<MarketingPage />} />
    </Routes>
  </HashRouter>
);

export default MarketingApp;
