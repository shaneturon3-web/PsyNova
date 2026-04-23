#!/usr/bin/env python3
"""Genera assets/icon.png 512x512 (caja / drop zone) sin dependencias externas."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

W = H = 512


def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def build_png_rgba(rgba_rows: list[bytes]) -> bytes:
    ihdr = struct.pack(">IIBBBBB", W, H, 8, 6, 0, 0, 0)
    raw = b"".join(b"\x00" + row for row in rgba_rows)
    comp = zlib.compress(raw, 9)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", comp)
        + chunk(b"IEND", b"")
    )


def pixel(buf: bytearray, x: int, y: int, r: int, g: int, b: int, a: int = 255) -> None:
    if 0 <= x < W and 0 <= y < H:
        i = (y * W + x) * 4
        buf[i : i + 4] = bytes((r, g, b, a))


def fill_rect(buf: bytearray, x0: int, y0: int, x1: int, y1: int, r: int, g: int, b: int, a: int = 255) -> None:
    for y in range(max(0, y0), min(H, y1)):
        for x in range(max(0, x0), min(W, x1)):
            pixel(buf, x, y, r, g, b, a)


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    out = root / "assets" / "icon.png"
    out.parent.mkdir(parents=True, exist_ok=True)

    buf = bytearray(W * H * 4)
    # fondo gradiente aproximado (azul)
    for y in range(H):
        t = y / (H - 1)
        r = int(26 + (21 - 26) * t)
        g = int(115 + (87 - 115) * t)
        b = int(232 + (176 - 232) * t)
        for x in range(W):
            pixel(buf, x, y, r, g, b, 255)

    # Bandeja / “drop box” (formas claras sobre el azul)
    fill_rect(buf, 96, 180, 416, 300, 232, 240, 254, 255)
    fill_rect(buf, 128, 300, 384, 400, 210, 228, 252, 255)

    rows = [bytes(buf[y * W * 4 : (y + 1) * W * 4]) for y in range(H)]
    out.write_bytes(build_png_rgba(rows))
    print(out)


if __name__ == "__main__":
    main()
