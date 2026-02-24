/* eslint-disable */
// Minimal MSW Service Worker placeholder.
// For full MSW, regenerate via: npx msw init public/ --save
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  // Actual request interception is handled by MSW runtime in the page.
  // Worker must exist to satisfy registration.
});
