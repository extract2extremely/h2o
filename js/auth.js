class Auth {
    constructor() {
        // Obfuscated Google Sheet Public CSV Export Endpoint
        this._endpoint = atob('aHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vc3ByZWFkc2hlZXRzL2QvZS8yUEFDWC0xdlN6b0NJN2dlQmlGbXROUDg4WlJIdlpsTnV6dWRXbUNIeHliUkw2eGpxMVk3ZkxVeEh3VzF1SDdPWnNqMkcyVGFnbE0xNEs3aVBJaFF3Yy9wdWI/b3V0cHV0PWNzdg==');

        // Ordered list of CORS strategies: direct first, then fallback proxies
        this._proxyStrategies = [
            (url) => url,                                                               // 1. Direct (works when sheet is published)
            (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,  // 2. allorigins
            (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,               // 3. corsproxy.io
            (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, // 4. codetabs
        ];

        this._TIMEOUT_MS = 8000;

        // Login Tracker Endpoint (replace with deployed Apps Script Web App URL)
        this._trackerEndpoint = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';

        // Enter key listeners
        document.getElementById('login-password')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        document.getElementById('login-username')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
    }

    // ─── Core: Fetch CSV with waterfall proxy fallback ────────────────────────

    async _fetchCSV() {
        let lastError = null;

        for (let i = 0; i < this._proxyStrategies.length; i++) {
            const strategyFn = this._proxyStrategies[i];
            const targetUrl  = strategyFn(this._endpoint);
            const label      = i === 0 ? 'Direct' : `Proxy-${i}`;

            try {
                console.info(`[Auth] Trying ${label}:`, targetUrl);

                const controller = new AbortController();
                const timerId    = setTimeout(() => controller.abort(), this._TIMEOUT_MS);

                const res = await fetch(targetUrl, {
                    signal: controller.signal,
                    // No 'mode: cors' override — let the browser decide
                    cache:  'no-store',
                });
                clearTimeout(timerId);

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status} ${res.statusText}`);
                }

                const text = await res.text();

                // Sanity check: Google Sheet CSV starts with column headers, not HTML
                if (text.trim().startsWith('<')) {
                    throw new Error('Received HTML instead of CSV — sheet may not be published.');
                }

                console.info(`[Auth] ✅ Success via ${label}`);
                return text;

            } catch (err) {
                console.warn(`[Auth] ❌ ${label} failed:`, err.message);
                lastError = err;
                // Continue to next strategy
            }
        }

        // All strategies exhausted
        throw new Error(`All authentication endpoints failed. Last error: ${lastError?.message}`);
    }

    // ─── Login Handler ────────────────────────────────────────────────────────

    async handleLogin() {
        const usernameInput = document.getElementById('login-username').value.trim();
        const passwordInput = document.getElementById('login-password').value.trim();
        const btn           = document.getElementById('login-btn');
        const errDiv        = document.getElementById('login-error');

        // Reset error
        errDiv.textContent = '';
        errDiv.style.color = '#fca5a5';

        if (!usernameInput || !passwordInput) {
            this._showError(errDiv, '⚠️ Please enter your username and password.');
            return;
        }

        const originalHTML = btn.innerHTML;
        btn.disabled  = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating…';

        try {
            const csvText = await this._fetchCSV();
            const users   = this._parseCSV(csvText);

            if (users.length === 0) {
                throw new Error('User list is empty. Check your Google Sheet is published correctly.');
            }

            const match = users.find(u =>
                (u.gmail.toLowerCase() === usernameInput.toLowerCase() ||
                 u.user.toLowerCase()  === usernameInput.toLowerCase()) &&
                u.password === passwordInput
            );

            if (match) {
                this._onLoginSuccess(match);
            } else {
                this._showError(errDiv, '❌ Invalid credentials. Please try again.');
                btn.disabled  = false;
                btn.innerHTML = originalHTML;
            }

        } catch (err) {
            console.error('[Auth] Login error:', err);
            this._showError(errDiv, this._friendlyError(err));
            btn.disabled  = false;
            btn.innerHTML = originalHTML;
        }
    }

    // ─── Success ──────────────────────────────────────────────────────────────

    _onLoginSuccess(user) {
        // Persist session data
        localStorage.setItem('fincollect_auth',       'true');
        localStorage.setItem('fincollect_user',       user.user);
        localStorage.setItem('fincollect_gmail',      user.gmail);
        localStorage.setItem('fincollect_login_time', new Date().toISOString());
        localStorage.setItem('fincollect_icon',       user.icon_link || '');

        const overlay = document.getElementById('login-overlay');
        overlay.style.transition = 'opacity 0.5s ease';
        overlay.style.opacity    = '0';

        setTimeout(() => {
            overlay.style.display = 'none';
            const app = document.getElementById('app-container');
            app.style.display = 'flex';

            // Refresh profile widget with real data
            if (window.profileWidget) window.profileWidget._populate();

            if (window.app) window.app.handleRoute();
            
            // Fire tracking silently in background
            this._trackLogin(user);
        }, 500);
    }

    // ─── Login Tracker ────────────────────────────────────────────────────────

    async _trackLogin(user) {
        if (!this._trackerEndpoint || this._trackerEndpoint === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
            console.warn('[Auth] Login tracking skipped: Tracker URL not set.');
            return;
        }

        try {
            // 1. Fetch Location & IP info
            let ip = '—';
            let location = '—';
            try {
                // Free API for basic IP/location (no auth needed for client-side)
                const locRes = await fetch('https://ipapi.co/json/');
                if (locRes.ok) {
                    const locData = await locRes.json();
                    ip = locData.ip || '—';
                    location = `${locData.city || ''}, ${locData.region || ''}, ${locData.country_name || ''}`.replace(/^[,\s]+|[,\s]+$/g, '').replace(/,\s*,/g, ',');
                }
            } catch (e) {
                console.warn('[Auth] Could not fetch location details.');
            }

            // 2. Prepare Payload
            const payload = {
                gmail:     user.gmail,
                username:  user.user,
                timestamp: new Date().toISOString(),
                location:  location,
                ip:        ip,
                device:    navigator.platform || '—',
                browser:   navigator.userAgent || '—'
            };

            // 3. Post to Google Apps Script
            // We use 'no-cors' so the browser doesn't block the request if the server doesn't respond with CORS headers.
            fetch(this._trackerEndpoint, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            }).catch(e => console.warn('[Auth] Tracker ping failed: ', e));

        } catch (err) {
            console.error('[Auth] Tracker master error:', err);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    _showError(el, msg) {
        el.textContent = msg;
        el.style.color = '#fca5a5';
    }

    _friendlyError(err) {
        if (err.name === 'AbortError') {
            return '⏱️ Connection timed out. Check your internet and try again.';
        }
        if (err.message.includes('HTML instead of CSV')) {
            return '📄 Sheet not published. Go to File → Share → Publish to web → CSV.';
        }
        if (err.message.includes('All authentication endpoints failed')) {
            return '🌐 Network unreachable. Check internet connection and try again.';
        }
        return `⚠️ Auth error: ${err.message}`;
    }

    // ─── Professional CSV Parser (handles quoted fields & commas) ─────────────

    _parseCSV(text) {
        const rows  = [];
        const lines = text.split(/\r?\n/);

        // Skip header row (index 0)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const fields = this._splitCSVLine(line);
            if (fields.length >= 3) {
                rows.push({
                    gmail:     fields[0],
                    user:      fields[1],
                    password:  fields[2],
                    icon_link: fields[3] || '', // 4th column (optional)
                });
            }
        }
        return rows;
    }

    _splitCSVLine(line) {
        const result  = [];
        let   current = '';
        let   inQuote = false;

        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
                else inQuote = !inQuote;
            } else if (ch === ',' && !inQuote) {
                result.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        result.push(current.trim());
        return result;
    }
}

// ─── Backwards-compatible alias ───────────────────────────────────────────────
Auth.prototype.parseCSV = Auth.prototype._parseCSV;


// ══════════════════════════════════════════════════════════════════
//  ProfileWidget — manages the top-bar user profile dropdown
// ══════════════════════════════════════════════════════════════════
class ProfileWidget {

    constructor() {
        this._widget   = document.getElementById('profile-widget');
        this._trigger  = document.getElementById('profile-trigger');
        this._dropdown = document.getElementById('profile-dropdown');
        this._logoutBtn = document.getElementById('logout-btn');

        if (!this._trigger) return; // not in DOM yet

        this._trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggle();
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this._widget.contains(e.target)) this._close();
        });

        // Logout
        this._logoutBtn?.addEventListener('click', () => this._logout());

        // Populate from localStorage
        this._populate();
    }

    // ── Toggle open/close ──────────────────────────────────────────
    _toggle() {
        this._widget.classList.toggle('open');
    }

    _close() {
        this._widget.classList.remove('open');
    }

    // ── Populate profile data from localStorage ────────────────────
    _populate() {
        const username  = localStorage.getItem('fincollect_user')  || 'Admin';
        const email     = localStorage.getItem('fincollect_gmail') || '—';
        const loginTime = localStorage.getItem('fincollect_login_time');
        const iconLink  = localStorage.getItem('fincollect_icon')  || '';

        // Name
        const nameEls = [
            document.getElementById('profile-name-short'),
            document.getElementById('dropdown-name'),
        ];
        nameEls.forEach(el => { if (el) el.textContent = username; });

        // Email
        const emailEl = document.getElementById('dropdown-email');
        if (emailEl) emailEl.textContent = email;

        // ── Avatar logic ─────────────────────────────────────────────
        // Fallback URLs (initials) used when real photo fails or is absent
        const fallbackSm = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=2563eb&color=fff&bold=true&size=40`;
        const fallbackLg = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=2563eb&color=fff&bold=true&size=64`;

        const smallAvatar = document.getElementById('profile-avatar');
        const bigAvatar   = document.getElementById('dropdown-avatar');

        if (iconLink) {
            // Load real photo — fall back silently on error
            this._setAvatarWithFallback(smallAvatar, iconLink, fallbackSm);
            this._setAvatarWithFallback(bigAvatar,   iconLink, fallbackLg);

            // Remove rounded pill look on trigger — show as clean circle photo
            smallAvatar?.classList.add('profile-avatar-photo');
        } else {
            if (smallAvatar) smallAvatar.src = fallbackSm;
            if (bigAvatar)   bigAvatar.src   = fallbackLg;
            smallAvatar?.classList.remove('profile-avatar-photo');
        }

        // Login time
        const timeEl = document.getElementById('login-time-display');
        if (timeEl && loginTime) {
            const d = new Date(loginTime);
            timeEl.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (timeEl) {
            timeEl.textContent = 'This session';
        }
    }

    // ── Normalize any Google Drive URL → open-CORS CDN format ──────
    _normalizeDriveUrl(url) {
        if (!url) return url;
        if (url.includes('lh3.googleusercontent.com')) return url;

        let fileId = null;
        const ucMatch   = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (ucMatch) fileId = ucMatch[1];
        if (!fileId) {
            const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (fileMatch) fileId = fileMatch[1];
        }
        return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : url;
    }

    // ── Smart avatar loader with graceful fallback ─────────────────
    _setAvatarWithFallback(imgEl, src, fallback) {
        if (!imgEl) return;
        const resolvedSrc = this._normalizeDriveUrl(src);

        imgEl.style.objectFit      = 'cover';
        imgEl.style.background     = 'linear-gradient(90deg,#e2e8f0 25%,#f8fafc 50%,#e2e8f0 75%)';
        imgEl.style.backgroundSize = '200% 100%';

        const testImg   = new Image();
        testImg.onload  = () => {
            imgEl.src              = resolvedSrc;
            imgEl.style.background = '';
        };
        testImg.onerror = () => {
            console.warn(`[ProfileWidget] Icon failed (${resolvedSrc}), using initials.`);
            imgEl.src              = fallback;
            imgEl.style.background = '';
        };
        testImg.src = resolvedSrc;
    }

    // ── Logout ─────────────────────────────────────────────────────
    _logout() {
        // Clear all session data from localStorage
        localStorage.removeItem('fincollect_auth');
        localStorage.removeItem('fincollect_user');
        localStorage.removeItem('fincollect_gmail');
        localStorage.removeItem('fincollect_login_time');
        localStorage.removeItem('fincollect_icon');

        this._close();

        // Animate out app → show login
        const appContainer   = document.getElementById('app-container');
        const loginOverlay   = document.getElementById('login-overlay');
        const loginUsername  = document.getElementById('login-username');
        const loginPassword  = document.getElementById('login-password');
        const loginError     = document.getElementById('login-error');

        if (appContainer)  appContainer.style.display = 'none';

        if (loginOverlay) {
            loginOverlay.style.opacity   = '0';
            loginOverlay.style.display   = 'flex';
            requestAnimationFrame(() => {
                loginOverlay.style.transition = 'opacity 0.4s ease';
                loginOverlay.style.opacity    = '1';
            });
        }

        // Clear inputs
        if (loginUsername)  loginUsername.value = '';
        if (loginPassword)  loginPassword.value = '';
        if (loginError)     loginError.textContent = '';
    }
}


// ══════════════════════════════════════════════════════════════════
//  Boot
// ══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    window.auth          = new Auth();
    window.profileWidget = new ProfileWidget();
});

