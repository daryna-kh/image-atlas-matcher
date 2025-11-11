import { createContext } from "react";

interface ContextType {
  image: File | null;
  atlasData: string | null;
}
export const initialValue: ContextType = {
  image: null,
  atlasData: null,
};
export const Context = createContext();
