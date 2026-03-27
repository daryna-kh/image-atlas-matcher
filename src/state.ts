import type { Frame, Point } from "./global";

type StateType = {
  atlasImg: HTMLImageElement | null;
  frames: Frame[] | null;
  selectedIndex: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  isPanning: boolean;
  startPan: Point | null;
};

export const state: StateType = {
  atlasImg: null,
  frames: null,
  selectedIndex: -1,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  isPanning: false,
  startPan: null,
};

export function selectFrame(idx: number): void {
  state.selectedIndex = idx;
}

export function loadAtlas(img: HTMLImageElement, frames: Frame[]): void {
  state.atlasImg = img;
  state.frames = frames;
  state.selectedIndex = -1;
  state.scale = 1;
  state.offsetX = 0;
  state.offsetY = 0;
}

export function resetViewport(): void {
  state.scale = 1;
  state.offsetX = 0;
  state.offsetY = 0;
}
