# Phase 3: JS — Auth Functions & DB Model

## Overview

Add all auth-related JavaScript functions to the mockup. Modify `initDB()` to support auth state.

## DB Model Changes

In `initDB()` function (currently line ~1070):

### Add password field to existing users
Each existing user gets `password: 'password123'`:
```js
// Existing 5 users — add password field
{ id:'U001', name:'Nguyễn Tuấn', email:'tuan.nguyen@company.vn', password:'password123', ... },
// etc. for all 5
```

### Change currentUserId initialization
```js
// OLD
currentUserId: 'U001',
// NEW
currentUserId: null,
```

### Add verificationCodes object
```js
// Inside DB object, after config or after transactions
verificationCodes: {},
```

### Add login_attempts tracking (optional, for mock)
```js
// For simulating failed login attempts
loginAttempts: {},  // { email: count }
```

## Auth Functions

Insert these functions **before** `function renderAll()` or in a new section after existing plate functions. Use the section comment `// ============================================================\n//  AUTH FUNCTIONS\n// ============================================================`

### `isLoggedIn()`
```js
function isLoggedIn() {
  return DB && DB.currentUserId !== null;
}
```

### `currentUser()` — update existing (line ~1348)
Add null check:
```js
function currentUser() {
  if (!DB || !DB.currentUserId) return null;
  return DB.users.find(u => u.id === DB.currentUserId);
}
```

### `login(email, password)`
```js
function login(email, password) {
  const user = DB.users.find(u => u.email === email);
  if (!user) return { success: false, error: 'Email hoặc mật khẩu không đúng' };
  if (user.password !== password) return { success: false, error: 'Email hoặc mật khẩu không đúng' };
  if (user.status === 'locked') return { success: false, error: 'Tài khoản đã bị khóa. Vui lòng liên hệ admin.' };
  DB.currentUserId = user.id;
  user.last_login = new Date().toISOString().slice(0,19).replace('T',' ');
  if (document.getElementById('login-remember').checked) {
    localStorage.setItem('visionfix_remember_email', email);
  } else {
    localStorage.removeItem('visionfix_remember_email');
  }
  dbLog('LOGIN', `User ${user.email} logged in`);
  renderAll();
  return { success: true };
}
```

### `handleLogin()` — called from login button
```js
function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('auth-login-error');
  if (!email || !password) { errEl.textContent = 'Vui lòng nhập email và mật khẩu'; errEl.style.display='block'; return; }
  errEl.style.display = 'none';
  const result = login(email, password);
  if (!result.success) {
    errEl.textContent = result.error;
    errEl.style.display = 'block';
    return;
  }
  nav('dashboard');
}
```

### `logout()` and `handleLogout()`
```js
function logout() {
  const email = DB.currentUserId ? currentUser().email : '';
  dbLog('LOGOUT', `User ${email} logged out`);
  DB.currentUserId = null;
  localStorage.removeItem('visionfix_remember_email');
  renderAll();
}

function handleLogout() {
  toast('info', '🚪 Đã đăng xuất');
  logout();
}
```

### `register(name, email, password)`
```js
function register(name, email, password) {
  if (DB.users.find(u => u.email === email)) {
    return { success: false, error: 'Email đã được sử dụng' };
  }
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  const colors = ['#1668dc,#854eca','#49aa19,#0891b2','#d89614,#dc4446','#854eca,#dc4446','#13a8a8,#16a34a'];
  const newUser = {
    id: 'U' + String(DB.users.length + 1).padStart(3,'0'),
    name, email, password,
    role: 'user', points: DB.config.welcome_points,
    avatar: initials, status: 'active',
    created: new Date().toISOString().slice(0,10),
    total_txn: 0,
    color: colors[DB.users.length % colors.length],
    last_login: null
  };
  DB.users.push(newUser);
  DB.currentUserId = newUser.id;
  // Generate verification code (simulate)
  const code = String(Math.floor(100000 + Math.random() * 900000));
  DB.verificationCodes[email] = { code, expires: Date.now() + 3600000 };
  dbLog('REGISTER', `New user: ${email}`);
  renderAll();
  return { success: true, user: newUser, verifyCode: code };
}
```

### `handleRegister()`
```js
function handleRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  const tos = document.getElementById('reg-tos').checked;
  const errEl = document.getElementById('auth-register-error');
  // Validations
  if (!name || !email || !password || !confirm) {
    errEl.textContent = 'Vui lòng điền đầy đủ thông tin'; errEl.style.display='block'; return;
  }
  if (password.length < 6) { errEl.textContent = 'Mật khẩu tối thiểu 6 ký tự'; errEl.style.display='block'; return; }
  if (password !== confirm) { errEl.textContent = 'Mật khẩu xác nhận không khớp'; errEl.style.display='block'; return; }
  if (!tos) { errEl.textContent = 'Vui lòng đồng ý với Điều khoản dịch vụ'; errEl.style.display='block'; return; }
  errEl.style.display = 'none';
  const result = register(name, email, password);
  if (!result.success) { errEl.textContent = result.error; errEl.style.display='block'; return; }
  toast('success', `🎉 Đăng ký thành công! Được tặng ${DB.config.welcome_points} Point. Mã xác thực: ${result.verifyCode}`);
  // Check if we want to show verify page
  const showVerify = confirm('📧 Đã gửi mã xác thực đến email. Bạn có muốn xác thực ngay không?');
  if (showVerify) {
    document.getElementById('verify-email-display').textContent = email;
    showAuthForm('verify');
  } else {
    nav('dashboard');
  }
}
```

### `showAuthForm(form)`
```js
function showAuthForm(form) {
  ['login','register','forgot','verify'].forEach(f => {
    const el = document.getElementById('auth-' + f);
    if (el) el.style.display = f === form ? '' : 'none';
  });
  // Reset errors
  document.querySelectorAll('.auth-error').forEach(e => e.style.display='none');
  // Forgot step 2 reset
  const s2 = document.getElementById('auth-forgot-step2');
  if (s2) s2.style.display = 'none';
  document.getElementById('auth-forgot-step1').style.display = '';
}
```

### `handleOAuth(provider)`
```js
function handleOAuth(provider) {
  const name = provider === 'google' ? 'Google' : 'Facebook';
  toast('info', `⏳ Đang đăng nhập bằng ${name}...`);
  setTimeout(() => {
    // Try to find existing OAuth-linked user or create one
    let user = DB.users.find(u => u.email.includes(provider));
    if (!user) {
      const dummyEmail = `user.${provider}@mock.visionfix`;
      const result = register(`${name} User`, dummyEmail, 'oauth_auto_' + Date.now());
      user = result.user;
    } else {
      DB.currentUserId = user.id;
    }
    toast('success', `✅ Đăng nhập bằng ${name} thành công!`);
    dbLog('OAUTH_LOGIN', `${provider} login: ${user.email}`);
    renderAll();
    nav('dashboard');
  }, 800);
}
```

### `handleForgotPassword()`
```js
function handleForgotPassword() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email) { toast('error', '❌ Vui lòng nhập email'); return; }
  document.getElementById('forgot-email-sent').textContent = email;
  document.getElementById('auth-forgot-step1').style.display = 'none';
  document.getElementById('auth-forgot-step2').style.display = '';
  dbLog('FORGOT_PASSWORD', `Request for: ${email}`);
}
```

### `handleVerifyEmail()`
```js
function handleVerifyEmail() {
  const code = document.getElementById('verify-code').value.trim();
  const user = currentUser();
  if (!user) return;
  const record = DB.verificationCodes[user.email];
  if (!code || code.length !== 6) {
    toast('error', '❌ Vui lòng nhập mã xác thực 6 số'); return;
  }
  if (record && record.code === code) {
    user.status = 'active';
    delete DB.verificationCodes[user.email];
    toast('success', '✅ Xác thực email thành công!');
    dbLog('VERIFY_EMAIL', `${user.email} verified`);
    nav('dashboard');
  } else {
    toast('error', '❌ Mã xác thực không đúng. Thử lại.');
  }
}
```

### `resendVerifyCode()`
```js
function resendVerifyCode() {
  const user = currentUser();
  if (!user) return;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  DB.verificationCodes[user.email] = { code, expires: Date.now() + 3600000 };
  toast('info', `📧 Đã gửi lại mã xác thực đến ${user.email}. Mã: ${code}`);
}
```

### `skipVerifyAndGo()`
```js
function skipVerifyAndGo() {
  nav('dashboard');
  toast('info', '📧 Bạn có thể xác thực email sau tại trang Hồ sơ.');
}
```

### `togglePwd(inputId, btn)`
```js
function togglePwd(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
  else { input.type = 'password'; btn.textContent = '👁️'; }
}
```

### `handleUpdateProfile()`
```js
function handleUpdateProfile() {
  const user = currentUser();
  if (!user) return;
  const name = document.getElementById('profile-name').value.trim();
  if (!name) { toast('error', '❌ Họ tên không được để trống'); return; }
  user.name = name;
  // Update avatar initials
  user.avatar = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  toast('success', '✅ Đã cập nhật hồ sơ');
  renderAll();
}
```

### `handleChangePassword()`
```js
function handleChangePassword() {
  const user = currentUser();
  if (!user) return;
  const oldPwd = document.getElementById('chg-old-pwd').value;
  const newPwd = document.getElementById('chg-new-pwd').value;
  const confirmPwd = document.getElementById('chg-confirm-pwd').value;
  if (user.password !== oldPwd) { toast('error', '❌ Mật khẩu cũ không đúng'); return; }
  if (newPwd.length < 6) { toast('error', '❌ Mật khẩu mới tối thiểu 6 ký tự'); return; }
  if (newPwd !== confirmPwd) { toast('error', '❌ Mật khẩu xác nhận không khớp'); return; }
  user.password = newPwd;
  document.getElementById('chg-old-pwd').value = '';
  document.getElementById('chg-new-pwd').value = '';
  document.getElementById('chg-confirm-pwd').value = '';
  toast('success', '✅ Đã đổi mật khẩu thành công');
  dbLog('CHANGE_PASSWORD', `${user.email} changed password`);
}
```

## Implementation Steps

1. Open `video-plate-saas-mockup-v2.html`
2. Find `initDB()` function (line ~1070)
3. Add `password: 'password123'` to each of 5 users
4. Change `currentUserId: 'U001'` → `currentUserId: null`
5. Add `verificationCodes: {}` to DB object
6. Find `function currentUser()` (line ~1348)
7. Add null check
8. Create new `// AUTH FUNCTIONS` section before `renderAll()`
9. Insert all functions listed above
10. Verify each function references correct element IDs from Phase 2

## Todo

- [ ] Add password field to all existing users in initDB()
- [ ] Set currentUserId = null
- [ ] Add verificationCodes object
- [ ] Update currentUser() with null check
- [ ] Write isLoggedIn(), login(), handleLogin()
- [ ] Write logout(), handleLogout()
- [ ] Write register(), handleRegister()
- [ ] Write showAuthForm()
- [ ] Write handleOAuth()
- [ ] Write handleForgotPassword()
- [ ] Write handleVerifyEmail(), resendVerifyCode(), skipVerifyAndGo()
- [ ] Write togglePwd()
- [ ] Write handleUpdateProfile(), handleChangePassword()

## Success Criteria

- All auth functions work correctly
- Login validates email + password
- Register creates new user, auto-login, shows verify option
- Forgot password shows confirmation
- OAuth simulates login in 800ms
- Remember me stores email in localStorage
- Profile update changes user name
- Change password validates old password
