export const queryCanvas = document.getElementById(
  "queryCanvas",
) as HTMLCanvasElement;
export const cropCanvas = document.getElementById(
  "cropCanvas",
) as HTMLCanvasElement;

export const queryCtx = queryCanvas.getContext(
  "2d",
) as CanvasRenderingContext2D;
export const canvas = document.getElementById(
  "atlasCanvas",
) as HTMLCanvasElement;
export const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
export const imgFile = document.getElementById("imgFile") as HTMLInputElement;
export const metaFile = document.getElementById("metaFile") as HTMLInputElement;
export const nameQuery = document.getElementById(
  "nameQuery",
) as HTMLInputElement;
export const btnFindByName = document.getElementById(
  "btnFindByName",
) as HTMLButtonElement;
export const queryImg = document.getElementById("queryImg") as HTMLInputElement;
export const btnFindByImage = document.getElementById(
  "btnFindByImage",
) as HTMLButtonElement;

export const framesList = document.getElementById(
  "framesList",
) as HTMLDivElement;
export const statusEl = document.getElementById("status") as HTMLDivElement;
export const detailsEl = document.getElementById(
  "frameDetails",
) as HTMLDivElement;
