import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import qrcode from 'qrcode-generator';
import './certificate.css';
import { CERT_BACKGROUND_SVG, CERT_DEFS_SVG, CERT_SEAL_SVG } from './certificateArt';

/**
 * Everything a certificate can show. Each field comes from the certificate record,
 * fixed when it was issued.
 */
export interface CertificateData {
  /** Public verification code, 32 hex characters. */
  code: string;
  /** Full name, or the username for a player who never set one. */
  name: string;
  username: string;
  universityName: string;
  /** Null for a player who never joined a team. */
  teamName: string | null;
  /** Team placing; null without a team. */
  rank: number | null;
  totalTeams: number;
  points: number | null;
  solved: number | null;
  eventName: string;
  hostUniversityName: string;
  eventStart: string | null;
  eventEnd: string | null;
  issuedAt: string;
  revoked: boolean;
}

// Arabic, Arabic Supplement, Arabic Extended-A and the presentation forms: such names are set right to left.
const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const ordinal = (n: number) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return s[(v - 20) % 10] || s[v] || s[0]; };
// Certificates are in English whatever the viewer's browser language, so they read the same everywhere.
const longDate = (value: string | Date) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/** "25–26 September 2026", "28 September – 2 October 2026", or a single day. */
export const dateRange = (start?: string | null, end?: string | null) => {
  if (!start || !end) return start || end ? longDate((start || end)!) : null;
  const a = new Date(start), b = new Date(end);
  if (a.toDateString() === b.toDateString()) return longDate(a);
  const month = (d: Date) => d.toLocaleDateString('en-GB', { month: 'long' });
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${month(b)} ${b.getFullYear()}`;
  if (a.getFullYear() === b.getFullYear()) return `${a.getDate()} ${month(a)} – ${longDate(b)}`;
  return `${longDate(a)} – ${longDate(b)}`;
};

/** QR modules as one SVG path, as in the design's renderer. */
const qrPath = (text: string) => {
  const q = qrcode(0, 'M');
  q.addData(text);
  q.make();
  const size = q.getModuleCount();
  let d = '';
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  return { size, d };
};

/**
 * The design's text fitting. `data-fit="max,singleMin,min"` in points: shrink on one line
 * down to singleMin, then allow wrapping down to min, until the text fits its box.
 */
const fitOne = (el: HTMLElement) => {
  const [max, singleMin, min] = (el.dataset.fit || '').split(',').map(Number);
  const box = el.parentElement!;
  const fits = () => el.scrollWidth <= box.clientWidth + 0.5 && el.offsetHeight <= box.clientHeight + 0.5;
  el.style.whiteSpace = 'nowrap';
  for (let size = max; size >= singleMin; size -= 0.5) { el.style.fontSize = `${size}pt`; if (fits()) return; }
  el.style.whiteSpace = 'normal';
  for (let size = singleMin; size >= min; size -= 0.5) { el.style.fontSize = `${size}pt`; if (fits()) return; }
};
const fitAll = (root: HTMLElement) => root.querySelectorAll<HTMLElement>('[data-fit]').forEach(fitOne);


/* Active only while a certificate is mounted: one landscape A4 page holding the certificate
   alone, at full size, dark background included. */
const PRINT_STYLES = `
@page { size: 297mm 210mm; margin: 0; }
@media print {
  html, body { width: 297mm !important; height: 210mm !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: #0d1117 !important; }
  body * { visibility: hidden !important; }
  .cert, .cert * { visibility: visible !important; }
  .cert-scaler > .cert { position: fixed !important; left: 0 !important; top: 0 !important; transform: none !important; box-shadow: none !important; }
}`;

const Cell: React.FC<{ label: string; value: string; muted?: boolean }> = ({ label, value, muted }) => (
  <div className="cell">
    <div className="k">{label}</div>
    <div className="vbox"><div className={`v${muted ? ' m' : ''}`} data-fit={muted ? '10,8,8' : '12,8,8'}>{value}</div></div>
  </div>
);

const CertificateTemplate: React.FC<{ certificate: CertificateData; verifyUrl: string }> = ({ certificate: c, verifyUrl }) => {
  const wrapRef = useRef<HTMLDivElement>(null), certRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1), [natural, setNatural] = useState({ width: 0, height: 0 });

  const tier = c.rank && c.rank <= 3 ? String(c.rank) : c.rank ? 'ranked' : 'participant';
  const code = c.code.toUpperCase();
  const groups = code.match(/.{1,4}/g) || [];
  const codeLines = [0, 2, 4, 6].map(i => groups.slice(i, i + 2).join(' ')).filter(Boolean).join('\n');
  const qr = useMemo(() => qrPath(verifyUrl), [verifyUrl]);
  const rtl = ARABIC.test(c.name);
  const dates = dateRange(c.eventStart, c.eventEnd);
  // A ranked player gets a stats row (team, points, solves); everyone gets the event row.
  const ranked = !!c.teamName && c.points != null;

  // Fit now, and again once the fonts arrive: sizes measured in a fallback face are wrong.
  useLayoutEffect(() => {
    const cert = certRef.current;
    if (!cert) return;
    fitAll(cert);
    let live = true;
    document.fonts?.ready.then(() => { if (live && certRef.current) fitAll(certRef.current); });
    return () => { live = false; };
  }, [c, verifyUrl]);

  // Scale the millimetre-sized sheet to the width available; transforms do not change layout, so fitting is unaffected.
  useLayoutEffect(() => {
    const wrap = wrapRef.current, cert = certRef.current;
    if (!wrap || !cert) return;
    const measure = () => {
      const width = cert.offsetWidth, height = cert.offsetHeight;
      setNatural({ width, height });
      setScale(Math.min(1, wrap.clientWidth / width));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="w-full">
      <style>{PRINT_STYLES}</style>
      <div className="cert-scaler" style={{ width: natural.width * scale || undefined, height: natural.height * scale || undefined }}>
        <div ref={certRef} className="cert" data-tier={tier} lang="en" style={{ transform: `scale(${scale})` }}>
          <div aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }} dangerouslySetInnerHTML={{ __html: CERT_DEFS_SVG }} />
          <div className="bg" aria-hidden="true" dangerouslySetInnerHTML={{ __html: CERT_BACKGROUND_SVG }} />
          <div className="logo sym" role="img" aria-label="CyberKhana" />
          <div className="logo wm" role="img" aria-label="CyberKhana" />

          {/* panel */}
          <div className="abs k p-label">{c.rank ? 'Final standing' : 'Verified participant'}</div>
          {c.rank && (
            <div className="abs fitbox rankbox"><div className="rank" data-fit="80,40,40">{c.rank}<sup>{ordinal(c.rank)}</sup></div></div>
          )}
          {c.rank && (
            <div className="abs fitbox placingbox">
              <div className="placing" data-fit="12,8,8">{`${c.rank}${ordinal(c.rank)} of ${c.totalTeams} team${c.totalTeams === 1 ? '' : 's'}`}</div>
            </div>
          )}
          <div className="abs sealwrap">
            <div className="seal" role="img" aria-label="CyberKhana verified seal">
              <div aria-hidden="true" style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: CERT_SEAL_SVG }} />
              <div className="seal-mark" />
            </div>
          </div>
          <div className="abs qr" role="img" aria-label="QR code linking to the verification page">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges"><path fill="#0d1117" d={qr.d} /></svg>
          </div>
          <div className="abs code"><div className="k">Verify</div><div className="code-groups">{codeLines}</div></div>

          {/* main column */}
          <div className="abs main title">Certificate of Achievement</div>
          <div className="abs main awarded">Awarded to</div>
          <div className="abs main fitbox namebox">
            <div className="name" data-fit="46,32,22" {...(rtl ? { dir: 'rtl', lang: 'ar' } : {})}>{c.name}</div>
          </div>
          <div className="abs main fitbox whobox">
            <div className="who" data-fit="12,9,9"><span className="u">@{c.username}</span><span>{c.universityName}</span></div>
          </div>
          <div className="abs main rule" />
          <div className="abs main copy">for competing in</div>
          <div className="abs main fitbox eventbox"><div className="event" data-fit="19,15,12">{c.eventName}</div></div>
          {/* One labelled cell per fact, in two aligned rows anchored to the bottom of the sheet. */}
          <div className="abs main fields">
            {ranked && <>
              <Cell label="Team" value={c.teamName!} />
              <Cell label="Points" value={c.points!.toLocaleString('en-US')} />
              <Cell label="Challenges solved" value={String(c.solved ?? 0)} />
            </>}
            <Cell label="Hosted by" value={c.hostUniversityName} muted />
            {dates && <Cell label="Event dates" value={dates} muted />}
            <Cell label="Issued" value={longDate(c.issuedAt)} muted />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateTemplate;
