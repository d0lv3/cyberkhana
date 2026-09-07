/* ── The version of the Terms of Service users must have accepted ──
 *
 * Bump this when the Terms change materially. Every user whose stored
 * `termsVersion` is not this string is treated as not having accepted, so
 * changing it re-prompts the entire user base on their next request. That is
 * the mechanism section 22 of the Terms describes.
 *
 * Deliberately a second copy of the constant in the frontend's
 * `data/termsContent.ts` rather than a shared module: the two trees build
 * separately. The frontend copy decides what the acceptance dialog says it is
 * accepting; this one decides what the server will accept. They must be bumped
 * together — a mismatch means every user is prompted and the acceptance never
 * sticks.
 *
 * Format is the Terms' own "Last updated" date, so the stored value on a user
 * record says which text they actually agreed to.
 */
export const CURRENT_TERMS_VERSION = '2026-09-07';

/**
 * Has this user accepted the Terms as they currently stand?
 *
 * A user who accepted an older version reads as not accepted — they get the
 * dialog again showing what changed.
 */
export const hasAcceptedCurrentTerms = (user: {
  termsAcceptedAt?: Date | null;
  termsVersion?: string | null;
}): boolean => Boolean(user?.termsAcceptedAt && user.termsVersion === CURRENT_TERMS_VERSION);

/* ── The Ambassador Agreement ──
 *
 * Versioned separately from the Terms, and gated separately: the Terms gate the
 * whole platform, this gates only the Management area. An ambassador who has
 * accepted the Terms but not this can still compete as a student — they just
 * cannot use ambassador powers, which is exactly what this document governs.
 *
 * Mirrored in the frontend's `data/ambassadorAgreementContent.ts`.
 */
export const CURRENT_AMBASSADOR_AGREEMENT_VERSION = '2026-09-07';

export const hasAcceptedCurrentAmbassadorAgreement = (user: {
  ambassadorAgreementAcceptedAt?: Date | null;
  ambassadorAgreementVersion?: string | null;
}): boolean =>
  Boolean(
    user?.ambassadorAgreementAcceptedAt &&
      user.ambassadorAgreementVersion === CURRENT_AMBASSADOR_AGREEMENT_VERSION
  );
