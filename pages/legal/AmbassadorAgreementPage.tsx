import React from 'react';
import LegalDocument, { scrollToSection } from '../../components/legal/LegalDocument';
import {
  AMBASSADOR_SECTIONS,
  AMBASSADOR_UPDATED,
  AMBASSADOR_VERSION,
} from '../../data/ambassadorAgreementContent';

/**
 * The full Ambassador Agreement.
 *
 * Routed outside AppLayout for the same reason as the Terms: an ambassador
 * reading it from inside the acceptance dialog has the Management area locked.
 * Readable by anyone — a student deciding whether to volunteer should be able
 * to see what the role commits them to before taking it.
 */
const AmbassadorAgreementPage: React.FC = () => (
  <LegalDocument
    title="Student Ambassador Agreement"
    subtitle="For ambassadors on app.cyberkhana.tech"
    updated={AMBASSADOR_UPDATED}
    version={AMBASSADOR_VERSION}
    sections={AMBASSADOR_SECTIONS}
    callout={{
      heading: 'Before you accept',
      body: (
        <>
          <p className="mt-3 text-sm leading-relaxed text-fg-soft">
            Being an ambassador gives you real power over other people’s accounts and real ability
            to cause harm outside the Platform.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-fg-soft">
            You can see students’ accounts. You can take away their points and ban them. And you
            can publish a challenge that points dozens of students at any address you type into a
            box.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-fg-soft">
            That last one is the reason this document exists.{' '}
            <button
              type="button"
              onClick={() => scrollToSection('5')}
              className="rounded font-medium text-brand underline underline-offset-4 hover:text-brand-neon focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon"
            >
              Section 5
            </button>{' '}
            is the one that can get you personally into legal trouble.{' '}
            <strong className="text-fg">Read it twice.</strong>
          </p>
        </>
      ),
    }}
  />
);

export default AmbassadorAgreementPage;
