"""Image upload validation, resizing and storage.

Uploads are validated on three layers:

1. The declared ``Content-Length`` is checked *before* the request body is read,
   so an oversized upload is rejected with 413 while the client is still sending
   it (see :func:`validate_content_length`).
2. The declared MIME type must be one of jpeg/png/webp.
3. The actual bytes must be decodable by Pillow, and are then downscaled to at
   most ``MAX_DIMENSION`` pixels on the longest side before being written to
   ``UPLOAD_DIR`` under a random UUID filename.
"""

import io
import os
import uuid
from contextlib import suppress

from fastapi import HTTPException, UploadFile
from PIL import Image

from ..core.config import settings

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_DIMENSION = 1200

_MIME_TO_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
_MIME_TO_FORMAT = {
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WEBP",
}


def validate_content_length(content_length: str | None) -> None:
    """Reject a request whose declared size exceeds ``MAX_IMAGE_SIZE``.

    Runs on the ``Content-Length`` header alone, before any part of the body has
    been read. A missing or non-numeric header is ignored here — the actual
    byte count is enforced again in :func:`save_image` once the body is read.
    """
    if content_length is None:
        return
    try:
        length = int(content_length)
    except ValueError:
        return
    if length > settings.MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image exceeds the maximum allowed size",
        )


def validate_mime_type(content_type: str | None) -> None:
    if content_type is None or content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image type; use jpeg, png or webp",
        )


async def save_image(file: UploadFile) -> str:
    """Validate, downscale and persist an uploaded image.

    Returns the generated filename (a UUID plus the format's extension). The
    caller stores this value as the item's ``image_path``; the public URL is
    ``/uploads/<filename>``.
    """
    validate_mime_type(file.content_type)

    content = await file.read()
    if len(content) > settings.MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image exceeds the maximum allowed size",
        )

    try:
        image = Image.open(io.BytesIO(content))
        image.load()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid image file") from exc

    image.thumbnail((MAX_DIMENSION, MAX_DIMENSION))

    fmt = _MIME_TO_FORMAT[file.content_type]
    if fmt == "JPEG" and image.mode not in ("RGB", "L"):
        image = image.convert("RGB")

    filename = f"{uuid.uuid4().hex}{_MIME_TO_EXT[file.content_type]}"
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    path = os.path.join(settings.UPLOAD_DIR, filename)
    image.save(path, format=fmt)
    return filename


def delete_image_file(filename: str) -> None:
    """Remove a previously stored image file, ignoring a missing file."""
    path = os.path.join(settings.UPLOAD_DIR, filename)
    with suppress(FileNotFoundError):
        os.remove(path)
