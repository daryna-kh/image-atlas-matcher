import {
  btnFindByImage,
  btnFindByName,
  canvas,
  DATABASE_NAME,
  detailsEl,
  framesList,
  imgFile,
  metaFile,
  nameQuery,
  OBJECTS_STORE,
  queryImg,
  statusEl,
} from "./constants";
import { state } from "./state";
import { draw, fitCanvasToParent } from "./view";
import { screenToWorld, findFrameAtPos } from "./calculations";
import {
  loadFiles,
  selectFrame,
  findByName,
  findByImage,
  populateList,
  scrollToItem,
  updateDetails,
  getUser,
} from "./actions";
import "./style.css";

function setStatus(message: string, type: string = ""): void {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

document.addEventListener("DOMContentLoaded", () => {
  window.addEventListener("resize", fitCanvasToParent);
  window.addEventListener("load", fitCanvasToParent);

  const db = window.indexedDB.open(DATABASE_NAME);

  db.onerror = () => {
    console.error("Error loading database.", db.error);
  };

  db.onsuccess = () => {
    console.log("Database initialized and ready.");
    getUser(1);
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

  const handleFilesChanged = async () => {
    if (!imgFile.files?.[0] || !metaFile.files?.[0]) return;
    await loadFiles(imgFile.files[0], metaFile.files[0], setStatus);
    populateList(framesList, (idx) => {
      selectFrame(idx);
      scrollToItem(framesList, idx);
    });
    updateDetails(detailsEl);
  };

  imgFile.addEventListener("change", handleFilesChanged);
  metaFile.addEventListener("change", handleFilesChanged);

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
