# Phase 4: System Config API

**Priority:** P1 — Effort: 3h — Status: Pending

## Overview

Admin config management: key-value CRUD with audit logging.

## Related Code Files

### Create
- `backend/services/config_service.py`
- `backend/api/config.py`

### Modify
- `backend/main.py` — Add router

## Implementation Steps

### 1. services/config_service.py

```python
DEFAULT_CONFIGS = {
    "license_plate_image_cost": "5",
    "license_plate_video_cost": "15",
    "video_repair_fast_cost": "10",
    "video_repair_deep_cost": "20",
    "queue_mode": "FIFO",
    "max_concurrent_jobs": "5",
    "storage_limit_mb": "500",
}

async def get_all_configs(db) -> list[ConfigItem]
    # Return all configs, including description

async def update_configs(updates: dict, admin: User, db)
    # For each key in updates: upsert value
    # Validate keys are known (whitelist)
    # Log each change in audit_logs
    # Return updated configs

async def seed_default_configs(db)
    # Called on first startup: insert DEFAULT_CONFIGS if table empty
```

### 2. api/config.py

Router: `router = APIRouter(prefix="/api/admin/config", tags=["admin-config"])`
All use `Depends(require_admin)`.

- `GET /` — Return all configs
- `PUT /` — Body: `{"key": "value", ...}`

### 3. Seed on startup

In `main.py` lifespan, call `config_service.seed_default_configs()` after `init_db()`.

## Success Criteria

- [ ] Default configs auto-seeded on first run
- [ ] Admin can view all configs via GET
- [ ] Admin can update one or multiple configs via PUT
- [ ] Unknown keys rejected
- [ ] Changes logged in audit_logs

## Risk Assessment

- Config validation: whitelist known keys to prevent arbitrary writes
- No restart needed: changes take effect immediately since API reads from DB
