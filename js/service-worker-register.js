if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service Workers only work over HTTPS or localhost (for development)
        // They do NOT work with file:// protocol
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        
        const isSecureContext = 
            protocol === 'https:' || 
            hostname === 'localhost' || 
            hostname === '127.0.0.1' ||
            hostname === '[::1]'; // IPv6 localhost
        
        if (!isSecureContext) {
            console.warn('ServiceWorker: Not registering - app must be served over HTTPS or localhost. Current protocol:', protocol);
            console.warn('To use offline features, run the server with: python server.py');
            return;
        }
        
        navigator.serviceWorker.register('./service-worker.js')
            .then((registration) => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, (err) => {
                console.warn('ServiceWorker registration failed: ', err);
                console.log('The app will continue to work, but without offline caching.');
            });
    });
} else {
    console.log('ServiceWorker: Not supported in this browser');
}

function updateOnlineStatus() {
    const statusElem = document.getElementById('connection-status');
    if (navigator.onLine) {
        statusElem.classList.remove('offline');
        statusElem.classList.add('online');
        statusElem.innerHTML = '<i class="fa-solid fa-wifi"></i> <span>Online</span>';
        // Trigger sync if needed
    } else {
        statusElem.classList.remove('online');
        statusElem.classList.add('offline');
        statusElem.innerHTML = '<i class="fa-solid fa-slash"></i> <span>Offline</span>';
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus(); // Initial check
