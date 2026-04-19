# Tailwind CSS Class Conversion Reference

## Quick Reference: Old CSS → Tailwind Utilities

### Layout & Structure

```html
<!-- OLD CSS -->
<div class="app-container">
  <div class="sidebar">Navigation</div>
  <div class="main-content">
    <div class="top-bar">Header</div>
    <div class="view-container">Content</div>
  </div>
</div>

<!-- NEW TAILWIND -->
<div class="grid grid-cols-1 md:grid-cols-[250px_1fr] min-h-screen bg-surface-secondary">
  <!-- Sidebar - Hidden on mobile, visible on desktop -->
  <aside class="hidden md:flex flex-col bg-surface-primary border-r border-gray-100 p-lg overflow-y-auto">
    Navigation
  </aside>
  
  <!-- Main Content -->
  <div class="flex flex-col h-screen md:h-auto pb-24 md:pb-0">
    <!-- Top Bar -->
    <header class="sticky top-0 z-40 bg-surface-primary border-b border-gray-100 px-lg py-md shadow-sm flex items-center justify-between">
      Header
    </header>
    
    <!-- Content Area -->
    <main class="flex-1 overflow-y-auto p-lg md:p-2xl">
      Content
    </main>
  </div>
</div>
```

### Navigation

```html
<!-- OLD CSS -->
<ul class="nav-links">
  <li class="active">Dashboard</li>
  <li>Users</li>
  <li>Loans</li>
</ul>

<!-- NEW TAILWIND -->
<!-- Desktop Navigation (Sidebar) -->
<ul class="hidden md:flex flex-col gap-xs">
  <li class="px-md py-sm rounded-md cursor-pointer text-text-secondary font-medium hover:bg-surface-secondary hover:text-primary transition-all duration-base active:bg-primary active:text-white">
    Dashboard
  </li>
  <li class="px-md py-sm rounded-md cursor-pointer text-text-secondary font-medium hover:bg-surface-secondary hover:text-primary transition-all duration-base">
    Users
  </li>
</ul>

<!-- Mobile Bottom Navigation -->
<nav class="fixed md:hidden bottom-0 left-0 right-0 bg-surface-primary border-t border-gray-100 flex justify-around pb-safe">
  <div class="flex flex-col items-center gap-sm p-sm cursor-pointer text-text-secondary hover:text-primary transition-smooth">
    <i class="fa-solid fa-chart-line text-2xl"></i>
    <span class="text-xs">Dashboard</span>
  </div>
  <!-- More nav items -->
</nav>
```

### Cards & Content

```html
<!-- OLD CSS -->
<div class="card">
  <h3>Title</h3>
  <p>Content</p>
</div>

<!-- NEW TAILWIND -->
<div class="bg-surface-primary rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-base p-lg">
  <h3 class="text-lg font-semibold text-text-primary mb-md">Title</h3>
  <p class="text-text-secondary">Content</p>
</div>
```

### Stat Cards

```html
<!-- OLD CSS -->
<div class="stat-card">
  <p class="stat-label">Total Users</p>
  <div class="stat-value">1,234</div>
  <p class="stat-change positive">↑ 12%</p>
</div>

<!-- NEW TAILWIND -->
<div class="bg-gradient-to-br from-surface-primary to-surface-secondary rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all duration-base p-lg">
  <p class="text-sm text-text-secondary font-medium">Total Users</p>
  <div class="text-3xl font-bold text-primary mt-md">1,234</div>
  <p class="text-xs font-medium text-success mt-sm">↑ 12% from last month</p>
</div>
```

### Buttons

```html
<!-- OLD CSS -->
<button class="btn btn-primary">Save</button>
<button class="btn btn-secondary">Cancel</button>
<button class="btn btn-danger">Delete</button>

<!-- NEW TAILWIND -->
<!-- Primary Button -->
<button class="inline-flex items-center justify-center px-md py-sm rounded-md font-medium transition-all duration-base cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-white hover:bg-primary-dark">
  Save
</button>

<!-- Secondary Button -->
<button class="inline-flex items-center justify-center px-md py-sm rounded-md font-medium transition-all duration-base cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-surface-secondary text-text-primary border border-gray-200">
  Cancel
</button>

<!-- Danger Button -->
<button class="inline-flex items-center justify-center px-md py-sm rounded-md font-medium transition-all duration-base cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-danger text-white hover:bg-danger-dark">
  Delete
</button>
```

### Forms

```html
<!-- OLD CSS -->
<div class="form-group">
  <label for="email" class="form-label">Email</label>
  <input type="email" id="email" class="form-input" placeholder="you@example.com">
</div>

<!-- NEW TAILWIND -->
<div class="flex flex-col gap-sm mb-lg">
  <label for="email" class="text-sm font-medium text-text-primary">Email</label>
  <input type="email" id="email" class="w-full px-md py-sm rounded-md border border-gray-300 text-text-primary focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition-all duration-fast placeholder:text-text-tertiary" placeholder="you@example.com">
</div>
```

### Status Badges

```html
<!-- OLD CSS -->
<span class="status-badge active">Active</span>
<span class="status-badge pending">Pending</span>

<!-- NEW TAILWIND -->
<!-- Active Badge -->
<span class="inline-flex items-center px-sm py-xs rounded-full text-xs font-medium bg-success-subtle text-success">
  Active
</span>

<!-- Pending Badge -->
<span class="inline-flex items-center px-sm py-xs rounded-full text-xs font-medium bg-warning-subtle text-warning">
  Pending
</span>
```

### Tables

```html
<!-- OLD CSS -->
<div class="table-container">
  <table class="savings-schedule-table">
    <thead>
      <tr>
        <th>Date</th>
        <th>Amount</th>
      </tr>
    </thead>
  </table>
</div>

<!-- NEW TAILWIND -->
<div class="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
  <table class="w-full border-collapse">
    <thead class="bg-surface-secondary">
      <tr>
        <th class="text-left px-md py-sm text-sm font-semibold text-text-primary border-b border-gray-200">Date</th>
        <th class="text-left px-md py-sm text-sm font-semibold text-text-primary border-b border-gray-200">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr class="hover:bg-surface-secondary transition-colors duration-fast border-b border-gray-100">
        <td class="px-md py-sm border-b border-gray-100 text-sm text-text-secondary">2025-04-20</td>
        <td class="px-md py-sm border-b border-gray-100 text-sm text-text-secondary">৳ 5,000</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Floating Action Button (FAB)

```html
<!-- OLD CSS -->
<button class="fab">+</button>

<!-- NEW TAILWIND -->
<button class="fixed bottom-8 right-6 md:bottom-32 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-dark shadow-lg hover:shadow-xl text-white flex items-center justify-center text-2xl cursor-pointer transition-all duration-base hover:scale-105 active:scale-95 z-40">
  <i class="fa-solid fa-plus"></i>
</button>
```

### Floating Menu

```html
<!-- OLD CSS -->
<div class="floating-menu">
  <div class="floating-menu-item">Reports</div>
  <div class="floating-menu-item">Sync</div>
</div>

<!-- NEW TAILWIND -->
<div class="fixed bottom-24 right-6 bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-xl p-md z-30 min-w-max">
  <div class="px-lg py-md flex items-center gap-md cursor-pointer hover:bg-surface-secondary rounded-md transition-all duration-fast">
    <i class="fa-solid fa-chart-pie"></i>
    <span>Reports</span>
  </div>
  <div class="px-lg py-md flex items-center gap-md cursor-pointer hover:bg-surface-secondary rounded-md transition-all duration-fast">
    <i class="fa-solid fa-sync"></i>
    <span>Sync</span>
  </div>
</div>
```

### Login Glass Card

```html
<!-- OLD CSS -->
<div class="login-glass-card">
  <h1>Welcome Back</h1>
  <form>...</form>
</div>

<!-- NEW TAILWIND -->
<div class="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl p-2xl shadow-2xl border border-white border-opacity-30 max-w-md">
  <h1 class="text-3xl font-bold text-primary mb-md text-center">Welcome Back</h1>
  <form>
    <!-- Form fields -->
  </form>
</div>
```

### Boot/Splash Screen

```html
<!-- OLD CSS -->
<div id="boot-splash" class="boot-splash">
  <div class="boot-icon-ring">
    <i class="fa-solid fa-wallet boot-icon"></i>
  </div>
</div>

<!-- NEW TAILWIND -->
<div id="boot-splash" class="fixed inset-0 bg-gradient-to-br from-surface-primary to-surface-secondary flex flex-col items-center justify-center z-50">
  <div class="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
    <i class="fa-solid fa-wallet text-4xl text-white"></i>
  </div>
  <p class="text-2xl font-bold text-primary mt-lg">FinCollect</p>
  <p class="text-sm text-text-secondary">Daily Collection Manager</p>
</div>
```

### Responsive Grid

```html
<!-- OLD CSS -->
<!-- Auto-fit grid with flexible columns -->

<!-- NEW TAILWIND -->
<!-- 1 column mobile, 2 columns tablet, 3 columns desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
</div>

<!-- Auto-fit grid (250px min-width per column) -->
<div class="grid grid-cols-auto-fit-md gap-lg">
  <div class="card">Auto Card 1</div>
  <div class="card">Auto Card 2</div>
  <div class="card">Auto Card 3</div>
</div>
```

### Responsive Padding

```html
<!-- OLD CSS -->
<div class="view-container">Content</div>

<!-- NEW TAILWIND -->
<!-- Small padding on mobile, large on desktop -->
<main class="flex-1 overflow-y-auto p-md md:p-lg lg:p-2xl">
  Content with responsive padding
</main>
```

### Responsive Text

```html
<!-- OLD CSS - Uses CSS variable for fluid typography -->
<h1 style="font-size: var(--text-3xl);">Title</h1>

<!-- NEW TAILWIND - Built-in clamp() sizing -->
<h1 class="text-3xl">Title (automatically scales 1.75rem-2.5rem)</h1>

<!-- Or combine with responsive classes -->
<h1 class="text-2xl md:text-3xl lg:text-4xl">Responsive heading</h1>
```

### Currency Display

```html
<!-- OLD CSS -->
<div class="currency-amount large">
  <span class="taka-sign">৳</span>
  <span>15,000</span>
</div>

<!-- NEW TAILWIND -->
<div class="inline-flex items-center gap-sm font-semibold tracking-wide text-2xl">
  <span class="text-taka font-black inline-flex items-center" style="font-size: 1.1em; margin-right: 2px;">৳</span>
  <span>15,000</span>
</div>
```

---

## Responsive Breakpoint Examples

```html
<!-- Show different content based on device -->
<div class="hidden md:block">
  <!-- Only visible on desktop (768px+) -->
</div>

<div class="md:hidden">
  <!-- Hidden on desktop, visible on mobile -->
</div>

<!-- Responsive layout -->
<div class="flex flex-col md:flex-row">
  <div class="md:w-1/3">Left column</div>
  <div class="md:flex-1">Main content</div>
</div>

<!-- Responsive grid that adapts -->
<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-md">
  <!-- Automatically adjusts columns per breakpoint -->
</div>
```

---

## Tips & Best Practices

1. **Use Tailwind Utilities First**: Before adding custom CSS, check if Tailwind has a utility
2. **Responsive Utilities**: Use `md:`, `lg:` prefixes for responsive design
3. **Consistency**: Use design system colors instead of arbitrary values
4. **Mobile-First**: Always start with mobile design, add desktop utilities with `md:` prefix
5. **Component Classes**: Use `.btn`, `.card`, etc. for repeated patterns
6. **Avoid Custom CSS**: Minimize custom CSS files, use Tailwind utilities instead

---

## Common Mistakes to Avoid

❌ **Wrong**: `<div class="text-16px">`
✅ **Right**: `<div class="text-lg">`

❌ **Wrong**: Mixing unit prefixes: `class="md:text-2xl lg:text-18px"`
✅ **Right**: `class="text-xl md:text-2xl lg:text-3xl"`

❌ **Wrong**: Using wrong spacing: `class="p-100"`
✅ **Right**: `class="p-lg"` or `class="p-2xl"`

❌ **Wrong**: Hardcoding colors: `style="color: #1e40af"`
✅ **Right**: `class="text-primary"`