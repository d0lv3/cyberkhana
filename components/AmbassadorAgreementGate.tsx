import React from 'react';
import { useNavigate } from 'react-router-dom';
import AcceptanceDialog from './legal/AcceptanceDialog';
import {
  AMBASSADOR_KEY_POINTS,
  AMBASSADOR_UPDATED,
  AMBASSADOR_VERSION,
} from '../data/ambassadorAgreementContent';
import { authService } from '../services/authService';

interface AmbassadorAgreementGateProps {
  user: any;
  children: React.ReactNode;
}

/**
 * Locks the Management area until the ambassador accepts the Agreement.
 *
 * Scoped to Management rather than the whole app on purpose: the Agreement
 * governs ambassador powers, not participation. An ambassador who has accepted
 * the Terms but not this can still compete as a student — they just cannot
 * publish challenges, see student accounts, or move anyone's points.
 *
 * That is also why the secondary action is "Back to dashboard" rather than
 * "Log out": declining costs them the admin tools, not their account.
 *
 * Enforced independently on the server inside `requireAdmin`, which is the one
 * place all 39 admin endpoints already pass through.
 */
const AmbassadorAgreementGate: React.FC<AmbassadorAgreementGateProps> = ({ user, children }) => {
  const navigate = useNavigate();

  // Super admins operate the platform and are not ambassadors.
  const isAmbassador = user?.role === 'admin';
  const needsAcceptance = isAmbassador && user.ambassadorAgreementAccepted !== true;

  if (!needsAcceptance) return <>{children}</>;

  const handleAccept = async () => {
    await authService.acceptAmbassadorAgreement();

    const updated = {
      ...user,
      ambassadorAgreementAccepted: true,
      ambassadorAgreementVersion: AMBASSADOR_VERSION,
    };
    try {
      localStorage.setItem('user', JSON.stringify(updated));
    } catch {
      /* storage full or blocked — the server record is what counts */
    }
    // App listens for this and re-renders with the updated user, which drops
    // the gate. Used rather than a prop callback because ManagementGate sits
    // deep in the route tree and reads the user from storage, not from props.
    window.dispatchEvent(new CustomEvent('userUpdate', { detail: updated }));
  };

  return (
    <AcceptanceDialog
      title="Accept the Ambassador Agreement"
      intro="Before using ambassador powers, you need to accept the Agreement that governs them. Your student account is unaffected — you can compete as normal either way."
      points={AMBASSADOR_KEY_POINTS}
      docHref="#/ambassador-agreement"
      docLabel="Read the full Ambassador Agreement"
      updated={AMBASSADOR_UPDATED}
      acceptLabel="Accept and open Management"
      onAccept={handleAccept}
      secondaryLabel="Back to dashboard"
      onSecondary={() => navigate('/dashboard')}
      footnote="Until you accept, the Management area stays locked and challenge publishing, competitions, announcements and student records are unavailable. Your points and solves are not affected."
      checkboxLabel={
        <>
          I have read and agree to the{' '}
          <a
            href="#/ambassador-agreement"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline underline-offset-4 hover:text-brand-neon"
          >
            Student Ambassador Agreement
          </a>
          . I understand that I may only point a challenge at a lab machine CyberKhana provides or
          at infrastructure I personally own and am authorised to have attacked.
        </>
      }
    />
  );
};

export default AmbassadorAgreementGate;
