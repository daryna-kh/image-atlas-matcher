import {
  btnFindByImage,
  btnFindByName,
  canvas,
  cropCanvas,
  detailsEl,
  framesList,
  imgFile,
  metaFile,
  nameQuery,
  queryCanvas,
  queryCtx,
  queryImg,
  statusEl,
} from "./constants";
import type { Point } from "./global";
import { loadImageFromFile } from "./handlers";
import { parseMeta } from "./parsers";
import {
  atlasImg,
  isPanning,
  offsetX,
  offsetY,
  scale,
  selectedIndex,
  setSelectedIndex,
  startPan,
} from "./state";
import "./style.css";
import { draw, drawCropTo, fitCanvasToParent } from "./view";

document.addEventListener("DOMContentLoaded", () => {
  function setStatus(t: string, cls: string = ""): void {
    statusEl.textContent = t;
    statusEl.className = "status " + cls;
  }

  window.addEventListener("resize", fitCanvasToParent);

  function screenToWorld(x: number, y: number): Point {
    return { x: (x - offsetX) / scale, y: (y - offsetY) / scale };
  }

  canvas.addEventListener(
    "wheel",
    (e) => {
      if (!atlasImg) return;
      const delta = -Math.sign(e.deltaY) * 0.1;
      const mx = e.offsetX,
        my = e.offsetY;
      const before = screenToWorld(mx, my);
      scale = Math.min(10, Math.max(0.1, scale * (1 + delta)));
      const after = screenToWorld(mx, my);
      offsetX += mx - after.x * scale - (mx - before.x * scale);
      offsetY += my - after.y * scale - (my - before.y * scale);
      draw(canvas);
      e.preventDefault();
    },
    { passive: false },
  );

  canvas.addEventListener("mousedown", (e) => {
    isPanning = true;
    startPan = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener("mouseup", () => {
    isPanning = false;
    startPan = null;
  });

  window.addEventListener("mousemove", (e) => {
    if (!isPanning) return;
    if (!startPan) return;
    offsetX += e.clientX - startPan.x;
    offsetY += e.clientY - startPan.y;
    startPan = { x: e.clientX, y: e.clientY };
    draw(canvas);
  });

  canvas.addEventListener("click", (e) => {
    if (!atlasImg) return;
    const pos = screenToWorld(e.offsetX, e.offsetY);
    for (let i = frames.length - 1; i >= 0; i--) {
      const f = frames[i];
      if (
        pos.x >= f.x &&
        pos.x <= f.x + f.w &&
        pos.y >= f.y &&
        pos.y <= f.y + f.h
      ) {
        selectFrame(i);
        return;
      }
    }
  });

  function selectFrame(idx: number): void {
    setSelectedIndex(idx);
    draw(canvas);
    updateDetails();
    previewCrop();
    scrollToItem(idx);
  }

  function scrollToItem(idx: number): void {
    const item = framesList.querySelector<HTMLDivElement>(
      `[data-idx="${idx}"]`,
    );
    if (!item) return;

    item.scrollIntoView({ block: "nearest" });
    framesList
      .querySelectorAll<HTMLDivElement>(".item")
      .forEach((el) => (el.style.background = ""));
    item.style.background = "#10131a";
  }

  function updateDetails() {
    if (selectedIndex < 0) {
      detailsEl.textContent = "—";
      return;
    }
    const f = frames[selectedIndex];
    detailsEl.innerHTML = `<b>${escapeHtml(f.name)}</b><br>pos: [${f.x}, ${f.y}] size: [${f.w}×${f.h}] rotated: ${f.rotated ? "yes" : "no"}`;
  }

  function escapeHtml(s: string): string {
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

  function populateList() {
    framesList.innerHTML = "";
    frames.forEach((f, i) => {
      const div = document.createElement("div");
      div.className = "item";
      // div.dataset.idx = i;
      const cnv = document.createElement("canvas");
      cnv.className = "thumb";
      cnv.width = 44;
      cnv.height = 44;
      const cctx = cnv.getContext("2d") as CanvasRenderingContext2D;
      if (atlasImg) {
        const scale = Math.min(cnv.width / f.w, cnv.height / f.h);
        const tw = Math.max(1, Math.floor(f.w * scale));
        const th = Math.max(1, Math.floor(f.h * scale));
        const ox = Math.floor((cnv.width - tw) / 2);
        const oy = Math.floor((cnv.height - th) / 2);
        cctx.imageSmoothingEnabled = false;
        cctx.drawImage(atlasImg, f.x, f.y, f.w, f.h, ox, oy, tw, th);
      }
      const meta = document.createElement("div");
      meta.className = "meta";
      const name = document.createElement("div");
      name.className = "name";
      name.textContent = f.name;
      const coords = document.createElement("div");
      coords.className = "coords";
      coords.textContent = `x:${f.x} y:${f.y} w:${f.w} h:${f.h}`;
      meta.appendChild(name);
      meta.appendChild(coords);
      div.appendChild(cnv);
      div.appendChild(meta);
      div.addEventListener("click", () => selectFrame(i));
      framesList.appendChild(div);
    });
  }

  async function handleFilesChanged() {
    if (!imgFile.files || !metaFile.files) return;
    if (!imgFile.files[0] || !metaFile.files[0]) return;
    try {
      setStatus("Loading atlas image...");
      atlasImg = await loadImageFromFile(imgFile.files[0]);
      setStatus("Reading the atlas metadata...");
      const metaText = await metaFile.files[0].text();
      frames = parseMeta(metaText);
      if (!frames.length) throw new Error("No frames found in metadata");
      scale = 1;
      offsetX = 0;
      offsetY = 0;
      selectedIndex = -1;
      fitCanvasToParent();
      populateList();
      setStatus(
        `Done: frames loaded: ${frames.length}. Click on the list or on the atlas.`,
      );
    } catch (e) {
      console.error(e);
      // setStatus("Error: " + e.message, "error");
    }
  }

  imgFile.addEventListener("change", handleFilesChanged);
  metaFile.addEventListener("change", handleFilesChanged);
  window.addEventListener("load", fitCanvasToParent);

  btnFindByName.addEventListener("click", () => {
    const q = (nameQuery.value || "").toLowerCase();
    if (!q) return;
    const idx = frames.findIndex((f) => f.name.toLowerCase().includes(q));
    if (idx >= 0) {
      selectFrame(idx);
      setStatus(`Match found by name: “${frames[idx].name}”`, "match");
    } else {
      setStatus("No matches found by name", "warning");
    }
  });

  function previewCrop() {
    const f = frames[selectedIndex];
    drawCropTo(cropCanvas, f, atlasImg);
  }

  async function findByImage(): Promise<void> {
    if (!queryImg.files) return;
    if (!queryImg.files[0]) {
      setStatus("Upload an image for comparison", "warning");
      return;
    }
    if (!atlasImg || !frames.length) {
      setStatus("Download the atlas and metadata", "warning");
      return;
    }
    try {
      setStatus("Preparing image request...");
      const qImg = await loadImageFromFile(queryImg.files[0]);

      const Q = document.createElement("canvas");
      Q.width = 64;
      Q.height = 64;
      const qctx = Q.getContext("2d", {
        willReadFrequently: true,
      }) as CanvasRenderingContext2D;
      const qScale = Math.min(64 / qImg.width, 64 / qImg.height);
      const qW = Math.max(1, Math.floor(qImg.width * qScale));
      const qH = Math.max(1, Math.floor(qImg.height * qScale));
      const qx = Math.floor((64 - qW) / 2),
        qy = Math.floor((64 - qH) / 2);
      qctx.fillStyle = "rgba(0,0,0,0)";
      qctx.clearRect(0, 0, 64, 64);
      qctx.imageSmoothingEnabled = false;
      qctx.drawImage(qImg, 0, 0, qImg.width, qImg.height, qx, qy, qW, qH);
      const qData = qctx.getImageData(0, 0, 64, 64).data;

      const T = document.createElement("canvas");
      T.width = 64;
      T.height = 64;
      const tctx = T.getContext("2d", {
        willReadFrequently: true,
      }) as CanvasRenderingContext2D;

      let best: { idx: number; mse: number } = {
        idx: -1,
        mse: Infinity,
      };

      setStatus("I compare it with frames...");
      for (let i = 0; i < frames.length; i++) {
        const f = frames[i];
        tctx.clearRect(0, 0, 64, 64);
        const s = Math.min(64 / f.w, 64 / f.h);
        const tw = Math.max(1, Math.floor(f.w * s));
        const th = Math.max(1, Math.floor(f.h * s));
        const tx = Math.floor((64 - tw) / 2),
          ty = Math.floor((64 - th) / 2);
        tctx.imageSmoothingEnabled = false;
        if (f.rotated) {
          tctx.save();
          tctx.translate(32, 32);
          tctx.rotate(-Math.PI / 2);
          tctx.drawImage(
            atlasImg,
            f.x,
            f.y,
            f.h,
            f.w,
            -th / 2,
            -tw / 2,
            th,
            tw,
          );
          tctx.restore();
        } else {
          tctx.drawImage(atlasImg, f.x, f.y, f.w, f.h, tx, ty, tw, th);
        }
        const d = tctx.getImageData(0, 0, 64, 64).data;
        let mse = 0;
        for (let p = 0; p < d.length; p += 4) {
          const dr = d[p] - qData[p];
          const dg = d[p + 1] - qData[p + 1];
          const db = d[p + 2] - qData[p + 2];
          mse += dr * dr + dg * dg + db * db;
        }
        mse /= 64 * 64 * 3;
        if (mse < best.mse) best = { idx: i, mse };
      }

      if (best.idx >= 0) {
        selectFrame(best.idx);
        setStatus(
          `Best match: "${frames[best.idx].name}" (MSE=${best.mse.toFixed(1)})`,
          "match",
        );
        queryCtx.clearRect(0, 0, queryCanvas.width, queryCanvas.height);
        queryCtx.imageSmoothingEnabled = false;
        queryCtx.drawImage(
          Q,
          0,
          0,
          64,
          64,
          0,
          0,
          queryCanvas.width,
          queryCanvas.height,
        );
        previewCrop();
      } else {
        setStatus("No matches found", "warning");
      }
    } catch (e) {
      console.error(e);
      // setStatus("Matching error: " + e.message, "error");
    }
  }

  btnFindByImage.addEventListener("click", findByImage);
});
