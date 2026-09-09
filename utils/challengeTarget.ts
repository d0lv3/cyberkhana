/* ── Where a challenge actually lives ──
 *
 * Two shapes, and an author picks one:
 *
 *   link     an http(s) URL — a web target you open in a tab
 *   address  a host (or IP) and a port — a raw TCP target you point `nc` at
 *
 * They are stored as siblings rather than one polymorphic field because
 * `challengeLink` predates this and is read in four places across two
 * controllers; adding two columns beside it needs no migration and leaves every
 * existing challenge working untouched. Exactly one is ever populated: saving
 * clears the other, so nothing downstream has to decide which wins.
 */

import { isHttpUrl } from './url';

export type TargetKind = 'none' | 'link' | 'address';

export interface ChallengeTarget {
  challengeLink?: string;
  challengeHost?: string;
  challengePort?: number;
}

/** Which of the two an existing challenge is using. */
export const targetKind = (t?: ChallengeTarget | null): TargetKind => {
  if (t?.challengeHost && t.challengePort) return 'address';
  if (t?.challengeLink?.trim()) return 'link';
  return 'none';
};

/* A hostname label, an IPv4 dotted quad, or a bracketed IPv6 literal. Anything
   carrying a scheme, a path, a query or whitespace is a URL that has been typed
   into the wrong box, and is rejected with that as the message. */
const HOSTNAME = /^(?=.{1,253}$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const IPV6 = /^\[[0-9a-fA-F:]+\]$/;

export const isValidHost = (host: string): boolean => {
  const h = host.trim();
  if (!h) return false;
  return IPV4.test(h) || IPV6.test(h) || HOSTNAME.test(h);
};

export const isValidPort = (port: unknown): boolean => {
  const n = typeof port === 'number' ? port : Number(String(port ?? '').trim());
  return Number.isInteger(n) && n >= 1 && n <= 65535;
};

/** Re-exported so this module stays the one place the target's rules live,
 *  while the http(s) rule itself is shared with the file-link field. */
export const isValidLink = isHttpUrl;

/** The message to show under the field, or '' when it is fine. */
export const targetError = (kind: TargetKind, t: ChallengeTarget): string => {
  if (kind === 'link') {
    const value = (t.challengeLink ?? '').trim();
    if (!value) return '';
    return isValidLink(value) ? '' : 'Enter a full http:// or https:// address';
  }
  if (kind === 'address') {
    const host = (t.challengeHost ?? '').trim();
    const port = t.challengePort;
    if (!host && port === undefined) return '';
    if (host && /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(host)) {
      return 'This is a URL — switch to Link, or enter just the host';
    }
    if (host && !isValidHost(host)) return 'Enter a hostname or IP, without a scheme or path';
    if (!host) return 'A host is required';
    if (!isValidPort(port)) return 'Port must be between 1 and 65535';
  }
  return '';
};

/** `host:port`, bracketed IPv6 included. */
export const formatAddress = (host: string, port: number | string) => `${host}:${port}`;

/** What a player would actually run against a raw TCP target. */
export const netcatCommand = (host: string, port: number | string) =>
  `nc ${host.replace(/^\[|\]$/g, '')} ${port}`;

export interface TargetPayload {
  challengeLink: string;
  challengeHost: string;
  /** null, never undefined: JSON.stringify drops an undefined value, and the
   *  server would then read "the request said nothing about the port" instead
   *  of "clear the port". */
  challengePort: number | null;
}

/**
 * The exactly-one-populated payload for a save. Whichever mode is not selected
 * comes back cleared, so switching an existing challenge from a link to an
 * address does not leave the old link behind for the UI to find first. All
 * three keys are always present, so a clear is unambiguous on the wire.
 */
export const targetPayload = (kind: TargetKind, t: ChallengeTarget): TargetPayload => {
  if (kind === 'link') {
    return { challengeLink: (t.challengeLink ?? '').trim(), challengeHost: '', challengePort: null };
  }
  if (kind === 'address') {
    return {
      challengeLink: '',
      challengeHost: (t.challengeHost ?? '').trim(),
      challengePort: Number(t.challengePort),
    };
  }
  return { challengeLink: '', challengeHost: '', challengePort: null };
};
