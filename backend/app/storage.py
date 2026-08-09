"""Image storage.

v1 writes to the local filesystem so the API needs no external service. If
SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set, uploads go to Supabase Storage
instead — same call signature, so nothing upstream changes.
"""

import uuid
from pathlib import Path
from typing import Optional

import httpx

from . import config

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/heic": ".heic",
}
MAX_IMAGE_BYTES = 10 * 1024 * 1024


class UploadError(Exception):
    pass


def _extension_for(content_type: Optional[str], filename: Optional[str]) -> str:
    if content_type in ALLOWED_CONTENT_TYPES:
        return ALLOWED_CONTENT_TYPES[content_type]
    if filename:
        suffix = Path(filename).suffix.lower()
        if suffix in ALLOWED_CONTENT_TYPES.values():
            return suffix
    raise UploadError("Unsupported image type — use JPEG, PNG, WebP, GIF or HEIC")


def save_image(data: bytes, content_type: Optional[str], filename: Optional[str]) -> str:
    """Persist an image and return a URL the frontend can render."""
    if not data:
        raise UploadError("Empty file")
    if len(data) > MAX_IMAGE_BYTES:
        raise UploadError("Image is larger than 10MB")

    ext = _extension_for(content_type, filename)
    key = f"{uuid.uuid4()}{ext}"

    if config.USING_SUPABASE_STORAGE:
        return _save_to_supabase(key, data, content_type or "application/octet-stream")

    config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (config.UPLOAD_DIR / key).write_bytes(data)
    return f"{config.PUBLIC_BASE_URL}/uploads/{key}"


def _save_to_supabase(key: str, data: bytes, content_type: str) -> str:
    bucket = config.SUPABASE_STORAGE_BUCKET
    url = f"{config.SUPABASE_URL}/storage/v1/object/{bucket}/{key}"
    resp = httpx.post(
        url,
        content=data,
        headers={
            "Authorization": f"Bearer {config.SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": content_type,
            "x-upsert": "true",
        },
        timeout=30,
    )
    if resp.status_code >= 400:
        raise UploadError(f"Supabase Storage rejected the upload: {resp.text[:200]}")
    return f"{config.SUPABASE_URL}/storage/v1/object/public/{bucket}/{key}"


def delete_local_image(url: str) -> None:
    """Best-effort cleanup for locally stored files."""
    if config.USING_SUPABASE_STORAGE or "/uploads/" not in url:
        return
    try:
        (config.UPLOAD_DIR / url.rsplit("/uploads/", 1)[1]).unlink(missing_ok=True)
    except OSError:
        pass
