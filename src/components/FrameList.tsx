import type { AtlasFrame } from "./Aside/types";
import { FrameListItem } from "./FrameListItem";

type FrameListType = {
  frames: AtlasFrame[] | null;
  image: HTMLImageElement | null;
};
export const FrameList = (props: FrameListType) => {
  const { frames, image } = props;

  return (
    <div>
      <label>Frames</label>
      {!frames || frames.length === 0 ? (
        <p>Upload an image and JSON to see a list of frames.</p>
      ) : (
        <div>
          {frames.map((frame, idx) => (
            <FrameListItem
              key={`${frame.name}-${frame.x}-${frame.y}-${idx}`}
              frame={frame}
              image={image}
            />
          ))}
        </div>
      )}
    </div>
  );
};
