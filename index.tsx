
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import MarketingApp from './MarketingApp';
import { IS_MARKETING, PLATFORM_ORIGIN } from './config/site';
import './index.css';

/**
 * Send platform routes that arrive on the marketing domain to the platform.
 *
 * Links shared before the split point at the platform through cyberkhana.tech
 * and carry the route in the fragment — cyberkhana.tech/#/dashboard. A fragment
 * is never sent to the server, so no amount of proxy or DNS configuration can
 * catch these; it has to happen in the browser.
 *
 * '#/' is the landing page itself, and '#platform' / '#academy' / '#stats' are
 * section anchors on that page. Only '#/something' is a platform route.
 */
function forwardPlatformRoutes() {
  const { hash } = window.location;
  if (hash.startsWith('#/') && hash !== '#/') {
    window.location.replace(`${PLATFORM_ORIGIN}/${hash}`);
  }
}

if (IS_MARKETING) {
  // On load, before React mounts, so the marketing page never flashes first.
  forwardPlatformRoutes();
  // And again on any later fragment change: changing only the fragment is a
  // same-document navigation, so the page does not reload and the check above
  // would never run a second time.
  window.addEventListener('hashchange', forwardPlatformRoutes);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {IS_MARKETING ? <MarketingApp /> : <App />}
  </React.StrictMode>
);
