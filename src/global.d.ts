export interface Frame {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotated: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export type JsonAtlas =
  | {
      frames:
        | Array<{
            filename?: string;
            name?: string;
            n?: string;
            frame?: { x: number; y: number; w: number; h: number };
            x?: number;
            y?: number;
            w?: number;
            h?: number;
            rotated?: boolean;
          }>
        | Record<
            string,
            {
              frame?: { x: number; y: number; w: number; h: number };
              x?: number;
              y?: number;
              w?: number;
              h?: number;
              rotated?: boolean;
            }
          >;
    }
  | Array<{
      name?: string;
      x: number;
      y: number;
      w: number;
      h: number;
      rotated?: boolean;
    }>;
