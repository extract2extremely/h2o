const CACHE_NAME = 'fincollect-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    
    // CSS Files
    './css/styles.css',
    './css/mobile-nav.css',
    './css/currency-professional.css',
    
    // JavaScript Application Files
    './js/app.js',
    './js/db.js',
    './js/ui.js',
    './js/auth.js',
    './js/service-worker-register.js',
    './js/library-manager.js',
    './js/currency-formatter.js',
    './js/pdf-generator.js',
    './js/fix_ui.js',
    
    // PDF Generation Libraries (Local)
    './lib/jspdf/jspdf.umd.min.js',
    './lib/jspdf/jspdf.plugin.autotable.min.js',
    
    // Canvas to Image Library (Local)
    './lib/html2canvas/html2canvas.min.js',
    
    // Chart Library (Local)
    './lib/chartjs/chart.min.js',
    
    // Alert Library (Local)
    './lib/sweetalert2/sweetalert2.min.js',
    
    // Font Awesome (Local)
    './lib/fontawesome/css/all.min.css',
    
    // Font Awesome Webfonts (Local)
    './lib/fontawesome/webfonts/fa-solid-900.woff2',
    './lib/fontawesome/webfonts/fa-solid-900.ttf',
    
    // Fonts
    './fonts/inter.css',
    
    // Manifest
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
