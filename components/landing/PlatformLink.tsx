import React from 'react';
import { Link } from 'react-router-dom';
import { IS_MARKETING, platformHref } from '../../config/site';

interface PlatformLinkProps {
  /** A platform route, e.g. "/login". Always written as if we were the app. */
  to: string;
  className?: string;
  'aria-label'?: string;
  children: React.ReactNode;
}

/**
 * A link to somewhere in the platform, from either site.
 *
 * On the platform build this is an ordinary client-side <Link>. On the
 * marketing build the destination is on another origin, so it has to be a real
 * <a> — a react-router Link would try to route to a page that isn't in that
 * bundle and leave the visitor on a blank screen.
 */
const PlatformLink: React.FC<PlatformLinkProps> = ({ to, children, ...rest }) => {
  if (IS_MARKETING) {
    return (
      <a href={platformHref(to)} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} {...rest}>
      {children}
    </Link>
  );
};

export default PlatformLink;
