import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CalendarClock, Snowflake, Trophy } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { formatDateTime, formatSpan } from './console/ui';

/**
 * Event-wide notices on the event page: a frozen scoreboard, the next wave of challenges,
 * and — once it is over — the published results and the player's certificate.
 *
 * `onRefresh` is called the moment the next wave opens. Releases are time-based and change
 * nothing on the server, so no socket event announces them; the page asks again instead.
 */
const EventStatusBanners: React.FC<{ event: any; now: number; onRefresh: () => void }> = ({ event, now, onRefresh }) => {
  const [certificate, setCertificate] = useState<any>(null);
  const wave = event.nextRelease;

  useEffect(() => {
    if (!wave) return;
    const wait = Date.parse(wave.at) - Date.now() + 1000;
    // setTimeout overflows past ~24.8 days; a page is not left open that long, and a reload recomputes.
    if (wait > 2 ** 31 - 1) return;
    const timer = setTimeout(onRefresh, Math.max(0, wait));
    return () => clearTimeout(timer);
  }, [wave?.at]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (event.canManage || event.status !== 'ended' || !event.certificatesIssued) return setCertificate(null);
    eventService.myCertificate(event._id).then(setCertificate).catch(() => setCertificate(null));
  }, [event._id, event.status, event.certificatesIssued, event.canManage]);

  const banners: React.ReactNode[] = [];
  if (event.scoreboardFrozen) {
    banners.push(
      <div key="frozen" className="flex gap-3 rounded-xl border border-info/30 bg-info/[0.07] px-5 py-3.5 text-sm">
        <Snowflake size={18} className="mt-0.5 flex-shrink-0 text-info" />
        <p className="text-fg-soft">
          <span className="font-semibold text-fg">The scoreboard is frozen</span> since {formatDateTime(event.scoreboardFreezeAt)}.
          {event.canManage
            ? ' Players see the standings from then; reveal them from the console.'
            : ' Rankings and other teams’ solves stay as they were until the organizers reveal the final scoreboard. Your own solves still count.'}
        </p>
      </div>,
    );
  }
  if (wave && event.status !== 'ended') {
    banners.push(
      <div key="wave" className="flex gap-3 rounded-xl border border-violet/30 bg-violet/[0.07] px-5 py-3.5 text-sm">
        <CalendarClock size={18} className="mt-0.5 flex-shrink-0 text-violet" />
        <p className="text-fg-soft">
          <span className="font-semibold text-fg">{wave.count} new challenge{wave.count === 1 ? '' : 's'}</span> release {formatDateTime(wave.at)}
          {Date.parse(wave.at) > now && <> — in <span className="tabular-nums">{formatSpan(Date.parse(wave.at) - now)}</span></>}.
          {wave.remaining > wave.count && ` ${wave.remaining - wave.count} more later.`}
        </p>
      </div>,
    );
  }
  if (event.status === 'ended' && (event.resultsPublished || certificate)) {
    banners.push(
      <div key="final" className="flex flex-col gap-3 rounded-xl border border-brand/30 bg-brand/[0.06] px-5 py-3.5 text-sm sm:flex-row sm:items-center">
        <Trophy size={18} className="flex-shrink-0 text-brand" />
        <p className="flex-1 text-fg-soft"><span className="font-semibold text-fg">The event is over.</span> Thanks for playing.</p>
        <div className="flex flex-wrap gap-2">
          {event.resultsPublished && (
            <Link to={`/results/${event._id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-xs font-semibold text-fg-soft hover:text-fg">
              <Trophy size={14} /> Final results
            </Link>
          )}
          {certificate && (
            <Link to={`/certificates/${certificate.code}`} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-deep px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-press">
              <Award size={14} /> Your certificate
            </Link>
          )}
        </div>
      </div>,
    );
  }
  return banners.length ? <div className="mb-6 space-y-3">{banners}</div> : null;
};

export default EventStatusBanners;
