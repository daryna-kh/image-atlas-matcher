export interface AtlasFrame {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotated: boolean;
}

export interface AtlasHashFrame {
  frame: { x: number; y: number; w: number; h: number };
  rotated: boolean;
  trimmed?: boolean;
  spriteSourceSize?: { x: number; y: number; w: number; h: number };
  sourceSize?: { w: number; h: number };
}

export interface AtlasHashWithMeta {
  frames: Record<string, AtlasHashFrame>;
  meta?: {
    app?: string;
    version?: string;
    image?: string;
    size?: { w: number; h: number };
    scale?: number | string;
  };
}
