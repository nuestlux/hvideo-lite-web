# Phase 4: JS — Integration (renderAll, nav, initDB)

## Overview

Wire auth into existing app flow: renderAll checks auth state, nav guards routes, initDB sets initial state, profile renders user data.

## Changes Required

### 1. renderAll() — Add authGuard at start

Insert at the **very beginning** of `renderAll()` (line ~1372):
```js
function renderAll() {
  // AUTH GUARD
  if (!isLoggedIn()) {
    document.getElementById('sidebar').style.display = 'none';
    document.querySelector('.top-bar').style.display = 'none';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-auth').classList.add('active');
    // Restore remember-me email
    const remembered = localStorage.getItem('visionfix_remember_email');
    if (remembered) document.getElementById('login-email').value = remembered;
    // Ensure login form is shown
    showAuthForm('login');
    return;
  }
  // ... existing renderAll code continues below ...
```

Also update the `// Sidebar` section to show sidebar:
```js
document.getElementById('sidebar').style.display = '';
document.querySelector('.top-bar').style.display = '';
```

### 2. renderAll() — Add profile section

After `renderPlateHistory()` call (line ~1387), add:
```js
// Profile page
const pUser = currentUser();
if (pUser) {
  document.getElementById('profile-name').value = pUser.name;
  document.getElementById('profile-email').value = pUser.email;
  document.getElementById('profile-role').value = pUser.role === 'admin' ? 'Quản trị viên' : 'Người dùng';
  document.getElementById('profile-created').value = pUser.created;
  document.getElementById('profile-avatar').textContent = pUser.avatar;
  document.getElementById('profile-avatar').style.background = 'linear-gradient(135deg,' + (pUser.color || '#1668dc,#854eca') + ')';
  const banner = document.getElementById('profile-verify-banner');
  if (banner) banner.style.display = pUser.status === 'unverified' ? '' : 'none';
}
```

### 3. nav() — Add auth guard

At the **beginning** of `nav()` function (line ~1690):
```js
function nav(id, el) {
  if (!isLoggedIn() && id !== 'auth') return;
  // ... rest of existing nav function ...
```

Also add 'profile' to `pageNames` object:
```js
const pageNames = {
  // ... existing entries ...
  profile: 'Hồ sơ',
  // ...
};
```

### 4. initDB() — Initialize with remember-me check

At the end of `initDB()`, after all data is set:
```js
// Check for remembered user
function initDB() {
  // ... existing data setup ...

  // Auth: set initial user to null (must login)
  DB.currentUserId = null;
}
```

### 5. end of file — Render with auth

Update the init call at the bottom (line ~2330):
```js
initDB();
renderAll();
// If remembered email exists, fill login form (renderAll handles this)
```

### 6. handlePlateSingleFile() — Add auth dependency note

No changes needed — `startPlateProcessing()` already calls `currentUser()` which now returns null if not logged in. However, the authGuard in renderAll prevents the plate page from being visible when not logged in, so this flow is already protected.

### 7. pageNames array update

Add `profile:'Hồ sơ'` to pageNames object.

### 8. update breadcrumb default

The breadcrumb should show auth page title when on auth page. In nav() add condition:
```js
document.getElementById('breadcrumb').innerHTML = id === 'auth'
  ? 'VisionFix / <span>Đăng nhập</span>'
  : 'VisionFix / <span>' + (pageNames[id]||id) + '</span>';
```

## Implementation Steps

1. Open `video-plate-saas-mockup-v2.html`
2. Find `function renderAll()` — add auth guard at top
3. Add sidebar/topbar show in renderAll after auth guard
4. Add profile render block after renderPlateHistory
5. Find `function nav()` — add auth check at top
6. Update pageNames object with 'profile'
7. Update breadcrumb for auth route
8. Verify init calls at end of file

## Todo

- [ ] Add auth guard to renderAll()
- [ ] Add sidebar visibility toggle in renderAll()
- [ ] Add profile page render in renderAll()
- [ ] Add auth guard to nav()
- [ ] Add 'profile' to pageNames
- [ ] Update breadcrumb for auth route
- [ ] Verify init sequence

## Success Criteria

- App loads to auth page (not dashboard)
- After login, dashboard shows with correct user
- After logout, returns to auth page
- nav() does nothing on non-auth pages when not logged in
- Profile page renders current user info
