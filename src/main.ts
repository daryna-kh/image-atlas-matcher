import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
  const imgFile = document.getElementById("imgFile")!;
  const metaFile = document.getElementById("metaFile")!;
  const nameQuery = document.getElementById("nameQuery")!;
  const btnFindByName = document.getElementById("btnFindByName")!;
  const queryImg = document.getElementById("queryImg")!;
  const btnFindByImage = document.getElementById("btnFindByImage")!;
  const framesList = document.getElementById("framesList")!;
  const statusEl = document.getElementById("status")!;
  const detailsEl = document.getElementById("frameDetails")!;
  const canvas = document.getElementById("atlasCanvas")! as HTMLCanvasElement;
  const queryCanvas = document.getElementById(
    "queryCanvas",
  )! as HTMLCanvasElement;
  const cropCanvas = document.getElementById(
    "cropCanvas",
  )! as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  const cropCtx = cropCanvas.getContext("2d");
  const queryCtx = queryCanvas.getContext("2d");

  let atlasImg: any = null;
  let frames: any = []; // {name, x,y,w,h, rotated: boolean}
  let selectedIndex = -1;

  // viewport / pan & zoom
  let scale = 1;
  let offsetX = 0,
    offsetY = 0;
  let isPanning = false,
    startPan = null;

  function setStatus(t, cls = "") {
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
    // all frames boxes
    ctx.lineWidth = 1 / scale;
    ctx.strokeStyle = "#e5c07b";
    ctx.setLineDash([4 / scale, 4 / scale]);
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      ctx.strokeRect(f.x, f.y, f.w, f.h);
    }
    // selected
    if (selectedIndex >= 0) {
      const f = frames[selectedIndex];
      ctx.setLineDash([]);
      ctx.strokeStyle = "#7aa2f7";
      ctx.lineWidth = 2 / scale;
      ctx.strokeRect(f.x, f.y, f.w, f.h);
    }
    ctx.restore();
  }

  function worldToScreen(x, y) {
    return { x: x * scale + offsetX, y: y * scale + offsetY };
  }
  function screenToWorld(x, y) {
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

  function selectFrame(idx) {
    selectedIndex = idx;
    draw();
    updateDetails();
    previewCrop();
    scrollToItem(idx);
  }

  function scrollToItem(idx) {
    const item = framesList.querySelector(`[data-idx="${idx}"]`);
    if (item) {
      item.scrollIntoView({ block: "nearest" });
      framesList
        .querySelectorAll(".item")
        .forEach((el) => (el.style.background = ""));
      item.style.background = "#10131a";
    }
  }

  function updateDetails() {
    if (selectedIndex < 0) {
      detailsEl.textContent = "—";
      return;
    }
    const f = frames[selectedIndex];
    detailsEl.innerHTML = `<b>${escapeHtml(f.name)}</b><br>pos: [${f.x}, ${f.y}] size: [${f.w}×${f.h}] rotated: ${f.rotated ? "yes" : "no"}`;
  }

  function escapeHtml(s) {
    return s.replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[m],
    );
  }

  function populateList() {
    framesList.innerHTML = "";
    frames.forEach((f, i) => {
      const div = document.createElement("div");
      div.className = "item";
      div.dataset.idx = i;
      const cnv = document.createElement("canvas");
      cnv.className = "thumb";
      cnv.width = 44;
      cnv.height = 44;
      const cctx = cnv.getContext("2d");
      // draw thumbnail from atlas (fit)
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

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  function parseMeta(text, typeHint) {
    // Try JSON first
    try {
      const j = JSON.parse(text);
      return parseJsonAtlas(j);
    } catch (e) {
      // XML fallback
    }
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");
    if (xml.getElementsByTagName("parsererror").length) {
      throw new Error("Не удалось разобрать как JSON или XML");
    }
    return parseXmlAtlas(xml);
  }

  function parseJsonAtlas(j) {
    const out = [];
    // TexturePacker: { frames: { "name": { frame:{x,y,w,h}, rotated:true/false, ... }, ... } }
    if (j && j.frames) {
      if (Array.isArray(j.frames)) {
        // sometimes frames is an array: [{filename, frame:{x,y,w,h}, rotated}...]
        for (const fr of j.frames) {
          const name = fr.filename || fr.name || fr.n || "(noname)";
          const rect = fr.frame || fr;
          const rotated = !!fr.rotated;
          out.push({
            name,
            x: rect.x | 0,
            y: rect.y | 0,
            w: rect.w | 0,
            h: rect.h | 0,
            rotated,
          });
        }
      } else {
        for (const [name, fr] of Object.entries(j.frames)) {
          const rect = fr.frame || fr;
          const rotated = !!fr.rotated;
          out.push({
            name,
            x: rect.x | 0,
            y: rect.y | 0,
            w: rect.w | 0,
            h: rect.h | 0,
            rotated,
          });
        }
      }
      return out;
    }
    // Generic: array of rects with name
    if (Array.isArray(j)) {
      for (const fr of j) {
        out.push({
          name: fr.name || "(noname)",
          x: fr.x | 0,
          y: fr.y | 0,
          w: fr.w | 0,
          h: fr.h | 0,
          rotated: !!fr.rotated,
        });
      }
      return out;
    }
    throw new Error("Неизвестный формат JSON атласа");
  }

  function parseXmlAtlas(xml) {
    const out = [];
    // Sparrow/Starling: <TextureAtlas imagePath="..."> <SubTexture name="..." x=".." y=".." width=".." height=".." rotated="true|false" /> </TextureAtlas>
    const subs = xml.getElementsByTagName("SubTexture");
    if (subs.length) {
      for (const el of subs) {
        const name = el.getAttribute("name") || "(noname)";
        const x = +el.getAttribute("x") || 0,
          y = +el.getAttribute("y") || 0;
        const w = +el.getAttribute("width") || 0,
          h = +el.getAttribute("height") || 0;
        const rotated =
          el.getAttribute("rotated") === "true" ||
          el.getAttribute("rotation") === "90";
        out.push({ name, x, y, w, h, rotated });
      }
      return out;
    }
    throw new Error("Неизвестный формат XML атласа");
  }

  async function handleFilesChanged() {
    if (!imgFile.files[0] || !metaFile.files[0]) return;
    try {
      setStatus("Загружаю изображение атласа...");
      atlasImg = await loadImageFromFile(imgFile.files[0]);
      setStatus("Читаю метаданные атласа...");
      const metaText = await metaFile.files[0].text();
      frames = parseMeta(metaText, metaFile.files[0].type);
      if (!frames.length)
        throw new Error("В метаданных не найдено ни одного фрейма");
      // Reset view
      scale = 1;
      offsetX = 0;
      offsetY = 0;
      selectedIndex = -1;
      fitCanvasToParent();
      populateList();
      setStatus(
        `Готово: загружено фреймов: ${frames.length}. Кликните по списку или по атласу.`,
      );
    } catch (e) {
      console.error(e);
      setStatus("Ошибка: " + e.message, "error");
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
      setStatus(`Найдено совпадение по имени: "${frames[idx].name}"`, "match");
    } else {
      setStatus("Совпадений по имени не найдено", "warning");
    }
  });

  function drawCropTo(canvas, f) {
    const c = canvas.getContext("2d");
    c.clearRect(0, 0, canvas.width, canvas.height);
    if (!atlasImg || !f) return;
    const scale = Math.min(canvas.width / f.w, canvas.height / f.h);
    const tw = Math.max(1, Math.floor(f.w * scale));
    const th = Math.max(1, Math.floor(f.h * scale));
    const ox = Math.floor((canvas.width - tw) / 2);
    const oy = Math.floor((canvas.height - th) / 2);
    c.imageSmoothingEnabled = false;
    // handle rotated frames: assume 90° rotation around frame rect
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

  // Image matching by MSE on normalized 64x64
  async function findByImage() {
    if (!queryImg.files[0]) {
      setStatus("Загрузите картинку для сопоставления", "warning");
      return;
    }
    if (!atlasImg || !frames.length) {
      setStatus("Загрузите атлас и метаданные", "warning");
      return;
    }
    try {
      setStatus("Готовлю изображение-запрос...");
      const qImg = await loadImageFromFile(queryImg.files[0]);

      // Normalize query to 64x64
      const Q = document.createElement("canvas");
      Q.width = 64;
      Q.height = 64;
      const qctx = Q.getContext("2d", { willReadFrequently: true });
      // Fit query inside 64x64 with aspect preserved
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

      // Prepare temp canvas to extract and normalize frames
      const T = document.createElement("canvas");
      T.width = 64;
      T.height = 64;
      const tctx = T.getContext("2d", { willReadFrequently: true });

      let best = { idx: -1, mse: Infinity };

      setStatus(
        "Сравниваю с фреймами... может занять время на больших атласах",
      );
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
          // draw rotated frame so it appears upright for comparison
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
        // MSE
        let mse = 0;
        for (let p = 0; p < d.length; p += 4) {
          const dr = d[p] - qData[p];
          const dg = d[p + 1] - qData[p + 1];
          const db = d[p + 2] - qData[p + 2];
          // ignore alpha to be more robust
          mse += dr * dr + dg * dg + db * db;
        }
        mse /= 64 * 64 * 3;
        if (mse < best.mse) best = { idx: i, mse };
      }

      if (best.idx >= 0) {
        selectFrame(best.idx);
        setStatus(
          `Лучшее совпадение: "${frames[best.idx].name}" (MSE=${best.mse.toFixed(1)})`,
          "match",
        );
        // show normalized query & crop
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
        setStatus("Совпадений не найдено", "warning");
      }
    } catch (e) {
      console.error(e);
      setStatus("Ошибка сопоставления: " + e.message, "error");
    }
  }

  btnFindByImage.addEventListener("click", findByImage);
});
