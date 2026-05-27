---
title: "Hvideo Lite Phase 1 — Core Platform"
description: "Implement authentication (M11), account management (M03), profile (M10), and system config (M07) with FastAPI + React + SQLite"
status: pending
priority: P1
effort: 40h
tags: [feature, backend, frontend, database, auth]
created: 2026-05-26
---

# Hvideo Lite Phase 1 — Core Platform

## Overview

Phase 1 establishes foundational platform: user auth (OTP), admin account management, officer profile, system configuration. Monolith FastAPI serves React SPA + REST API on single process with SQLite.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Backend Setup & Database Models | Pending | 6h | [phase-01](./phase-01-backend-setup.md) |
| 2 | Auth API — Login, OTP, Password | Pending | 8h | [phase-02](./phase-02-auth-api.md) |
| 3 | Admin Users & Profile API | Pending | 6h | [phase-03](./phase-03-admin-api.md) |
| 4 | System Config API | Pending | 3h | [phase-04](./phase-04-config-api.md) |
| 5 | Frontend Setup & Auth Pages | Pending | 8h | [phase-05](./phase-05-frontend-auth.md) |
| 6 | Frontend — Admin Users | Pending | 5h | [phase-06](./phase-06-frontend-admin-users.md) |
| 7 | Frontend — Profile & Config | Pending | 4h | [phase-07](./phase-07-frontend-profile-config.md) |

## Dependencies

- Python 3.11+, Node.js 20+
- BRD Hvideo Lite v2.0 — `docs/superpowers/specs/2026-05-26-hvideo-lite-phase1-core-platform.md`
