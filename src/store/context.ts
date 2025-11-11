import { createContext } from "react";
import type { AtlasFrame } from "../components/Aside/types";

interface ContextType {
  image: HTMLImageElement | null;
  atlasData: string | null;
  parcedFrames: AtlasFrame[] | null;
  setImage: (img: HTMLImageElement) => void;
  setAtlasData: (data: string) => void;
  setParcedFrames: (data: AtlasFrame[]) => void;
}
export const initialValue: ContextType = {
  image: null,
  atlasData: null,
  parcedFrames: null,
  setImage: (value) => ({ ...initialValue, image: value }),
  setAtlasData: () => {},
  setParcedFrames: (data) => ({ ...initialValue, parcedFrames: data }),
};

export const Context = createContext(initialValue);
