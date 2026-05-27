import os
from pathlib import Path

from PIL import Image, ImageEnhance

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"


def preprocess_image(
    image_path: str,
    adjustments: dict,
    output_dir: str | None = None,
) -> str:
    img = Image.open(image_path)

    crop = adjustments.get("crop")
    if crop and all(k in crop for k in ("x", "y", "w", "h")):
        img = img.crop((crop["x"], crop["y"], crop["x"] + crop["w"], crop["y"] + crop["h"]))

    angle = adjustments.get("rotate", 0)
    if angle:
        img = img.rotate(angle, expand=True, resample=Image.BICUBIC)

    brightness = adjustments.get("brightness", 0)
    if brightness:
        img = ImageEnhance.Brightness(img).enhance(1 + brightness / 100)

    contrast = adjustments.get("contrast", 0)
    if contrast:
        img = ImageEnhance.Contrast(img).enhance(1 + contrast / 100)

    saturation = adjustments.get("saturation", 0)
    if saturation:
        img = ImageEnhance.Color(img).enhance(1 + saturation / 100)

    hue = adjustments.get("hue", 0)
    if hue:
        img = img.convert("HSV")
        h, s, v = img.split()
        h = h.point(lambda p: (p + int(hue * 255 / 360)) % 255)
        img = Image.merge("HSV", (h, s, v)).convert("RGB")

    sharpness = adjustments.get("sharpness", 50)
    if sharpness != 50:
        factor = sharpness / 50
        img = ImageEnhance.Sharpness(img).enhance(factor)

    exposure = adjustments.get("exposure", 0)
    if exposure:
        factor = 2 ** exposure
        img = ImageEnhance.Brightness(img).enhance(factor)

    flip_h = adjustments.get("flip_h", False)
    if flip_h:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)

    flip_v = adjustments.get("flip_v", False)
    if flip_v:
        img = img.transpose(Image.FLIP_TOP_BOTTOM)

    zoom = adjustments.get("zoom", 1)
    if zoom != 1:
        w, h = img.size
        new_w, new_h = int(w / zoom), int(h / zoom)
        left = (w - new_w) // 2
        top = (h - new_h) // 2
        img = img.crop((left, top, left + new_w, top + new_h))
        img = img.resize((w, h), Image.LANCZOS)

    if output_dir:
        out_path = Path(output_dir) / f"processed_{Path(image_path).name}"
    else:
        stem = Path(image_path).stem
        out_path = Path(image_path).with_name(f"{stem}_processed.png")

    out_path = out_path.resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, quality=95)
    return str(out_path)
