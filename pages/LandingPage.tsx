import React from 'react';
import { LangProvider } from '../components/landing/LangContext';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import IPadShowcase from '../components/landing/iPadShowcase';
import AcademyTeaser from '../components/landing/AcademyTeaser';
import StatsSection from '../components/landing/StatsSection';
import LandingFooter from '../components/landing/LandingFooter';

/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  app.cyberkhana.tech — what a logged-out visitor to the platform sees.  │
 * │  Built by `npm run build`, previewed by `npm run dev`                   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * cyberkhana.tech — the umbrella page on the apex — is a separate repo now
 * (d0lv3/cyberkhana-marketing). It carries its own copy of components/landing/,
 * deliberately: the two pages are free to diverge, and editing anything here
 * affects the platform only. A genuine *bug* in a shared section is worth
 * fixing in both.
 */
const LandingPage: React.FC = () => {
  return (
    <LangProvider>
      <div className="bg-canvas app-min-shell overflow-x-hidden" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
        <LandingNavbar />
        <HeroSection />
        <div id="platform"><IPadShowcase /></div>
        <div id="academy"><AcademyTeaser /></div>
        <div id="stats"><StatsSection /></div>
        <LandingFooter />
      </div>
    </LangProvider>
  );
};

export default LandingPage;
