import React from 'react';
import { LangProvider } from '../components/landing/LangContext';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import IPadShowcase from '../components/landing/iPadShowcase';

import AcademyTeaser from '../components/landing/AcademyTeaser';
import StatsSection from '../components/landing/StatsSection';
import LandingFooter from '../components/landing/LandingFooter';

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
