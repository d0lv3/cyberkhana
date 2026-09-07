import React from 'react';
import { useLocation } from 'react-router-dom';
import AcceptanceDialog from './legal/AcceptanceDialog';
import { KEY_POINTS, TERMS_UPDATED, TERMS_VERSION } from '../data/termsContent';
import { authService } from '../services/authService';

interface TermsGateProps {
  user: any;
  /** Called with the updated user once acceptance is recorded server-side. */
  onAccepted: (user: any) => void;
  onLogout: () => void;
}

/**
 * Blocks the whole platform for anyone who has not accepted the Terms.
 *
 * The dialog mechanics live in AcceptanceDialog; this decides only *when* to
 * show one and what happens on accept.
 *
 * Hidden on /terms so that "Read the full Terms" can open in a new tab and
 * actually be readable. Every other route still shows it.
 *
 * A prompt, not a security boundary — the API is gated independently by
 * `requireTermsAccepted` on the server.
 */
const TermsGate: React.FC<TermsGateProps> = ({ user, onAccepted, onLogout }) => {
  const location = useLocation();

  // `termsAccepted === false` is the gated case. `undefined` means the field is
  // missing from a session stored before this feature shipped — treated as not
  // accepted, which is correct: the server will 403 that session anyway.
  const needsAcceptance = Boolean(user) && user.termsAccepted !== true;
  if (!needsAcceptance || location.pathname === '/terms') return null;

  const handleAccept = async () => {
    await authService.acceptTerms();

    // Mirror the acceptance into the stored session so a refresh does not
    // re-open the dialog before the next login response arrives.
    const updated = { ...user, termsAccepted: true, termsVersion: TERMS_VERSION };
    try {
      localStorage.setItem('user', JSON.stringify(updated));
    } catch {
      /* storage full or blocked — the server record is what counts */
    }
    onAccepted(updated);
  };

  return (
    <AcceptanceDialog
      title="Accept the Terms to continue"
      intro="CyberKhana now has written Terms of Service. Everyone needs to accept them before using the platform — including accounts created before they existed."
      points={KEY_POINTS}
      docHref="#/terms"
      docLabel="Read the full Terms of Service"
      updated={TERMS_UPDATED}
      acceptLabel="Accept and continue"
      onAccept={handleAccept}
      secondaryLabel="Log out"
      onSecondary={onLogout}
      footnote="If you do not accept, log out. You will see this again next time you sign in, and the platform stays locked until you accept."
      checkboxLabel={
        <>
          I have read and agree to the{' '}
          <a
            href="#/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline underline-offset-4 hover:text-brand-neon"
          >
            Terms of Service
          </a>
          . I understand that I may only use these techniques against the targets CyberKhana names,
          and nowhere else.
        </>
      }
    />
  );
};

export default TermsGate;
