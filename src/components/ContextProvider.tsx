import { useMemo, useState } from "react";
import type { AtlasFrame } from "./Aside/types";
import { Context } from "../store/context";

export const ContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [atlasData, setAtlasData] = useState<string | null>(null);
  const [parcedFrames, setParcedFrames] = useState<AtlasFrame[] | null>(null);

  const value = useMemo(
    () => ({
      image,
      atlasData,
      parcedFrames,
      setImage,
      setAtlasData,
      setParcedFrames,
    }),
    [image, atlasData, parcedFrames]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};
