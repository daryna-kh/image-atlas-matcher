import { useEffect, useRef } from "react";
import type { AtlasFrame } from "./Aside/types";

type FrameListItemType = {
  frame: AtlasFrame;
  image: HTMLImageElement | null;
};
export const FrameListItem = (props: FrameListItemType) => {
  const { frame, image } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!image || !frame.w || !frame.h) return;
    const scale = Math.min(canvas.width / frame.w, canvas.height / frame.h);
    const tw = Math.max(1, Math.floor(frame.w * scale));
    const th = Math.max(1, Math.floor(frame.h * scale));
    const ox = Math.floor((canvas.width - tw) / 2);
    const oy = Math.floor((canvas.height - th) / 2);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, ox, oy, tw, th);
  }, [frame, image]);

  return (
    <div>
      <canvas ref={canvasRef} width={44} height={44} />
      <div style={{ fontSize: 12 }}>
        <div style={{ fontWeight: 600 }}>{frame.name}</div>
        <div>{`x:${frame.x} y:${frame.y} w:${frame.w} h:${frame.h}`}</div>
      </div>
    </div>
  );
};
