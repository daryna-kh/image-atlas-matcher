import type { Frame, Point } from "./global";

/**
 * Convert screen coordinates to world coordinates
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  scale: number,
  offsetX: number,
  offsetY: number,
): Point {
  return {
    x: (screenX - offsetX) / scale,
    y: (screenY - offsetY) / scale,
  };
}

/**
 * Check if a point collides with a frame
 */
export function hitTest(pos: Point, frame: Frame): boolean {
  return (
    pos.x >= frame.x &&
    pos.x <= frame.x + frame.w &&
    pos.y >= frame.y &&
    pos.y <= frame.y + frame.h
  );
}

/**
 * Find frame at screen position (iterate from end for top-most)
 */
export function findFrameAtPos(pos: Point, frames: Frame[]): number {
  for (let i = frames.length - 1; i >= 0; i--) {
    if (hitTest(pos, frames[i])) {
      return i;
    }
  }
  return -1;
}

/**
 * Normalize image to 64x64 canvas
 */
export function normalizeImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  frame?: Frame,
  rotated?: boolean,
): Uint8ClampedArray {
  ctx.clearRect(0, 0, 64, 64);
  ctx.imageSmoothingEnabled = false;

  if (frame && rotated) {
    ctx.save();
    ctx.translate(32, 32);
    ctx.rotate(-Math.PI / 2);
    const s = Math.min(64 / frame.h, 64 / frame.w);
    const tw = Math.max(1, Math.floor(frame.w * s));
    const th = Math.max(1, Math.floor(frame.h * s));
    ctx.drawImage(
      img,
      frame.x,
      frame.y,
      frame.h,
      frame.w,
      -th / 2,
      -tw / 2,
      th,
      tw,
    );
    ctx.restore();
  } else if (frame) {
    const s = Math.min(64 / frame.w, 64 / frame.h);
    const tw = Math.max(1, Math.floor(frame.w * s));
    const th = Math.max(1, Math.floor(frame.h * s));
    const tx = Math.floor((64 - tw) / 2);
    const ty = Math.floor((64 - th) / 2);
    ctx.drawImage(img, frame.x, frame.y, frame.w, frame.h, tx, ty, tw, th);
  } else {
    // Normalize a standalone image
    const s = Math.min(64 / img.width, 64 / img.height);
    const tw = Math.max(1, Math.floor(img.width * s));
    const th = Math.max(1, Math.floor(img.height * s));
    const tx = Math.floor((64 - tw) / 2);
    const ty = Math.floor((64 - th) / 2);
    ctx.drawImage(img, 0, 0, img.width, img.height, tx, ty, tw, th);
  }

  return ctx.getImageData(0, 0, 64, 64).data;
}

/**
 * Compute MSE (Mean Squared Error) between two normalized images
 */
export function computeMSE(
  query: Uint8ClampedArray,
  target: Uint8ClampedArray,
): number {
  let mse = 0;
  for (let p = 0; p < query.length; p += 4) {
    const dr = target[p] - query[p];
    const dg = target[p + 1] - query[p + 1];
    const db = target[p + 2] - query[p + 2];
    mse += dr * dr + dg * dg + db * db;
  }
  return mse / (64 * 64 * 3);
}

export function generateThumbnail(
  ctx: CanvasRenderingContext2D,
  atlasImg: HTMLImageElement,
  frame: Frame,
  size: number,
): void {
  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = false;

  const scale = Math.min(size / frame.w, size / frame.h);
  const tw = Math.max(1, Math.floor(frame.w * scale));
  const th = Math.max(1, Math.floor(frame.h * scale));
  const ox = Math.floor((size - tw) / 2);
  const oy = Math.floor((size - th) / 2);

  ctx.drawImage(atlasImg, frame.x, frame.y, frame.w, frame.h, ox, oy, tw, th);
}

export function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (m) =>
      (
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        }) as Record<string, string>
      )[m],
  );
}
