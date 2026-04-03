import {
  addToDB,
  findByImage,
  findByName,
  getAtlasData,
  loadFiles,
  renderAtlas,
  scrollToItem,
  selectFrame,
  updateDetails,
} from "./actions";
import { findFrameAtPos, screenToWorld } from "./calculations";
import {
  btnFindByImage,
  btnFindByName,
  canvas,
  DATABASE_NAME,
  detailsEl,
  framesList,
  imgFile,
  imgFileName,
  metaFile,
  metaFileName,
  nameQuery,
  OBJECTS_STORE,
  queryImg,
  statusEl,
} from "./constants";
import { loadImageFromFile } from "./handlers";
import { parseMeta } from "./parsers";
import { loadAtlas, state } from "./state";
import "./style.css";
import { draw, fitCanvasToParent } from "./view";

function setStatus(message: string, type: string = ""): void {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

document.addEventListener("DOMContentLoaded", () => {
  new ResizeObserver(() => fitCanvasToParent()).observe(canvas);

  const db = window.indexedDB.open(DATABASE_NAME);

  db.onerror = () => {
    console.error("Error loading database.", db.error);
  };

  db.onsuccess = async () => {
    console.log("Database initialized and ready.");
  };

  db.onupgradeneeded = (e) => {
    if (!e.target) return;
    const target = e.target as IDBOpenDBRequest;
    const db_ = target.result;
    if (!db_.objectStoreNames.contains(OBJECTS_STORE)) {
      const store = db_.createObjectStore(OBJECTS_STORE, { keyPath: "id" });
    }
  };

  canvas.addEventListener(
    "wheel",
    (e) => {
      if (!state.atlasImg) return;

      const delta = -Math.sign(e.deltaY) * 0.1;
      const mx = e.offsetX;
      const my = e.offsetY;

      const before = screenToWorld(
        mx,
        my,
        state.scale,
        state.offsetX,
        state.offsetY,
      );
      state.scale = Math.min(10, Math.max(0.1, state.scale * (1 + delta)));
      const after = screenToWorld(
        mx,
        my,
        state.scale,
        state.offsetX,
        state.offsetY,
      );

      state.offsetX +=
        mx - after.x * state.scale - (mx - before.x * state.scale);
      state.offsetY +=
        my - after.y * state.scale - (my - before.y * state.scale);

      draw();
      e.preventDefault();
    },
    { passive: false },
  );

  canvas.addEventListener("mousedown", (e) => {
    state.isPanning = true;
    state.startPan = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener("mouseup", () => {
    state.isPanning = false;
    state.startPan = null;
  });

  window.addEventListener("mousemove", (e) => {
    if (!state.isPanning || !state.startPan) return;

    state.offsetX += e.clientX - state.startPan.x;
    state.offsetY += e.clientY - state.startPan.y;
    state.startPan = { x: e.clientX, y: e.clientY };
    draw();
  });

  canvas.addEventListener("click", (e) => {
    if (!state.atlasImg || !state.frames) return;

    const pos = screenToWorld(
      e.offsetX,
      e.offsetY,
      state.scale,
      state.offsetX,
      state.offsetY,
    );
    const idx = findFrameAtPos(pos, state.frames);

    if (idx >= 0) {
      selectFrame(idx);
      scrollToItem(framesList, idx);
    }
  });

  window.addEventListener("load", handleLoadFromDB);

  async function handleLoadFromDB() {
    const data = await getAtlasData();
    if (!data) return;

    setStatus("Loading atlas image...");
    const atlasImg = await loadImageFromFile(data[0].image);

    loadAtlas(atlasImg, data[0].json);
    fitCanvasToParent();
    renderAtlas();
  }

  const handleFilesChanged = async () => {
    if (!imgFile.files?.[0] || !metaFile.files?.[0]) return;
    setStatus("Reading the atlas metadata...");
    const metaText = await metaFile.files?.[0].text();
    const frames = parseMeta(metaText);

    if (!frames.length) {
      throw new Error("No frames found in metadata");
    }
    addToDB(imgFile.files?.[0], frames);
    await loadFiles(imgFile.files[0], frames, setStatus);
    renderAtlas();
  };

  imgFile.addEventListener("change", () => {
    if (imgFile.files?.[0]) imgFileName.textContent = imgFile.files[0].name;
    handleFilesChanged();
  });
  metaFile.addEventListener("change", () => {
    if (metaFile.files?.[0]) metaFileName.textContent = metaFile.files[0].name;
    handleFilesChanged();
  });

  btnFindByName.addEventListener("click", () => {
    findByName(nameQuery.value || "", setStatus);
    if (state.selectedIndex >= 0) {
      scrollToItem(framesList, state.selectedIndex);
      updateDetails(detailsEl);
    }
  });

  btnFindByImage.addEventListener("click", async () => {
    if (!queryImg.files?.[0]) {
      setStatus("Upload an image for comparison", "warning");
      return;
    }
    await findByImage(queryImg.files[0], setStatus);
    if (state.selectedIndex >= 0) {
      scrollToItem(framesList, state.selectedIndex);
      updateDetails(detailsEl);
    }
  });
});
