import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

/**
 * cyberkhana.tech — the umbrella page for the project, and nothing else.
 *
 * No auth, no token check, no routes: every platform destination on this build
 * is an absolute link to app.cyberkhana.tech (see config/site.ts). The router
 * is here only because the landing page uses <Link> for the wordmark, and
 * because anything that isn't the landing page should still render it rather
 * than a blank screen.
 */
const MarketingApp: React.FC = () => (
  <HashRouter>
    <Routes>
      <Route path="*" element={<LandingPage />} />
    </Routes>
  </HashRouter>
);

export default MarketingApp;
