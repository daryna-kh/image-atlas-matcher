import { useContext, useEffect, useRef } from "react";
import { Context } from "../store/context";

export const MainView = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { image, parcedFrames } = useContext(Context);
  const scale = 1;
  const offsetX = 0,
    offsetY = 0;

  function draw(ctx: CanvasRenderingContext2D | null) {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    if (image) ctx.drawImage(image, 0, 0);
    ctx.lineWidth = 1 / scale;
    ctx.strokeStyle = "#e5c07b";
    ctx.setLineDash([4 / scale, 4 / scale]);
    if (!parcedFrames) return;
    for (let i = 0; i < frames.length; i++) {
      const f = parcedFrames[i];
      ctx.strokeRect(f.x, f.y, f.w, f.h);
    }
    ctx.restore();
  }

  function fitCanvasToParent() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    if (!ctx) return;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    draw(ctx);
  }

  useEffect(() => {
    window.addEventListener("resize", fitCanvasToParent);
    return () => window.removeEventListener("resize", fitCanvasToParent);
  }, []);

  return <canvas ref={canvasRef}></canvas>;
};
