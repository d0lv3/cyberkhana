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

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function toAbsolutePublicPath(urlPath) {
  const cleanPath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
  return path.join(rootDir, 'public', cleanPath);
}

function run() {
  const indexHtmlPath = path.join(rootDir, 'index.html');
  const appTsxPath = path.join(rootDir, 'App.tsx');
  const indexTsxPath = path.join(rootDir, 'index.tsx');
  const appLayoutPath = path.join(rootDir, 'components', 'AppLayout.tsx');
  const adminLayoutPath = path.join(rootDir, 'components', 'AdminLayout.tsx');
  const indexCssPath = path.join(rootDir, 'index.css');

  const indexHtml = readText(indexHtmlPath);
  const appTsx = readText(appTsxPath);
  const indexTsx = readText(indexTsxPath);
  const appLayout = readText(appLayoutPath);
  const adminLayout = readText(adminLayoutPath);
  const indexCss = readText(indexCssPath);

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
  const hasGoogleFontLink = /fonts\.googleapis\.com/i.test(indexHtml);
  const hasInterInCss = /font-family:\s*'Inter'\s*,\s*sans-serif/i.test(indexCss);
  if (hasGoogleFontLink && hasInterInCss) {
    pass('Font source and CSS font-family declaration are present');
  } else {
    fail('Missing font declaration (Google Fonts link and/or CSS font-family)');
  }

  // 5) Key layout render wiring checks
  const appRoutesLayouts = appTsx.includes('element={<AppLayout') && appTsx.includes('element={<AdminLayout');
  if (appRoutesLayouts) {
    pass('App routes include AppLayout and AdminLayout wiring');
  } else {
    fail('App routes missing AppLayout or AdminLayout wiring');
  }

  const layoutsHaveOutletAndMain = [appLayout, adminLayout].every(
    (content) => content.includes('<Outlet />') && content.includes('<main')
  );

  if (layoutsHaveOutletAndMain) {
    pass('Key layout components contain main content area and outlet');
  } else {
    fail('Key layout components missing <main> and/or <Outlet /> structure');
  }

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
