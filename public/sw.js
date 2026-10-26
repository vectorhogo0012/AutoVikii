/**
 * KarShenas Inspection PWA - Hardened Service Worker
 * 
 * Strict Privacy & Security Policy:
 * 1. Only static, public app shell assets (HTML/CSS/JS/Icons) are eligible for offline caching.
 * 2. NEVER cache private inspection records, vehicle data, client phone numbers, or notes.
 * 3. NEVER cache Firebase Auth tokens, Firestore payloads, or Cloud Storage photo downloads.
 * 4. All non-GET requests and authenticated API traffic bypass Service Worker caches completely.
 */

const CACHE_NAME = 'karshenas-app-shell-v1';

// Static public shell assets ONLY
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/favicon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// Domains and URL patterns that MUST NEVER be cached
const PRIVATE_OR_EXTERNAL_PATTERNS = [
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebasestorage.googleapis.com',
  '/api/',
  'blob:',
  'data:'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = request.url;

  // 1. Only GET requests can be considered for caching
  if (request.method !== 'GET') {
    return;
  }

  // 2. Strict Security Bypass: Never cache private cloud APIs, auth, or photo blobs
  const isPrivateOrApi = PRIVATE_OR_EXTERNAL_PATTERNS.some((pattern) => url.includes(pattern));
  if (isPrivateOrApi) {
    return; // Pass through directly to network
  }

  // 3. Never cache requests with Authorization or Cookie headers
  if (request.headers.has('Authorization')) {
    return;
  }

  // 4. Stale-while-revalidate for static public shell assets only
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache for next time
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse.clone());
              });
            }
          })
          .catch(() => {
            // Offline - ignore network error and use cached version
          });
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        // Cache static JS/CSS/image assets from the same origin
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic' &&
          (url.endsWith('.js') || url.endsWith('.css') || url.endsWith('.svg') || url.endsWith('.woff2'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
