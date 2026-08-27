import React from 'react';
import { LangProvider } from '../components/landing/LangContext';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import HowItWorks from '../components/landing/HowItWorks';
import IPadShowcase from '../components/landing/iPadShowcase';
import StatsSection from '../components/landing/StatsSection';
import AmbassadorCTA from '../components/landing/AmbassadorCTA';
import LandingFooter from '../components/landing/LandingFooter';

/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  app.cyberkhana.tech — what a logged-out visitor to the platform sees.  │
 * │  Built by `npm run build`, previewed by `npm run dev`                   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * The page runs: what the model is, how it works, what it looks like, who is
 * already on it, and then the ask — become the ambassador for your own campus.
 * It ends on that because the question only lands once a reader knows what they
 * would be taking on.
 *
 * It no longer introduces the Academy or offers a choice between the two
 * products. That job belongs to cyberkhana.tech, which is a separate repo now
 * (d0lv3/cyberkhana-marketing) with its own copy of components/landing/.
 * Editing anything here affects the platform only.
 */
const LandingPage: React.FC = () => {
  return (
    <LangProvider>
      <div className="bg-canvas app-min-shell overflow-x-hidden" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
        <LandingNavbar />
        <HeroSection />
        <div id="how"><HowItWorks /></div>
        <div id="platform"><IPadShowcase /></div>
        <div id="stats"><StatsSection /></div>
        <div id="ambassadors"><AmbassadorCTA /></div>
        <LandingFooter />
      </div>
    </LangProvider>
  );
};

export default LandingPage;
