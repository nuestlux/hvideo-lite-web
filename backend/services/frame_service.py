import logging
import subprocess
import tempfile
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.file_record import FileRecord
from utils.errors import AppException

logger = logging.getLogger("hvideo.frame")

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"


async def extract_frames(file_id: int, user_id: int, db: AsyncSession) -> dict:
    result = await db.execute(
        select(FileRecord).where(FileRecord.id == file_id, FileRecord.user_id == user_id)
    )
    file_record = result.scalar_one_or_none()
    if not file_record:
        raise AppException("FILE_NOT_FOUND", "File không tồn tại", 404)

    if not (file_record.mime_type or "").startswith("video/"):
        raise AppException("NOT_VIDEO", "File không phải video", 400)

    fpath = UPLOAD_DIR / str(user_id) / file_record.name
    if not fpath.exists():
        raise AppException("FILE_NOT_FOUND", "File không tồn tại trên ổ đĩa", 404)

    frames = _try_ffmpeg(fpath)
    if frames:
        return {"frames": frames, "total": len(frames), "method": "ffmpeg"}

    return {
        "frames": [
            {"index": 0, "time": 0.0, "url": None, "mock": True},
            {"index": 1, "time": 1.0, "url": None, "mock": True},
            {"index": 2, "time": 2.0, "url": None, "mock": True},
        ],
        "total": 3,
        "method": "mock",
        "note": "Cần cài ffmpeg để trích xuất frame thực tế",
    }


def _try_ffmpeg(video_path: Path) -> list[dict] | None:
    try:
        import subprocess
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode != 0:
            return None
    except Exception:
        return None

    frames = []
    tmp_dir = Path(tempfile.mkdtemp())
    try:
        duration_cmd = [
            "ffprobe", "-v", "error", "-show_entries",
            "format=duration", "-of", "default=noprint_wrappers=1:nokey=1",
            str(video_path),
        ]
        dur_result = subprocess.run(duration_cmd, capture_output=True, text=True, timeout=10)
        duration = float(dur_result.stdout.strip()) if dur_result.stdout.strip() else 10.0

        interval = max(1.0, duration / 10)
        for i in range(min(10, int(duration / interval) + 1)):
            time_sec = i * interval
            out_file = tmp_dir / f"frame_{i:03d}.jpg"
            cmd = [
                "ffmpeg", "-ss", str(time_sec), "-i", str(video_path),
                "-vframes", "1", "-q:v", "2", str(out_file),
                "-y", "-loglevel", "error",
            ]
            subprocess.run(cmd, capture_output=True, timeout=30)
            if out_file.exists():
                frames.append({"index": i, "time": round(time_sec, 1), "path": str(out_file)})
    except Exception as e:
        logger.warning(f"FFmpeg frame extraction failed: {e}")
        return None

    return frames if frames else None
