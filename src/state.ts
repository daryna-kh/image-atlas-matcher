import type { Frame, Point } from "./global";

type StateType = {
  atlasImg: HTMLImageElement | null;
  frames: Frame[] | null;
  selectedIndex: number;
};
export const state: StateType = {
  atlasImg: null as HTMLImageElement | null,
  frames: null,
  selectedIndex: -1,
};

export let scale: number = 1;
export let offsetX: number = 0;
export let offsetY: number = 0;

export let isPanning: boolean = false;
export let startPan: Point | null = null;

export function setselectedIndex(i: number) {
  // state.selectedIndex = i;
}
