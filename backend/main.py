import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import init_db, get_db
from utils.errors import AppException, app_exception_handler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hvideo")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Hvideo Lite...")
    await init_db()
    async for db in get_db():
        from services.config_service import seed_default_configs
        await seed_default_configs(db)
        from services.seed_service import seed_admin, seed_mock_data
        await seed_admin(db)
        await seed_mock_data(db)
        break
    yield
    logger.info("Shutting down Hvideo Lite...")


frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
FRONTEND_BUILT = frontend_dist.exists()
if FRONTEND_BUILT:
    from fastapi.responses import FileResponse
    index_html = str(frontend_dist / "index.html")

app = FastAPI(title="Hvideo Lite", version="1.0.0", lifespan=lifespan)
app.add_exception_handler(AppException, app_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "https://nuestlux.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api.auth import router as auth_router
from api.users import router as users_router
from api.profile import router as profile_router
from api.config import router as config_router
from api.points import router as points_router
from api.files import router as files_router
from api.processing import router as processing_router
from api.dashboard import router as dashboard_router
from api.admin_packages import router as admin_packages_router
from api.packages import router as packages_router

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(profile_router)
app.include_router(config_router)
app.include_router(points_router)
app.include_router(files_router)
app.include_router(processing_router)
app.include_router(dashboard_router)
app.include_router(admin_packages_router)
app.include_router(packages_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


if FRONTEND_BUILT:
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(index_html)
