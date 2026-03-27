import { canvas, ctx } from "./constants";
import type { Frame } from "./global";
import { state } from "./state";

export function draw(): void {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(
    state.scale,
    0,
    0,
    state.scale,
    state.offsetX,
    state.offsetY,
  );

  if (state.atlasImg) {
    ctx.drawImage(state.atlasImg, 0, 0);
  }

  if (state.frames) {
    ctx.lineWidth = 1 / state.scale;
    ctx.strokeStyle = "#e5c07b";
    ctx.setLineDash([4 / state.scale, 4 / state.scale]);
    for (const f of state.frames) {
      ctx.strokeRect(f.x, f.y, f.w, f.h);
    }
  }

  if (state.frames && state.selectedIndex >= 0) {
    const f = state.frames[state.selectedIndex];
    ctx.setLineDash([]);
    ctx.strokeStyle = "#7aa2f7";
    ctx.lineWidth = 2 / state.scale;
    ctx.strokeRect(f.x, f.y, f.w, f.h);
  }

  ctx.restore();
}

export function fitCanvasToParent(): void {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  draw();
}

export function drawCropTo(
  canvas: HTMLCanvasElement,
  frame: Frame,
  atlasImg: HTMLImageElement | null,
): void {
  const c = canvas.getContext("2d") as CanvasRenderingContext2D;
  c.clearRect(0, 0, canvas.width, canvas.height);

  if (!atlasImg || !frame) return;

  const scale = Math.min(canvas.width / frame.w, canvas.height / frame.h);
  const tw = Math.max(1, Math.floor(frame.w * scale));
  const th = Math.max(1, Math.floor(frame.h * scale));
  const ox = Math.floor((canvas.width - tw) / 2);
  const oy = Math.floor((canvas.height - th) / 2);

  c.imageSmoothingEnabled = false;

  if (frame.rotated) {
    c.save();
    c.translate(ox + tw / 2, oy + th / 2);
    c.rotate(-Math.PI / 2);
    c.drawImage(
      atlasImg,
      frame.x,
      frame.y,
      frame.h,
      frame.w,
      -th / 2,
      -tw / 2,
      th,
      tw,
    );
    c.restore();
  } else {
    c.drawImage(atlasImg, frame.x, frame.y, frame.w, frame.h, ox, oy, tw, th);
  }
}
