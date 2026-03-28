const CACHE_NAME = 'rentpro-app-v3';

// In sabhi files ko pehli baar internet on hone par save kar lega
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/app.js',
    './js/db.js',
    './js/utils.js',
    './components/inventory.js',
    './components/rentOut.js',
    './components/returnBill.js',
    './components/customers.js',
    './components/settings.js',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    // Bootstrap & FontAwesome ko bhi cache karne ki koshish karega
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 1. INSTALL EVENT - App install hote hi files ko Cache me daalna
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache and saving core assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    // Naya service worker turant active ho jaye
    self.skipWaiting();
});

// 2. ACTIVATE EVENT - Purane cache ko delete karna (agar version update hua ho)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. FETCH EVENT - Offline hone par Cache se files dikhana
self.addEventListener('fetch', (event) => {
    // Sirf GET requests ko handle karega (jaise page load, CSS, JS load)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Agar file cache me mil gayi (offline), toh wahi return kardo
            if (cachedResponse) {
                return cachedResponse;
            }

            // Agar nahi mili, toh internet (network) se fetch karo
            return fetch(event.request).then((networkResponse) => {
                // Fetch ki hui nayi file ko bhi cache me save kar lo future ke liye
                // (Lekin sirf tab jab response proper ho)
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // Agar internet bhi band hai aur file cache me bhi nahi hai
                // Toh app crash hone se bachane ke liye (optional - fallback page dikha sakte hain)
                console.log("Offline and resource not found in cache.");
            });
        })
    );
});