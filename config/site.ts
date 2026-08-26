/**
 * Which of the two sites this build is.
 *
 * One repo, one build command, two deployments — the only difference is this
 * variable:
 *
 *   VITE_SITE=app        app.cyberkhana.tech — the platform. Landing page at /,
 *                        then login, dashboard, challenges, admin. This is the
 *                        default, so an unset variable keeps today's behaviour
 *                        and nothing breaks if a deploy forgets it.
 *
 *   VITE_SITE=marketing  cyberkhana.tech — the umbrella page for the project
 *                        and nothing else. Every route that belongs to the
 *                        platform is sent to PLATFORM_ORIGIN instead.
 */
export type SiteMode = 'app' | 'marketing';

export const SITE: SiteMode =
  (import.meta.env.VITE_SITE as SiteMode) === 'marketing' ? 'marketing' : 'app';

export const IS_MARKETING = SITE === 'marketing';

/** Where the platform lives, for the marketing build to point at. */
export const PLATFORM_ORIGIN: string =
  import.meta.env.VITE_PLATFORM_ORIGIN || 'https://app.cyberkhana.tech';

export const ACADEMY_ORIGIN: string =
  import.meta.env.VITE_ACADEMY_ORIGIN || 'https://academy.cyberkhana.tech';

/**
 * A platform route, addressed correctly for whichever site is asking.
 *
 * On the platform it stays a normal in-app route. On the marketing site it
 * becomes an absolute URL, because /login there would be a page that doesn't
 * exist. Note the `#` — the app is on HashRouter, so its routes live in the
 * fragment.
 */
export function platformHref(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return IS_MARKETING ? `${PLATFORM_ORIGIN}/#${clean}` : clean;
}
