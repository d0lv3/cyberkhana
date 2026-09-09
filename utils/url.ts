/**
 * http(s) only.
 *
 * Anything an author types that later reaches an `<a href>` goes through here.
 * A `javascript:` or `data:` URL stored in such a field is a stored-XSS vector
 * the moment the page renders it, and `new URL()` alone will happily accept
 * both — the protocol check is the part that matters.
 */
export const isHttpUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * A sensible display name for a URL: its last path segment, percent-decoded.
 *
 * Used to prefill the name of a linked file so the author does not have to type
 * one for `…/handout.zip`. Falls back to the host, because a bare origin has no
 * segment to take and "example.com" beats an empty label.
 */
export const fileNameFromUrl = (value: string): string => {
  try {
    const url = new URL(value.trim());
    const last = url.pathname.split('/').filter(Boolean).pop();
    if (!last) return url.hostname;
    try {
      return decodeURIComponent(last);
    } catch {
      // A malformed percent-escape shouldn't cost the author a name.
      return last;
    }
  } catch {
    return '';
  }
};

/**
 * Hosts that have, at some point, served this platform's uploads directory.
 *
 * The apex and www are on that list because uploads were once stamped with
 * `https://cyberkhana.tech/api/uploads/...` — correct when the apex ran the
 * platform, wrong the moment the marketing site moved there and took the domain
 * with it. Only these hosts are rewritten: a challenge legitimately linking to
 * `https://someone-else.org/api/uploads/x.zip` must be left exactly as it is.
 */
const OUR_UPLOAD_HOSTS = new Set([
  'cyberkhana.tech',
  'www.cyberkhana.tech',
  'app.cyberkhana.tech',
]);

/**
 * The URL to actually fetch a stored attachment from.
 *
 * Rows saved before the domain split hold an absolute URL pointing at a host
 * that no longer serves `/api`. Reducing those to a path lets the browser
 * resolve them against whichever host is serving the app, so old challenges
 * work without rewriting the database. Everything else is returned untouched.
 */
export const resolveFileUrl = (value: string): string => {
  const trimmed = (value || '').trim();
  if (!trimmed) return trimmed;
  // Already relative — nothing to do. Uploads are stored this way now.
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  try {
    const url = new URL(trimmed);
    if (OUR_UPLOAD_HOSTS.has(url.hostname) && url.pathname.startsWith('/api/uploads/')) {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    // Not a parseable absolute URL; hand it back and let the caller decide.
  }
  return trimmed;
};

/** Files we host ourselves, as opposed to a link out to somebody else's server. */
export const isUploadedFileUrl = (url: string): boolean => /\/api\/uploads\//.test(url);
