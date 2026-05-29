---
title: "Auth System Implementation Plan"
description: "Add full SaaS auth (login, register, logout, OAuth, forgot password, email verify, profile, change password) to existing HTML mockup"
status: pending
priority: P1
effort: 6h
tags: [auth, frontend, feature]
created: 2026-05-19
---

# Auth System Implementation Plan

## Overview

Add complete authentication flow to `video-plate-saas-mockup-v2.html`:
- Full-screen auth page (login/register/forgot/verify) — ẩn sidebar khi chưa login
- Profile page với edit name + change password
- OAuth simulation (Google, Facebook)
- Navigation guard, session state, remember me

Based on spec: `docs/superpowers/specs/2026-05-19-auth-system-design.md`

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | CSS — auth & profile styles | Pending | 1h | [phase-01](./phase-01-css.md) |
| 2 | HTML — auth page, profile page, sidebar | Pending | 1.5h | [phase-02](./phase-02-html.md) |
| 3 | JS — auth functions & DB model | Pending | 2h | [phase-03](./phase-03-js-auth.md) |
| 4 | JS — integration (renderAll, nav, initDB) | Pending | 1h | [phase-04](./phase-04-js-integration.md) |
| 5 | Doc update — brainstorm status | Pending | 0.5h | [phase-05](./phase-05-doc.md) |

## Files

- `video-plate-saas-mockup-v2.html` — target file, all changes
- `brainstorm-video-repair-plate-recovery-saas.md` — update US statuses

## Dependencies

- Phase 2 depends on Phase 1 (CSS before HTML)
- Phase 3 depends on Phase 2 (JS functions reference HTML elements)
- Phase 4 depends on Phase 3 (integration calls auth functions)
- Phase 5 can run in parallel with Phase 4
