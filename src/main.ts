import type { Frame, JsonAtlas, Point } from "./global";
import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
  const imgFile = document.getElementById("imgFile") as HTMLInputElement;
  const metaFile = document.getElementById("metaFile") as HTMLInputElement;
  const nameQuery = document.getElementById("nameQuery") as HTMLInputElement;
  const btnFindByName = document.getElementById(
    "btnFindByName",
  ) as HTMLButtonElement;
  const queryImg = document.getElementById("queryImg") as HTMLInputElement;
  const btnFindByImage = document.getElementById(
    "btnFindByImage",
  ) as HTMLButtonElement;

  const framesList = document.getElementById("framesList") as HTMLDivElement;
  const statusEl = document.getElementById("status") as HTMLDivElement;
  const detailsEl = document.getElementById("frameDetails") as HTMLDivElement;

  const canvas = document.getElementById("atlasCanvas") as HTMLCanvasElement;
  const queryCanvas = document.getElementById(
    "queryCanvas",
  ) as HTMLCanvasElement;
  const cropCanvas = document.getElementById("cropCanvas") as HTMLCanvasElement;

  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const queryCtx = queryCanvas.getContext("2d") as CanvasRenderingContext2D;

  let atlasImg: HTMLImageElement | null = null;
  let frames: Frame[] = [];
  let selectedIndex: number = -1;

  let scale: number = 1;
  let offsetX: number = 0;
  let offsetY: number = 0;

  let isPanning: boolean = false;
  let startPan: Point | null = null;

  function setStatus(t: string, cls: string = ""): void {
    statusEl.textContent = t;
    statusEl.className = "status " + cls;
  }

  function fitCanvasToParent() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    draw();
  }

  window.addEventListener("resize", fitCanvasToParent);

  function draw() {
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
      draw();
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
    draw();
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
    selectedIndex = idx;
    draw();
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

  function loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => reject(new Error("Image load error"));
      img.src = url;
    });
  }

  function parseMeta(text: string): Frame[] {
    try {
      const j: JsonAtlas = JSON.parse(text);
      return parseJsonAtlas(j);
    } catch {
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "application/xml");
      if (xml.getElementsByTagName("parsererror").length) {
        throw new Error("Could not parse as JSON or XML");
      }
      return parseXmlAtlas(xml);
    }
  }

  function parseJsonAtlas(j: JsonAtlas): Frame[] {
    const out: Frame[] = [];

    if (Array.isArray(j)) {
      for (const fr of j) {
        out.push({
          name: fr.name ?? "(noname)",
          x: fr.x | 0,
          y: fr.y | 0,
          w: fr.w | 0,
          h: fr.h | 0,
          rotated: !!fr.rotated,
        });
      }
      return out;
    }

    if ("frames" in j && j.frames) {
      if (Array.isArray(j.frames)) {
        for (const fr of j.frames) {
          const rect = fr.frame ?? fr;
          out.push({
            name: fr.filename ?? fr.name ?? fr.n ?? "(noname)",
            x: (rect.x ?? 0) | 0,
            y: (rect.y ?? 0) | 0,
            w: (rect.w ?? 0) | 0,
            h: (rect.h ?? 0) | 0,
            rotated: !!fr.rotated,
          });
        }
      } else {
        for (const [name, fr] of Object.entries(j.frames)) {
          const rect = fr.frame ?? fr;
          out.push({
            name,
            x: (rect.x ?? 0) | 0,
            y: (rect.y ?? 0) | 0,
            w: (rect.w ?? 0) | 0,
            h: (rect.h ?? 0) | 0,
            rotated: !!fr.rotated,
          });
        }
      }
      return out;
    }

    throw new Error("Unknown JSON atlas format");
  }

  function parseXmlAtlas(xml: Document): Frame[] {
    const out: Frame[] = [];
    const subs = xml.getElementsByTagName("SubTexture");

    if (!subs.length) {
      throw new Error("Unknown XML atlas format");
    }

    for (const el of Array.from(subs)) {
      const name = el.getAttribute("name") ?? "(noname)";
      const x = +(el.getAttribute("x") ?? 0);
      const y = +(el.getAttribute("y") ?? 0);
      const w = +(el.getAttribute("width") ?? 0);
      const h = +(el.getAttribute("height") ?? 0);
      const rotated =
        el.getAttribute("rotated") === "true" ||
        el.getAttribute("rotation") === "90";

      out.push({ name, x, y, w, h, rotated });
    }

    return out;
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

  function drawCropTo(canvas: HTMLCanvasElement, f: Frame) {
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

  function previewCrop() {
    const f = frames[selectedIndex];
    drawCropTo(cropCanvas, f);
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
