import logging
import random
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.user import User
from models.transaction import Transaction
from models.file_record import FileRecord
from models.processing_job import ProcessingJob
from models.audit import AuditLog
from utils.security import hash_password

logger = logging.getLogger("hvideo.seed")

SEED_USERS = [
    {"name": "Admin", "email": "admin@example.com", "password": "admin123", "role": "admin"},
    {"name": "Cán bộ A", "email": "canbo@example.com", "password": "canbo123", "role": "can_bo"},
]

OFFICERS = [
    {"name": "Nguyễn Văn Bình", "email": "binh.nv@example.com"},
    {"name": "Trần Thị Mai", "email": "mai.tt@example.com"},
    {"name": "Lê Hoàng Nam", "email": "nam.lh@example.com"},
    {"name": "Phạm Minh Đức", "email": "duc.pm@example.com"},
    {"name": "Hoàng Thu Hà", "email": "ha.ht@example.com"},
    {"name": "Đỗ Văn Hùng", "email": "hung.dv@example.com"},
    {"name": "Ngô Thị Lan", "email": "lan.nt@example.com"},
    {"name": "Vũ Quốc Anh", "email": "anh.vq@example.com"},
    {"name": "Bùi Thị Hương", "email": "huong.bt@example.com"},
    {"name": "Đinh Công Thành", "email": "thanh.dc@example.com"},
    {"name": "Trương Minh Tâm", "email": "tan.tm@example.com"},
    {"name": "Lý Hồng Phúc", "email": "phuc.lh@example.com"},
]

MOCK_LICENSE_PLATES = [
    "30A-12345", "29B-67890", "51F-54321", "59T-98765",
    "43D-11223", "36E-44556", "41C-77889", "14H-33445",
]

SERVICES = ["license_plate_image", "license_plate_video", "video_repair_fast", "video_repair_deep"]

SERVICE_COSTS = [5, 15, 10, 20]

MOCK_VIDEO_ERRORS = [
    ["Không đồng bộ audio/video", "Frame bị lỗi"],
    ["Header container bị hỏng", "Keyframe bị thiếu"],
    ["Codec không hỗ trợ", "Bitrate quá thấp"],
    ["Metadata bị lỗi", "Duration không khớp"],
    ["Không đồng bộ audio/video", "Frame bị rơi rớt", "Timestamp bị sai"],
]

MOCK_REPAIRED_ERRORS = [
    ["Không đồng bộ audio/video", "Frame bị lỗi"],
    ["Header container bị hỏng"],
    ["Keyframe bị thiếu"],
    ["Metadata bị lỗi"],
    ["Không đồng bộ audio/video", "Timestamp bị sai"],
]


async def seed_admin(db: AsyncSession):
    for u in SEED_USERS:
        result = await db.execute(select(User).where(User.email == u["email"]).limit(1))
        if result.scalar_one_or_none():
            continue
        user = User(
            name=u["name"],
            email=u["email"],
            password_hash=hash_password(u["password"]),
            role=u["role"],
            status="hoat_dong",
            points=500 if u["role"] == "admin" else 200,
        )
        db.add(user)
        await db.commit()
        logger.info(f"Seed user created: {u['email']} / {u['password']}")


async def seed_mock_data(db: AsyncSession):
    now = datetime.utcnow()

    result = await db.execute(select(User).where(User.role == "can_bo").limit(1))
    if result.scalar_one_or_none() is None:
        return

    result = await db.execute(select(Transaction).limit(1))
    if result.scalar_one_or_none():
        return

    result = await db.execute(select(User).where(User.email == "admin@example.com").limit(1))
    admin = result.scalar_one_or_none()
    admin_id = admin.id if admin else 1

    result = await db.execute(select(User).where(User.role == "can_bo"))
    can_bo_list = result.scalars().all()
    existing_ids = {u.email: u.id for u in can_bo_list}

    txns = []
    files = []
    jobs = []
    audits = []
    txn_id_counter = 1

    for officer in OFFICERS:
        if officer["email"] in existing_ids:
            continue
        user = User(
            name=officer["name"],
            email=officer["email"],
            password_hash=hash_password("canbo123"),
            role="can_bo",
            status="hoat_dong",
            points=random.randint(50, 300),
        )
        db.add(user)
        await db.flush()
        existing_ids[officer["email"]] = user.id

    can_bo_ids = list(existing_ids.values())

    for uid in can_bo_ids:
        num_txns = random.randint(5, 15)
        balance = 200
        for t in range(num_txns):
            days_ago = random.randint(1, 30)
            hours_ago = random.randint(0, 23)
            txn_time = now - timedelta(days=days_ago, hours=hours_ago)

            svc_idx = random.randint(0, len(SERVICES) - 1)
            service = SERVICES[svc_idx]
            cost = SERVICE_COSTS[svc_idx]

            txns.append({
                "id": txn_id_counter,
                "user_id": uid,
                "type": "deduction",
                "service": service,
                "point": -cost,
                "balance_before": balance,
                "balance_after": balance - cost,
                "reason": f"Tiêu thụ: {service}",
                "created_at": txn_time,
            })
            balance -= cost
            txn_id_counter += 1

        issued = random.randint(30, 100)
        txn_time = now - timedelta(days=random.randint(1, 30))
        txns.append({
            "id": txn_id_counter,
            "user_id": uid,
            "type": "admin_adjustment",
            "service": None,
            "point": issued,
            "balance_before": balance,
            "balance_after": balance + issued,
            "reason": "Cấp point định kỳ",
            "created_at": txn_time,
        })
        balance += issued
        txn_id_counter += 1

        user_obj = await db.get(User, uid)
        if user_obj:
            user_obj.points = max(balance, 0)

    for txn_data in txns:
        db.add(Transaction(
            user_id=txn_data["user_id"],
            type=txn_data["type"],
            service=txn_data["service"],
            point=txn_data["point"],
            balance_before=txn_data["balance_before"],
            balance_after=txn_data["balance_after"],
            created_at=txn_data["created_at"],
        ))

    await db.flush()

    for uid in can_bo_ids[:6]:
        num_files = random.randint(1, 3)
        for _ in range(num_files):
            is_image = random.random() > 0.4
            ext = ".jpg" if is_image else ".mp4"
            mime = "image/jpeg" if is_image else "video/mp4"
            size = random.randint(500_000, 15_000_000)
            days_ago = random.randint(1, 20)
            f = FileRecord(
                user_id=uid,
                name=f"bie_so_{uid}_{random.randint(100,999)}{ext}",
                original_name=f"bie_so_{uid}_{random.randint(100,999)}{ext}",
                size=size,
                mime_type=mime,
                folder="/",
                processed=random.choice(["chua_xu_ly", "da_xu_ly", "dang_xu_ly"]),
                created_at=now - timedelta(days=days_ago),
            )
            db.add(f)
            files.append(f)

    await db.flush()

    for file_rec in files[:8]:
        uid = file_rec.user_id
        days_ago = random.randint(1, 15)
        plate = random.choice(MOCK_LICENSE_PLATES)
        confidence = f"{random.uniform(78, 99.5):.1f}%"
        job = ProcessingJob(
            user_id=uid,
            module="license_plate",
            status="completed",
            input_file=file_rec.original_name,
            input_file_id=file_rec.id,
            config='{"country":"VN","vehicle_type":"car","plate_color":"white"}',
            result=f'{{"plate":"{plate}","vehicle_type":"Xe con","plate_type":"Biển trắng","country":"Việt Nam"}}',
            confidence=confidence,
            started_at=now - timedelta(days=days_ago, hours=1),
            finished_at=now - timedelta(days=days_ago),
            created_at=now - timedelta(days=days_ago, hours=2),
        )
        db.add(job)
        jobs.append(job)

    for i in range(4):
        uid = random.choice(can_bo_ids)
        days_ago = random.randint(1, 15)
        mode = random.choice(["fast", "deep"])
        errors = random.choice(MOCK_VIDEO_ERRORS)
        repaired = random.choice(MOCK_REPAIRED_ERRORS)
        job = ProcessingJob(
            user_id=uid,
            module="video_repair",
            status="completed",
            input_file=f"corrupted_video_{i+1}.mp4",
            config=f'{{"mode":"{mode}","codec":"h264","repair_level":{random.randint(2,5)},"keep_audio":true}}',
            result=f'{{"mode":"{mode}","errors_found":{len(errors)},"errors":{errors},"errors_repaired":{repaired},"error_count":{len(errors)},"fixed_count":{len(repaired)}}}',
            started_at=now - timedelta(days=days_ago, hours=1),
            finished_at=now - timedelta(days=days_ago),
            created_at=now - timedelta(days=days_ago, hours=2),
        )
        db.add(job)
        jobs.append(job)

    num_audits = min(30, len(can_bo_ids) * 3)
    for _ in range(num_audits):
        uid = random.choice(can_bo_ids)
        days_ago = random.randint(1, 25)
        actions = [
            "create_account", "update_profile", "upload_file",
            "process_license_plate", "process_video_repair",
        ]
        action = random.choice(actions)
        audits.append(AuditLog(
            user_id=uid if random.random() > 0.3 else admin_id,
            action=action,
            target_type="user" if action == "create_account" else "file",
            target_id=random.randint(1, 50),
            details=f"Mock action: {action}",
            ip_address=f"192.168.1.{random.randint(2, 254)}",
            created_at=now - timedelta(days=days_ago),
        ))

    for a in audits:
        db.add(a)

    await db.commit()
    logger.info(f"Seed mock data: {len(txns)} transactions, {len(files)} files, {len(jobs)} jobs, {len(audits)} audit logs")
