import { canvas, ctx } from "./constants";
import type { Frame } from "./global";

export function draw(canvas: HTMLCanvasElement) {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  if (atlasImg) ctx.drawImage(atlasImg, 0, 0);
  ctx.lineWidth = 1 / scale;
  ctx.strokeStyle = "#e5c07b";
  ctx.setLineDash([4 / scale, 4 / scale]);
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    ctx.strokeRect(f.x, f.y, f.w, f.h);
  }
  if (selectedIndex >= 0) {
    const f = frames[selectedIndex];
    ctx.setLineDash([]);
    ctx.strokeStyle = "#7aa2f7";
    ctx.lineWidth = 2 / scale;
    ctx.strokeRect(f.x, f.y, f.w, f.h);
  }
  ctx.restore();
}

export function fitCanvasToParent() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  draw(canvas);
}

export function drawCropTo(
  canvas: HTMLCanvasElement,
  f: Frame,
  atlasImg: HTMLImageElement | null,
) {
  const c = canvas.getContext("2d") as CanvasRenderingContext2D;
  c.clearRect(0, 0, canvas.width, canvas.height);
  if (!atlasImg || !f) return;
  const scale = Math.min(canvas.width / f.w, canvas.height / f.h);
  const tw = Math.max(1, Math.floor(f.w * scale));
  const th = Math.max(1, Math.floor(f.h * scale));
  const ox = Math.floor((canvas.width - tw) / 2);
  const oy = Math.floor((canvas.height - th) / 2);
  c.imageSmoothingEnabled = false;
  if (f.rotated) {
    c.save();
    c.translate(ox + tw / 2, oy + th / 2);
    c.rotate(-Math.PI / 2);
    c.drawImage(atlasImg, f.x, f.y, f.h, f.w, -th / 2, -tw / 2, th, tw);
    c.restore();
  } else {
    c.drawImage(atlasImg, f.x, f.y, f.w, f.h, ox, oy, tw, th);
  }
}
