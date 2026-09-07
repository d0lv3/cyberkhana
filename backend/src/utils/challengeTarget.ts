/* ── Server-side validation for a challenge's target ──
 *
 * Deliberately a second copy of the rules in the frontend's
 * utils/challengeTarget.ts rather than a shared module: the two trees build
 * separately, and the boundary has to hold whether or not the request came
 * from our own form. The frontend copy exists to give the author a message
 * while they type; this one exists to decide what gets stored.
 */

const HOSTNAME =
  /^(?=.{1,253}$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const IPV6 = /^\[[0-9a-fA-F:]+\]$/;

export interface TargetPatch {
  challengeLink?: string;
  challengeHost?: string;
  challengePort?: number;
}

/**
 * Normalises whichever half of the target is present and rejects the rest.
 *
 * Returns `{ error }` for a value that must not be stored, or `{ patch }` with
 * the fields to assign — including the explicit clears, so switching a
 * challenge from a link to an address does not leave the old link behind.
 * `undefined` for a key means "the request said nothing about this", which is
 * how a partial edit of some unrelated field leaves the target alone.
 */
export function normaliseChallengeTarget(
  body: Record<string, unknown>,
): { error: string } | { patch: TargetPatch } {
  const mentionsLink = 'challengeLink' in body;
  const mentionsAddress = 'challengeHost' in body || 'challengePort' in body;
  if (!mentionsLink && !mentionsAddress) return { patch: {} };

  const link = typeof body.challengeLink === 'string' ? body.challengeLink.trim() : '';
  const host = typeof body.challengeHost === 'string' ? body.challengeHost.trim() : '';
  const rawPort = body.challengePort;
  const port =
    rawPort === undefined || rawPort === null || rawPort === ''
      ? undefined
      : Number(rawPort);

  if (link && (host || port !== undefined)) {
    return { error: 'A challenge has either a link or a host and port, not both' };
  }

  if (link) {
    // http(s) only: a javascript: or data: href stored here ends up in an
    // anchor on the challenge page, which is a stored-XSS vector.
    let parsed: URL;
    try {
      parsed = new URL(link);
    } catch {
      return { error: 'Challenge link must be a full http:// or https:// address' };
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { error: 'Challenge link must be a full http:// or https:// address' };
    }
    return { patch: { challengeLink: link, challengeHost: '', challengePort: undefined } };
  }

  if (host || port !== undefined) {
    if (!host) return { error: 'A challenge host is required alongside a port' };
    if (!IPV4.test(host) && !IPV6.test(host) && !HOSTNAME.test(host)) {
      return { error: 'Challenge host must be a hostname or IP, without a scheme or path' };
    }
    if (!Number.isInteger(port) || (port as number) < 1 || (port as number) > 65535) {
      return { error: 'Challenge port must be a whole number between 1 and 65535' };
    }
    return { patch: { challengeLink: '', challengeHost: host, challengePort: port } };
  }

  // Both mentioned and both empty: the author cleared the target.
  return { patch: { challengeLink: '', challengeHost: '', challengePort: undefined } };
}
