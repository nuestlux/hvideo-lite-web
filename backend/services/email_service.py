import logging

from config import settings

logger = logging.getLogger("hvideo.email")


async def send_email(to: str, subject: str, body: str):
    if not settings.SMTP_HOST:
        logger.warning(f"SMTP not configured. Email to {to} not sent.")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body: {body}")
        return

    import aiosmtplib
    from email.mime.text import MIMEText

    msg = MIMEText(body, "html", "utf-8")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=settings.SMTP_USE_TLS,
        )
        logger.info(f"Email sent to {to}")
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        raise
