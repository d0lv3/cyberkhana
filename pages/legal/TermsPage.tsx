import React from 'react';
import LegalDocument, { scrollToSection } from '../../components/legal/LegalDocument';
import { TERMS_SECTIONS, TERMS_UPDATED, TERMS_VERSION } from '../../data/termsContent';

/**
 * The full Terms of Service.
 *
 * Reachable signed out and signed in, and — importantly — reachable from inside
 * the acceptance dialog, which is why it is routed outside AppLayout: a gated
 * user has no sidebar and no dashboard to render it into.
 */
const TermsPage: React.FC = () => (
  <LegalDocument
    title="Terms of Service"
    subtitle="For app.cyberkhana.tech"
    updated={TERMS_UPDATED}
    version={TERMS_VERSION}
    sections={TERMS_SECTIONS}
    callout={{
      heading: 'Before you start',
      body: (
        <>
          <p className="mt-3 text-sm leading-relaxed text-fg-soft">
            This is a competitive hacking platform. It teaches you to break into computer systems.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-fg-soft">
            Everything you learn here is legal to use <strong className="text-fg">only</strong>{' '}
            against the specific targets we point you at, while the challenge is open. Using it
            anywhere else is a crime in Iraq and in nearly every other country, and these Terms
            will not protect you.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-fg-soft">
            <button
              type="button"
              onClick={() => scrollToSection('6')}
              className="rounded font-medium text-brand underline underline-offset-4 hover:text-brand-neon focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon"
            >
              Section 6
            </button>{' '}
            is the section that matters. If you read nothing else, read that.
          </p>
        </>
      ),
    }}
  />
);

export default TermsPage;
