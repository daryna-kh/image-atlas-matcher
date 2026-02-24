import type { Frame, Point } from "./global";

export let atlasImg: HTMLImageElement | null = null;
export let frames: Frame[] = [];
export let selectedIndex: number = -1;

export let scale: number = 1;
export let offsetX: number = 0;
export let offsetY: number = 0;

export let isPanning: boolean = false;
export let startPan: Point | null = null;

export function setSelectedIndex(i: number) {
  selectedIndex = i;
}
