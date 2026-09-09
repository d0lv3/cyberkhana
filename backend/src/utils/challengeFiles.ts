/* ── Server-side validation for a challenge's attachments ──
 *
 * A file is a `{ name, url }` pair whether it was uploaded here or linked from
 * somewhere else, and the player page renders that url straight into an
 * `<a href>` — so an author who can type a url can store a `javascript:` one,
 * and nothing was checking. This is the check.
 *
 * A deliberate second copy of the frontend's rule, for the same reason the
 * target validator is: the two trees build separately and the boundary has to
 * hold whether or not the request came from our own form.
 */

/** Matches multer's `files: 10` on the upload route. */
export const MAX_CHALLENGE_FILES = 10;
const MAX_NAME_LENGTH = 255;

export interface ChallengeFile {
  name: string;
  url: string;
}

/**
 * http(s), or a root-relative path on this origin.
 *
 * The relative case is not something the form produces — uploads come back
 * absolute — but a challenge saved by an older build may hold one, and an edit
 * re-sends the whole list. Rejecting it would make those challenges
 * unsaveable for any unrelated change. `//evil.com` is excluded deliberately:
 * a protocol-relative URL is an off-site link wearing a local one's clothes.
 */
const isStorableUrl = (value: string): boolean => {
  if (value.startsWith('//')) return false;
  if (value.startsWith('/')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Returns `{ error }` for a list that must not be stored, or `{ files }` with
 * the normalised entries. `undefined` files means the request said nothing
 * about attachments, which leaves whatever is saved alone.
 */
export function normaliseChallengeFiles(
  body: Record<string, unknown>,
): { error: string } | { files?: ChallengeFile[] } {
  if (!('files' in body)) return {};
  const raw = body.files;

  // An absent or null value clears the list; anything else must be an array.
  if (raw === null || raw === undefined) return { files: [] };
  if (!Array.isArray(raw)) return { error: 'Challenge files must be a list' };
  if (raw.length > MAX_CHALLENGE_FILES) {
    return { error: `A challenge can have at most ${MAX_CHALLENGE_FILES} files` };
  }

  const files: ChallengeFile[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') {
      return { error: 'Each challenge file needs a name and a URL' };
    }
    const url = typeof (entry as any).url === 'string' ? (entry as any).url.trim() : '';
    const name = typeof (entry as any).name === 'string' ? (entry as any).name.trim() : '';
    if (!url) return { error: 'Each challenge file needs a URL' };
    if (!isStorableUrl(url)) {
      return { error: `File URL must be a full http:// or https:// address: ${url.slice(0, 80)}` };
    }
    if (name.length > MAX_NAME_LENGTH) {
      return { error: `A file name may be at most ${MAX_NAME_LENGTH} characters` };
    }
    // A nameless file still needs a label to click on; the URL is the honest one.
    files.push({ name: name || url, url });
  }
  return { files };
}
