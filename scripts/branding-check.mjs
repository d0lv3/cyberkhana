import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const checks = [];
const failures = [];

function pass(message) {
  checks.push(`PASS ${message}`);
}

function fail(message) {
  failures.push(`FAIL ${message}`);
}

/** Missing file => null, not a stack trace. This suite spent several commits
 *  crashing on a renamed component instead of reporting it, and a crash reads
 *  like a broken script rather than a failed check. */
function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    fail(`Expected file is missing: ${path.relative(rootDir, filePath)}`);
    return null;
  }
}

function toAbsolutePublicPath(urlPath) {
  // Icon hrefs carry a cache-busting suffix (favicon.ico?v=2). That is part of
  // the URL, never part of the filename, so drop it before touching disk.
  const withoutSuffix = urlPath.split(/[?#]/)[0];
  const cleanPath = withoutSuffix.startsWith('/') ? withoutSuffix.slice(1) : withoutSuffix;
  return path.join(rootDir, 'public', cleanPath);
}

/** Named (quoted) font families in every font-family declaration of a stylesheet. */
function declaredFontFamilies(css) {
  const families = new Set();
  for (const [, list] of css.matchAll(/font-family:\s*([^;}]+)/gi)) {
    for (const [, family] of list.matchAll(/'([^']+)'|"([^"]+)"/g)) {
      if (family) families.add(family.trim());
    }
  }
  return [...families];
}

function run() {
  const indexHtmlPath = path.join(rootDir, 'index.html');
  const appTsxPath = path.join(rootDir, 'App.tsx');
  const indexTsxPath = path.join(rootDir, 'index.tsx');
  const appLayoutPath = path.join(rootDir, 'components', 'AppLayout.tsx');
  const managementLayoutPath = path.join(rootDir, 'components', 'ManagementLayout.tsx');
  const indexCssPath = path.join(rootDir, 'index.css');

  const indexHtml = readText(indexHtmlPath);
  const appTsx = readText(appTsxPath);
  const indexTsx = readText(indexTsxPath);
  const appLayout = readText(appLayoutPath);
  const managementLayout = readText(managementLayoutPath);
  const indexCss = readText(indexCssPath);

  // Bail out cleanly rather than throwing on `null.includes(...)` below.
  if ([indexHtml, appTsx, indexTsx, appLayout, managementLayout, indexCss].includes(null)) {
    report();
    return;
  }

  // 1) App load smoke checks (entrypoint + mount target)
  if (indexHtml.includes('<div id="root"></div>') && indexHtml.includes('src="/index.tsx"')) {
    pass('App entrypoint and root mount are present in index.html');
  } else {
    fail('App entrypoint/root mount missing in index.html');
  }

  if (indexTsx.includes('createRoot') && appTsx.includes('const App')) {
    pass('React app bootstrap files are present and wired');
  } else {
    fail('React app bootstrap appears incomplete (index.tsx/App.tsx)');
  }

  // 2) Logo/image resolve checks
  const logoPaths = [
    '/assets/brand/cyberkhana-text-logo.png',
    '/assets/brand/cyberkhana-academy.png',
    '/assets/brand/cyberkhana-favicon.png'
  ];

  for (const logoPath of logoPaths) {
    const absoluteLogoPath = toAbsolutePublicPath(logoPath);

    if (!fs.existsSync(absoluteLogoPath)) {
      fail(`Brand asset missing: ${logoPath}`);
      continue;
    }

    const size = fs.statSync(absoluteLogoPath).size;
    if (size > 0) {
      pass(`Brand asset exists and is non-empty: ${logoPath}`);
    } else {
      fail(`Brand asset exists but is empty: ${logoPath}`);
    }
  }

  // 3) Favicon path validity
  const faviconMatch = indexHtml.match(/<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (!faviconMatch) {
    fail('No favicon link found in index.html');
  } else {
    const faviconHref = faviconMatch[1];
    if (/^https?:\/\//i.test(faviconHref)) {
      fail(`Favicon should be a local asset path, found external URL: ${faviconHref}`);
    } else {
      const absoluteFaviconPath = toAbsolutePublicPath(faviconHref);
      if (fs.existsSync(absoluteFaviconPath)) {
        pass(`Favicon link resolves to an existing file: ${faviconHref}`);
      } else {
        fail(`Favicon file does not exist for href: ${faviconHref}`);
      }
    }
  }

  // 4) Font declarations
  // Derived from the stylesheet rather than hardcoded: this check named 'Inter'
  // and went quietly green-to-red when the brand moved to Poppins. Ask the real
  // question instead — is every family we style with actually being loaded?
  const declaredFamilies = declaredFontFamilies(indexCss);
  if (declaredFamilies.length === 0) {
    fail('No named font-family declared in index.css');
  } else {
    const unloaded = declaredFamilies.filter((family) => {
      const googleName = family.replace(/ /g, '+');
      const requestedFromGoogle = indexHtml.includes(`family=${googleName}`) || indexCss.includes(`family=${googleName}`);
      const selfHosted = new RegExp(`@font-face[^}]*['"]${family}['"]`, 'i').test(indexCss);
      return !requestedFromGoogle && !selfHosted;
    });

    if (unloaded.length === 0) {
      pass(`Every declared font family is loaded: ${declaredFamilies.join(', ')}`);
    } else {
      fail(`Font family styled but never loaded: ${unloaded.join(', ')}`);
    }
  }

  // 5) Key layout render wiring checks
  // Roles share one shell now: AppLayout is the outer chrome for everyone, and
  // the management area is a nested route inside it, behind ManagementGate.
  if (appTsx.includes('element={<AppLayout')) {
    pass('App routes mount AppLayout as the application shell');
  } else {
    fail('App routes missing AppLayout wiring');
  }

  if (appTsx.includes('<ManagementLayout') && appTsx.includes('<ManagementGate>')) {
    pass('Management area is mounted behind ManagementGate');
  } else {
    fail('Management area missing ManagementLayout and/or its ManagementGate role check');
  }

  if (appLayout.includes('<main') && appLayout.includes('<Outlet />')) {
    pass('AppLayout provides the main content area and an outlet');
  } else {
    fail('AppLayout missing <main> and/or <Outlet /> structure');
  }

  // ManagementLayout renders *inside* AppLayout's <main>, so it must not open a
  // second one — a page with two <main> landmarks is a screen-reader trap.
  if (managementLayout.includes('<Outlet />') && !managementLayout.includes('<main')) {
    pass('ManagementLayout nests an outlet without opening a second <main>');
  } else if (!managementLayout.includes('<Outlet />')) {
    fail('ManagementLayout missing <Outlet /> for its nested admin routes');
  } else {
    fail('ManagementLayout opens a second <main> inside AppLayout');
  }

  report();
}

function report() {
  console.log('\nBranding Regression Checks\n');
  checks.forEach((line) => console.log(line));

  if (failures.length > 0) {
    console.log('\nFailures\n');
    failures.forEach((line) => console.log(line));
    process.exit(1);
  }

  console.log('\nAll branding checks passed.');
}

run();
