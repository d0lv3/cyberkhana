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

/** Files we host ourselves, as opposed to a link out to somebody else's server. */
export const isUploadedFileUrl = (url: string): boolean => /\/api\/uploads\//.test(url);
