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
 * │  cyberkhana.tech — the umbrella page for the project as a whole.        │
 * │  Built by `npm run build:marketing`, previewed by `npm run dev:marketing`│
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * The other one is pages/LandingPage.tsx, which is what a logged-out visitor
 * sees on app.cyberkhana.tech. The two start identical on purpose — same
 * design, so neither begins from scratch — but they are separate files now:
 * changing the order of sections here, dropping one, or adding one, does
 * nothing to the platform.
 *
 * The sections themselves are still shared out of components/landing/. That is
 * deliberate: a bug fixed there is fixed on both sites. When a section needs to
 * genuinely differ between the two, fork that one file into a Marketing variant
 * and swap the import below — one section at a time, rather than duplicating
 * the whole page up front.
 */
const MarketingPage: React.FC = () => {
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

export default MarketingPage;
