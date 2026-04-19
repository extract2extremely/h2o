/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './js/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      // ═══════════════════════════════════════════
      // COLOR SYSTEM - Matches existing design
      // ═══════════════════════════════════════════
      colors: {
        // Primary Blue
        primary: {
          DEFAULT: '#1e40af',
          light: '#60a5fa',
          dark: '#1e3a8a',
          subtle: '#f0f9ff',
        },
        // Semantic Colors
        success: {
          DEFAULT: '#16a34a',
          subtle: '#dcfce7',
        },
        danger: {
          DEFAULT: '#dc2626',
          subtle: '#fee2e2',
        },
        warning: {
          DEFAULT: '#ea580c',
          subtle: '#fed7aa',
        },
        info: {
          DEFAULT: '#7c3aed',
          subtle: '#f5f3ff',
        },
        // Surface Colors
        surface: {
          primary: '#ffffff',
          secondary: '#f8fafc',
          tertiary: '#f1f5f9',
        },
        // Text Colors
        text: {
          primary: '#0f172a',
          secondary: '#475569',
          tertiary: '#94a3b8',
          inverse: '#ffffff',
        },
        // Navigation Colors (per page)
        nav: {
          dashboard: '#3b82f6',
          users: '#0891b2',
          loans: '#8b5cf6',
          savings: '#22c55e',
          fastinput: '#f59e0b',
          reports: '#ec4899',
          sync: '#0ea5e9',
          records: '#7c3aed',
        },
        // Currency Colors
        taka: {
          DEFAULT: '#2563eb',
          accent: '#1e40af',
        },
        amount: {
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#3b82f6',
        },
      },

      // ═══════════════════════════════════════════
      // TYPOGRAPHY - Fluid sizing with clamp
      // ═══════════════════════════════════════════
      fontSize: {
        xs: 'clamp(0.75rem, 1.5vw, 0.875rem)',
        sm: 'clamp(0.875rem, 1.8vw, 1rem)',
        base: 'clamp(1rem, 2vw, 1.125rem)',
        lg: 'clamp(1.125rem, 2.5vw, 1.375rem)',
        xl: 'clamp(1.25rem, 3vw, 1.5rem)',
        '2xl': 'clamp(1.5rem, 4vw, 2rem)',
        '3xl': 'clamp(1.75rem, 5vw, 2.5rem)',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      lineHeight: {
        tight: '1.2',
        snug: '1.3',
        normal: '1.4',
        relaxed: '1.6',
      },
      letterSpacing: {
        tight: '-0.02em',
        tighter: '-0.015em',
        normal: '-0.01em',
        wide: '0.3px',
      },

      // ═══════════════════════════════════════════
      // SPACING - Matches design system
      // ═══════════════════════════════════════════
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
      },

      // ═══════════════════════════════════════════
      // BORDER RADIUS
      // ═══════════════════════════════════════════
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },

      // ═══════════════════════════════════════════
      // SHADOWS
      // ═══════════════════════════════════════════
      boxShadow: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
        sm: '0 2px 4px rgba(0, 0, 0, 0.08)',
        md: '0 4px 12px rgba(0, 0, 0, 0.1)',
        lg: '0 12px 32px rgba(0, 0, 0, 0.12)',
        xl: '0 20px 60px rgba(0, 0, 0, 0.14)',
      },

      // ═══════════════════════════════════════════
      // TRANSITIONS & ANIMATIONS
      // ═══════════════════════════════════════════
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-out': 'cubic-bezier(0.0, 0, 0.2, 1)',
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
        morphic: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        shimmer: 'shimmer 3s infinite',
        bootProgress: 'bootProgress 1.8s',
        bootPulse: 'bootPulse 2.5s infinite',
        slideUp: 'slideUp 0.3s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1200px 0' },
          '100%': { backgroundPosition: 'calc(1200px + 100%) 0' },
        },
        bootProgress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        bootPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      // ═══════════════════════════════════════════
      // LAYOUT & WIDTH
      // ═══════════════════════════════════════════
      width: {
        sidebar: '250px',
        'sidebar-sm': '220px',
        'sidebar-lg': '280px',
      },
      minHeight: {
        screen: '100vh',
      },

      // ═══════════════════════════════════════════
      // BACKDROP & FILTERS
      // ═══════════════════════════════════════════
      backdropBlur: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      backdropOpacity: {
        light: '.1',
        medium: '.25',
        dark: '.5',
      },

      // ═══════════════════════════════════════════
      // RESPONSIVE GRID COLUMNS
      // ═══════════════════════════════════════════
      gridTemplateColumns: {
        'auto-fit-sm': 'repeat(auto-fit, minmax(300px, 1fr))',
        'auto-fit-md': 'repeat(auto-fit, minmax(250px, 1fr))',
        'auto-fit-lg': 'repeat(auto-fit, minmax(200px, 1fr))',
      },
    },
  },
  plugins: [
    // Add custom component utilities
    function ({ addComponents, theme }) {
      const components = {
        // Button Components
        '.btn': {
          '@apply': 'inline-flex items-center justify-center px-md py-sm rounded-md font-medium transition-all duration-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed': {},
          '&:hover': {
            transform: 'scale(1.05)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
        '.btn-primary': {
          '@apply': 'btn bg-primary text-white hover:bg-primary-dark': {},
        },
        '.btn-secondary': {
          '@apply': 'btn bg-surface-secondary text-text-primary border border-gray-200': {},
        },
        '.btn-success': {
          '@apply': 'btn bg-success text-white hover:bg-success-dark': {},
        },
        '.btn-danger': {
          '@apply': 'btn bg-danger text-white hover:bg-danger-dark': {},
        },

        // Card Components
        '.card': {
          '@apply': 'bg-surface-primary rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-base p-lg': {},
        },
        '.card-elevated': {
          '@apply': 'bg-surface-primary rounded-lg shadow-md hover:shadow-lg transition-shadow duration-base p-lg': {},
        },

        // Form Components
        '.form-group': {
          '@apply': 'flex flex-col gap-sm mb-lg': {},
        },
        '.form-label': {
          '@apply': 'text-sm font-medium text-text-primary': {},
        },
        '.form-input': {
          '@apply': 'w-full px-md py-sm rounded-md border border-gray-300 text-text-primary focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition-all duration-fast': {},
        },

        // Badge Components
        '.badge': {
          '@apply': 'inline-flex items-center px-sm py-xs rounded-full text-xs font-medium': {},
        },
        '.badge-success': {
          '@apply': 'badge bg-success-subtle text-success': {},
        },
        '.badge-danger': {
          '@apply': 'badge bg-danger-subtle text-danger': {},
        },
        '.badge-warning': {
          '@apply': 'badge bg-warning-subtle text-warning': {},
        },
      };
      addComponents(components);
    },
  ],
};