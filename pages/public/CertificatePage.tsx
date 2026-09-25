import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BadgeCheck, Copy, Printer, ShieldX } from 'lucide-react';
import { eventService } from '../../services/eventService';
import PublicShell from '../../components/public/PublicShell';
import CertificateTemplate, { CertificateData } from '../../components/certificates/CertificateTemplate';
import { ConsoleButton, EmptyState, formatDateTime } from '../../components/competition/console/ui';
import { publicLink } from '../../components/competition/console/ResultsTab';

/**
 * A certificate and its verification. The link is what a player shares with an employer
 * or on a profile: anyone can open it, see who it was issued to, and whether it still stands.
 */
const CertificatePage: React.FC = () => {
  const { code = '' } = useParams();
  const [certificate, setCertificate] = useState<CertificateData | null>(null), [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const verifyUrl = publicLink(`/certificates/${code}`);

  useEffect(() => {
    const title = document.title;
    eventService.verifyCertificate(code)
      .then((data: CertificateData) => { setCertificate(data); document.title = `${data.name} · ${data.eventName} · CyberKhana`; })
      .catch(() => setError('not-found'));
    return () => { document.title = title; };
  }, [code]);

  if (error) {
    return (
      <PublicShell width="max-w-3xl">
        <EmptyState icon={<ShieldX size={20} />} title="No certificate with this code">
          Check that the link is complete. CyberKhana certificate codes are 32 characters long.
        </EmptyState>
      </PublicShell>
    );
  }
  if (!certificate) {
    return <PublicShell width="max-w-6xl"><div className="aspect-[297/210] w-full animate-pulse rounded-lg bg-panel" aria-busy="true" aria-label="Loading certificate" /></PublicShell>;
  }

  return (
    <PublicShell width="max-w-6xl">
      <div className="space-y-6">
        {certificate.revoked ? (
          <div role="alert" className="flex gap-3 rounded-xl border border-danger/40 bg-danger/10 px-5 py-4 print:hidden">
            <ShieldX size={20} className="mt-0.5 flex-shrink-0 text-danger" />
            <p className="text-sm text-fg-soft">
              <span className="font-semibold text-danger">This certificate has been revoked</span> by {certificate.hostUniversityName}. It is no longer valid.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-xl border border-brand/30 bg-brand/[0.06] px-5 py-4 sm:flex-row sm:items-center print:hidden">
            <BadgeCheck size={22} className="flex-shrink-0 text-brand" />
            <p className="flex-1 text-sm text-fg-soft">
              <span className="font-semibold text-fg">Verified.</span> Issued to {certificate.name} for {certificate.eventName},
              hosted by {certificate.hostUniversityName} on CyberKhana, {formatDateTime(certificate.issuedAt)}.
            </p>
            <div className="flex flex-shrink-0 gap-2">
              <ConsoleButton size="sm" icon={<Copy size={14} />} onClick={async () => {
                try { await navigator.clipboard.writeText(verifyUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* the address bar has it */ }
              }}>{copied ? 'Copied' : 'Copy link'}</ConsoleButton>
              <ConsoleButton size="sm" tone="primary" icon={<Printer size={14} />} onClick={() => window.print()}>Print / Save as PDF</ConsoleButton>
            </div>
          </div>
        )}
        {!certificate.revoked && <CertificateTemplate certificate={certificate} verifyUrl={verifyUrl} />}
      </div>
    </PublicShell>
  );
};

export default CertificatePage;
