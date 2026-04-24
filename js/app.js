// ══════════════════════════════════════════════════════════════════
//  App — Boot orchestrator + router
//  Flow:
//    1. Boot splash appears (HTML default)
//    2. DB opens
//    3. Session checked from localStorage
//       a. Valid session → skip login, go straight to dashboard
//       b. No session    → show login screen
//    4. Splash fades out revealing the correct screen
// ══════════════════════════════════════════════════════════════════

class App {

    constructor() {
        this._boot();
    }

    // ── Boot sequence ─────────────────────────────────────────────────────────
    async _boot() {
        const splash     = document.getElementById('boot-splash');
        const statusEl   = document.getElementById('boot-status');

        const setStatus = (msg) => { if (statusEl) statusEl.textContent = msg; };

        // ① Open IndexedDB
        setStatus('Opening database…');
        try {
            await window.db.open();
            console.log('[App] DB Connected');
        } catch (e) {
            console.error('[App] DB Error', e);
        }

        // ② Setup navigation & mobile menu (safe to do before reveal)
        this.setupNavigation();
        this.setupFloatingSettings();
        this.setupResponsiveHandler();

        // ③ Check existing session
        setStatus('Checking session…');
        const isLoggedIn = localStorage.getItem('fincollect_auth') === 'true';
        const username   = localStorage.getItem('fincollect_user');

        // Small deliberate delay so the splash animation always completes gracefully
        await this._delay(900);

        if (isLoggedIn && username) {
            // ✅ Restore session
            setStatus(`Welcome back, ${username}!`);
            await this._delay(500);

            this._revealApp(splash);
        } else {
            // 🔐 Show login
            setStatus('Please sign in…');
            await this._delay(300);

            this._revealLogin(splash);
        }
    }

    // ── Reveal helpers ────────────────────────────────────────────────────────

    _revealApp(splash) {
        const appContainer = document.getElementById('app-container');

        // Show app underneath before fading splash
        appContainer.style.display = 'flex';

        // Populate profile widget with stored data
        if (window.profileWidget) window.profileWidget._populate();

        // Load dashboard
        this.handleRoute();

        // Fade out splash
        this._hideSplash(splash);

        // ── Auto-Backup: fires 2 minutes after app opens ──────────────────
        setTimeout(async () => {
            if (!navigator.onLine) {
                console.log('[AutoBackup] Skipped — device is offline.');
                return;
            }
            const gasUrl = localStorage.getItem('fincollect_gas_url');
            if (!gasUrl) {
                console.log('[AutoBackup] Skipped — no Apps Script URL configured.');
                return;
            }
            try {
                console.log('[AutoBackup] Starting scheduled backup…');
                if (window.googleDriveManager) {
                    window.googleDriveManager.setScriptUrl(gasUrl);
                    await window.googleDriveManager.createAndSaveBackup('auto');
                }
                localStorage.setItem('fincollect_last_backup', new Date().toISOString());
                console.log('[AutoBackup] Backup completed successfully.');

                // Show a non-intrusive success toast
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: '☁️ Auto-Backup Done',
                        text: 'Your data has been saved to Google Drive.',
                        toast: true,
                        position: 'top-end',
                        timer: 3500,
                        showConfirmButton: false,
                        timerProgressBar: true
                    });
                }
            } catch (e) {
                console.warn('[AutoBackup] Failed silently:', e.message);
                // Auto-backup failures are silent — don't annoy the user
            }
        }, 2 * 60 * 1000); // 2 minutes
        // ─────────────────────────────────────────────────────────────────
    }

    _revealLogin(splash) {
        const loginOverlay = document.getElementById('login-overlay');

        loginOverlay.style.display = 'flex';
        loginOverlay.style.opacity = '0';

        // Fade out splash, then fade in login
        this._hideSplash(splash, () => {
            requestAnimationFrame(() => {
                loginOverlay.style.transition = 'opacity 0.4s ease';
                loginOverlay.style.opacity    = '1';
            });
        });
    }

    _hideSplash(splash, onHidden) {
        if (!splash) { onHidden?.(); return; }
        splash.classList.add('hidden');
        splash.addEventListener('transitionend', () => {
            splash.style.display = 'none';
            onHidden?.();
        }, { once: true });
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ── Navigation ────────────────────────────────────────────────────────────

    setupNavigation() {
        const links = document.querySelectorAll('.nav-links li');
        const mobileNavItems = document.querySelectorAll('nav[aria-label="Mobile navigation"] li');
        
        // Setup desktop sidebar navigation
        links.forEach(link => {
            link.addEventListener('click', () => {
                const page = link.dataset.page;
                this.navigate(page);

                links.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Update mobile nav active state
                mobileNavItems.forEach(item => {
                    if (item.dataset.page === page) {
                        item.classList.add('active');
                        item.classList.remove('hover-effect');
                    } else {
                        item.classList.remove('active');
                        item.classList.add('hover-effect');
                    }
                });

                document.getElementById('sidebar').classList.remove('open');
            });
        });
        
        // Setup mobile bottom navigation
        mobileNavItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigate(page);

                mobileNavItems.forEach(el => {
                    if (el.dataset.page === page) {
                        el.classList.add('active');
                        el.classList.remove('hover-effect');
                    } else {
                        el.classList.remove('active');
                        el.classList.add('hover-effect');
                    }
                });
                
                // Update sidebar nav active state
                links.forEach(link => {
                    if (link.dataset.page === page) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            });
        });
        
        // Set initial active state for mobile nav
        mobileNavItems.forEach(item => {
            if (!item.classList.contains('active')) {
                item.classList.add('hover-effect');
            }
        });
    }


    setupFloatingSettings() {
        const settingsBtn = document.getElementById('floating-settings-btn');
        const floatingMenu = document.getElementById('floating-menu');
        const menuItems = floatingMenu?.querySelectorAll('.floating-menu-item');
        const reportsItem = floatingMenu?.querySelector('[data-page="reports"]');
        const syncItem = floatingMenu?.querySelector('[data-page="sync"]');

        if (!settingsBtn || !floatingMenu) return;

        // Function to update menu items visibility based on screen size
        const updateMenuItemsVisibility = () => {
            const isSmallScreen = window.innerWidth < 415;
            if (reportsItem) {
                reportsItem.style.display = isSmallScreen ? 'none' : 'flex';
            }
            if (syncItem) {
                syncItem.style.display = isSmallScreen ? 'none' : 'flex';
            }
        };

        // Call on initial setup
        updateMenuItemsVisibility();

        // Listen for resize events
        window.addEventListener('resize', updateMenuItemsVisibility);
        window.addEventListener('orientationchange', updateMenuItemsVisibility);

        // Toggle menu when settings button is clicked
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            floatingMenu.classList.toggle('open');
            settingsBtn.setAttribute('aria-expanded', floatingMenu.classList.contains('open'));
        });

        // Handle menu item clicks
        menuItems?.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigate(page);
                floatingMenu.classList.remove('open');
                settingsBtn.setAttribute('aria-expanded', 'false');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            const isClickInsideMenu = floatingMenu.contains(e.target);
            const isClickOnButton = settingsBtn.contains(e.target);
            const isMenuOpen = floatingMenu.classList.contains('open');

            if (isMenuOpen && !isClickInsideMenu && !isClickOnButton) {
                floatingMenu.classList.remove('open');
                settingsBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && floatingMenu.classList.contains('open')) {
                floatingMenu.classList.remove('open');
                settingsBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    setupResponsiveHandler() {
        const settingsBtn = document.getElementById('floating-settings-btn');
        const floatingMenu = document.getElementById('floating-menu');

        const updateFloatingButtonVisibility = () => {
            const isMobileScreen = window.innerWidth <= 767;
            const appContainer = document.getElementById('app-container');
            const isOnDashboard = appContainer?.querySelector('[data-page="dashboard"]') !== null || 
                                 document.querySelector('.view-container')?.innerHTML.includes('dashboard');

            if (settingsBtn) {
                // Show on mobile screens AND when on dashboard
                if (isMobileScreen && isOnDashboard) {
                    settingsBtn.style.display = 'flex';
                } else {
                    settingsBtn.style.display = 'none';
                    floatingMenu?.classList.remove('open');
                }
            }
        };

        // Call on initial load
        updateFloatingButtonVisibility();

        // Listen for window resize events (for orientation changes and manual resizing)
        window.addEventListener('resize', () => {
            updateFloatingButtonVisibility();
        });

        // Listen for orientation change (mobile devices)
        window.addEventListener('orientationchange', () => {
            updateFloatingButtonVisibility();
        });
    }

    navigate(page, param = null) {
        // Show/hide floating settings button on mobile screens when on dashboard
        const settingsBtn = document.getElementById('floating-settings-btn');
        const floatingMenu = document.getElementById('floating-menu');
        const isMobileScreen = window.innerWidth <= 767;
        
        if (settingsBtn) {
            if (page === 'dashboard' && isMobileScreen) {
                settingsBtn.style.display = 'flex';
            } else {
                settingsBtn.style.display = 'none';
                floatingMenu?.classList.remove('open');
                settingsBtn.setAttribute('aria-expanded', 'false');
            }
        }

        switch (page) {
            case 'dashboard':         window.ui.renderDashboard();               break;
            case 'borrowers':         window.ui.renderBorrowerList();            break;
            case 'loan-detail':       window.ui.renderLoanDetail(param);         break;
            case 'loans':             window.ui.renderLoanList();                break;
            case 'add-loan':          window.ui.renderAddLoan(param);            break;
            case 'reports':           window.ui.renderReports();                 break;
            case 'add-borrower':      window.ui.renderAddBorrower(param);        break;
            case 'borrower-detail':   window.ui.renderBorrowerDetail(param);     break;
            case 'fast-collection':   window.ui.renderFastCollection();          break;
            case 'complete-records':  window.ui.renderCompleteRecords();         break;
            case 'savings':           window.ui.renderSavingsList();             break;
            case 'add-savings':       window.ui.renderAddSavings(param);         break;
            case 'savings-detail':    window.ui.renderSavingsDetail(param);      break;
            case 'savings-types':     window.ui.renderSavingsTypes();            break;
            case 'add-savings-type':  window.ui.renderAddSavingsType(param);     break;
            case 'sync':             window.ui.renderGoogleDriveBackup();       break;
            default:
                window.ui.renderDashboard();
        }
    }

    handleRoute() {
        this.navigate('dashboard');
    }
}

// Boot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
