import { UploadOutlined } from "@ant-design/icons";
import { Button, Upload } from "antd";
import Sider from "antd/es/layout/Sider";
import type { RcFile } from "antd/es/upload";
import { useContext, useEffect, useState } from "react";
import { Context } from "../../store/context";
import { loadImageFromFile } from "../../utils";
import { FrameList } from "../FrameList";
import type { AtlasFrame, AtlasHashWithMeta } from "./types";

export const Aside = () => {
  const [imgUploadStatus, setImgUploadStatus] = useState(false);
  const [metaDataUploadStatus, setMetaDataUploadStatus] = useState(false);
  const {
    atlasData,
    image,
    parcedFrames,
    setImage,
    setAtlasData,
    setParcedFrames,
  } = useContext(Context);
  const allowedImageTypes = ["image/png", "image/webp", "image/jpeg"];
  const allowedMetaDateTypes = ["json", "application/json"];
  const siderStyle: React.CSSProperties = {
    color: "#2B2B2B",
    backgroundColor: "#F5F3FF",
  };

  const uploadImgProps = {
    name: "file",
    accept: "image/png,image/webp,image/jpeg",
    async beforeUpload(file: RcFile) {
      const isRequiredType = allowedImageTypes.includes(file.type);

      setImgUploadStatus(false);

      if (isRequiredType) {
        const img = await loadImageFromFile(file);
        setImage(img);
        setImgUploadStatus(true);
      }

      return false;
    },
  };
  const uploadMetaDataProps = {
    name: "file",
    accept: ".json",
    async beforeUpload(file: RcFile) {
      const isRequiredType = allowedMetaDateTypes.includes(file.type);
      setMetaDataUploadStatus(false);

      if (!isRequiredType) {
        return false;
      }

      const fileMeta = await file.text();
      setAtlasData(fileMeta);
      setMetaDataUploadStatus(true);
      return false;
    },
  };

  function parseJsonAtlas(j: AtlasHashWithMeta): AtlasFrame[] {
    const out = [];
    for (const [name, fr] of Object.entries(j.frames)) {
      const rect = fr.frame || fr;
      const rotated = !!fr.rotated;
      out.push({
        name,
        x: rect.x | 0,
        y: rect.y | 0,
        w: rect.w | 0,
        h: rect.h | 0,
        rotated,
      });
    }
    return out;
  }

  function handleFilesChanged() {
    if (!imgUploadStatus || !metaDataUploadStatus || !atlasData) return;
    try {
      const j = JSON.parse(atlasData);
      const frames = parseJsonAtlas(j);
      setParcedFrames(frames);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    handleFilesChanged();
  }, [imgUploadStatus, metaDataUploadStatus, atlasData]);

  return (
    <Sider width="20%" style={siderStyle}>
      <h2>Files</h2>
      <div>
        <label>Image Atlas (PNG/JPEG/WEBP)</label>
        <Upload {...uploadImgProps}>
          <Button icon={<UploadOutlined />}>Upload</Button>
        </Upload>
      </div>
      <div>
        <label>Atlas Metadata (JSON)</label>
        <Upload {...uploadMetaDataProps}>
          <Button icon={<UploadOutlined />}>Upload</Button>
        </Upload>
        {/* <p>JSON from TexturePacker and XML are supported.</p> */}
      </div>
      <FrameList frames={parcedFrames} image={image} />
    </Sider>
  );
};
