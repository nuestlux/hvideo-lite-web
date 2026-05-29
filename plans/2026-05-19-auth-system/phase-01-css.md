# Phase 1: CSS — Auth & Profile Styles

## Overview

Add CSS styles for:
- Full-screen auth page (login/register/forgot/verify)
- Auth form elements (inputs, buttons, dividers, OAuth buttons)
- Profile page layout
- Sidebar logout button

Insert all styles **after** the existing `/* BUTTONS */` section (line ~75) or in a new `/* AUTH */` section near the end of the existing CSS block.

## Styles to Add

### Auth Page Layout
```css
/* AUTH */
.auth-page{position:fixed;inset:0;background:linear-gradient(135deg,#0a0a1a 0%,#1a1a3e 50%,#0f0f2e 100%);display:flex;align-items:center;justify-content:center;z-index:9999}
.auth-card{background:var(--bg-elevated);border:1px solid var(--border);border-radius:16px;padding:36px;width:100%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.auth-logo{text-align:center;margin-bottom:28px}
.auth-logo .logo-icon{font-size:36px}
.auth-logo .logo-text{font-size:20px;font-weight:700;margin-top:4px}
.auth-logo .logo-sub{font-size:12px;color:var(--text-tertiary);margin-top:2px}
.auth-title{font-size:18px;font-weight:600;margin-bottom:4px}
.auth-subtitle{font-size:13px;color:var(--text-tertiary);margin-bottom:20px}
```

### Auth Form Elements
```css
.auth-field{margin-bottom:16px}
.auth-field label{display:block;font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:6px}
.auth-input{width:100%;padding:10px 14px;background:var(--bg-container);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:14px;outline:none;font-family:inherit;transition:border-color .2s;box-sizing:border-box}
.auth-input:focus{border-color:var(--primary)}
.auth-input.error{border-color:var(--danger)}
.auth-input-wrap{position:relative}
.auth-input-wrap .toggle-pwd{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--text-tertiary);cursor:pointer;font-size:14px;padding:4px}
```

### Auth Options & Buttons
```css
.auth-options{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;font-size:13px}
.auth-options label{display:flex;align-items:center;gap:6px;color:var(--text-secondary);cursor:pointer}
.auth-options input[type=checkbox]{accent-color:var(--primary)}
.auth-btn{width:100%;padding:12px;border:none;border-radius:var(--radius-sm);font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s}
.auth-btn.primary{background:var(--primary);color:#fff}
.auth-btn.primary:hover{background:var(--primary-hover)}
.auth-btn.primary:disabled{opacity:.4;cursor:not-allowed}
.auth-divider{display:flex;align-items:center;gap:12px;margin:20px 0;color:var(--text-tertiary);font-size:12px}
.auth-divider:before,.auth-divider:after{content:'';flex:1;height:1px;background:var(--border)}
```

### OAuth Buttons
```css
.oauth-row{display:flex;gap:12px}
.oauth-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg-container);color:var(--text-primary);font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;font-family:inherit}
.oauth-btn:hover{background:var(--bg-hover);border-color:var(--primary)}
.oauth-btn .oauth-icon{font-size:18px}
```

### Auth Links & Messages
```css
.auth-links{text-align:center;margin-top:20px;font-size:13px;color:var(--text-tertiary)}
.auth-links a{color:var(--primary);cursor:pointer;text-decoration:none;font-weight:500}
.auth-links a:hover{text-decoration:underline}
.auth-error{color:var(--danger);font-size:12px;margin-top:4px;display:none}
.auth-success-msg{text-align:center;padding:12px;background:var(--success-bg);border:1px solid var(--success-border);border-radius:var(--radius-sm);color:var(--success);font-size:13px;margin-bottom:16px}
.auth-verify-banner{display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--warning-bg);border:1px solid var(--warning-border);border-radius:var(--radius-sm);font-size:13px;color:var(--warning);margin-bottom:16px}
```

### Profile Page Styles
```css
/* PROFILE */
.profile-layout{display:grid;grid-template-columns:auto 1fr;gap:24px}
.profile-avatar{width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff}
.profile-fields{flex:1}
.profile-section{margin-bottom:24px}
.profile-section-title{font-size:15px;font-weight:600;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid var(--border-light)}
.profile-field{margin-bottom:14px}
.profile-field label{display:block;font-size:12px;color:var(--text-secondary);margin-bottom:4px;font-weight:500}
```

### Sidebar Logout
```css
.sidebar-logout{margin-top:auto;padding:8px 12px;border-top:1px solid var(--border-light)}
.sidebar-logout .sidebar-item{color:var(--danger)!important}
.sidebar-logout .sidebar-item:hover{background:var(--danger-bg)!important}
```

### Tabs for auth sub-pages
```css
.auth-tabs{display:none} /* auth sub-pages toggled via JS display block/none */
```

## Implementation Steps

1. Open `video-plate-saas-mockup-v2.html`
2. Find the closing `</style>` tag
3. Insert all CSS blocks just before `</style>`
4. Verify: no CSS conflicts with existing styles

## Todo

- [ ] Add auth page layout CSS
- [ ] Add form elements CSS
- [ ] Add OAuth buttons CSS
- [ ] Add profile page CSS
- [ ] Add sidebar logout CSS
- [ ] Verify no class name collisions

## Success Criteria

- All auth UI elements render correctly
- No style conflicts with existing components
- Auth card centered, responsive
- Profile layout clean
