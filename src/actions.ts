import {
  cropCanvas,
  DATABASE_NAME,
  OBJECTS_STORE,
  queryCanvas,
  queryCtx,
} from "./constants";
import { loadImageFromFile } from "./handlers";
import { parseMeta } from "./parsers";
import { state, loadAtlas, selectFrame as setState } from "./state";
import { draw, drawCropTo, fitCanvasToParent } from "./view";
import {
  computeMSE,
  normalizeImage,
  escapeHtml,
  generateThumbnail,
} from "./calculations";
import type { Frame } from "./global";

export type StatusCallback = (message: string, type?: string) => void;

async function addToDB(imgInput: File, data: Frame[]) {
  const db = window.indexedDB.open(DATABASE_NAME);

  db.onsuccess = async (e) => {
    if (!e.target) return;
    const target = e.target as IDBOpenDBRequest;

    const db_ = target.result;

    const transaction = db_.transaction(OBJECTS_STORE, "readwrite");
    const store = transaction.objectStore(OBJECTS_STORE);
    const record = {
      id: 1,
      image: imgInput,
      json: data,
    };
    const addRequest = store.put(record);
    addRequest.onsuccess = () => console.log(`File saved!`);
    addRequest.onerror = () => console.error(addRequest.error);
  };
}

export function getUser(id: number) {
  const db = window.indexedDB.open(DATABASE_NAME);

  db.onsuccess = (e) => {
    if (!e.target) return;
    const target = e.target as IDBOpenDBRequest;

    const db_ = target.result;

    const transaction = db_.transaction(OBJECTS_STORE, "readwrite");
    const store = transaction.objectStore(OBJECTS_STORE);

    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      console.log("Get files", getRequest.result);
    };
  };
}

export async function loadFiles(
  imgFile: File,
  metaFile: File,
  onStatus: StatusCallback,
): Promise<void> {
  try {
    onStatus("Loading atlas image...");
    const atlasImg = await loadImageFromFile(imgFile);

    onStatus("Reading the atlas metadata...");
    const metaText = await metaFile.text();
    const frames = parseMeta(metaText);

    if (!frames.length) {
      throw new Error("No frames found in metadata");
    }
    addToDB(imgFile, frames);
    loadAtlas(atlasImg, frames);
    fitCanvasToParent();
    draw();

    onStatus(
      `Done: ${frames.length} frames loaded. Click on the list or on the atlas.`,
      "match",
    );
  } catch (e) {
    console.error(e);
    onStatus(
      `Error: ${e instanceof Error ? e.message : "Unknown error"}`,
      "error",
    );
  }
}

export function selectFrame(idx: number): void {
  setState(idx);
  draw();
  updateDetails();
  previewCrop();
}

export function updateDetails(detailsEl?: HTMLElement): void {
  if (!detailsEl) return;

  if (state.selectedIndex < 0) {
    detailsEl.textContent = "—";
    return;
  }

  if (!state.frames) return;

  const f = state.frames[state.selectedIndex];
  detailsEl.innerHTML = `<b>${escapeHtml(f.name)}</b><br>pos: [${f.x}, ${f.y}] size: [${f.w}×${f.h}] rotated: ${f.rotated ? "yes" : "no"}`;
}

export function populateList(
  framesList: HTMLElement,
  onSelectFrame: (idx: number) => void,
): void {
  framesList.innerHTML = "";

  if (!state.frames || !state.atlasImg) return;

  state.frames.forEach((f, i) => {
    const div = document.createElement("div");
    div.className = "item";
    div.dataset.idx = String(i);

    const cnv = document.createElement("canvas");
    cnv.className = "thumb";
    cnv.width = 44;
    cnv.height = 44;
    const cctx = cnv.getContext("2d") as CanvasRenderingContext2D;

    generateThumbnail(cctx, state.atlasImg!, f, 44);

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

    div.addEventListener("click", () => onSelectFrame(i));
    framesList.appendChild(div);
  });
}

export function scrollToItem(framesList: HTMLElement, idx: number): void {
  const item = framesList.querySelector<HTMLDivElement>(`[data-idx="${idx}"]`);
  if (!item) return;

  item.scrollIntoView({ block: "nearest" });
  framesList.querySelectorAll<HTMLDivElement>(".item").forEach((el) => {
    el.classList.remove("bg-base-800");
  });
  item.classList.add("bg-base-800");
}

export function previewCrop(): void {
  if (!state.frames || state.selectedIndex < 0) return;

  const f = state.frames[state.selectedIndex];
  drawCropTo(cropCanvas, f, state.atlasImg);
}

export function findByName(query: string, onStatus: StatusCallback): void {
  const q = query.toLowerCase().trim();

  if (!q || !state.frames) {
    onStatus("Enter a search query", "warning");
    return;
  }

  const idx = state.frames.findIndex((f) => f.name.toLowerCase().includes(q));

  if (idx >= 0) {
    selectFrame(idx);
    onStatus(`Match found by name: "${state.frames[idx].name}"`, "match");
  } else {
    onStatus("No matches found by name", "warning");
  }
}

export async function findByImage(
  imgFile: File,
  onStatus: StatusCallback,
): Promise<void> {
  if (!state.atlasImg || !state.frames?.length) {
    onStatus("Download the atlas and metadata first", "warning");
    return;
  }

  try {
    onStatus("Loading query image...");
    const qImg = await loadImageFromFile(imgFile);

    const Q = document.createElement("canvas");
    Q.width = 64;
    Q.height = 64;
    const qctx = Q.getContext("2d", {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;

    const qData = normalizeImage(qctx, qImg);

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

    onStatus("Comparing with frames...");

    for (let i = 0; i < state.frames.length; i++) {
      const f = state.frames[i];
      const tData = normalizeImage(tctx, state.atlasImg, f, f.rotated);
      const mse = computeMSE(qData, tData);

      if (mse < best.mse) {
        best = { idx: i, mse };
      }
    }

    if (best.idx >= 0) {
      selectFrame(best.idx);
      onStatus(
        `Best match: "${state.frames[best.idx].name}" (MSE=${best.mse.toFixed(1)})`,
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
    } else {
      onStatus("No matches found", "warning");
    }
  } catch (e) {
    console.error(e);
    onStatus(
      `Error: ${e instanceof Error ? e.message : "Unknown error"}`,
      "error",
    );
  }
}
