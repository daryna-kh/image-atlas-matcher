import { UploadOutlined } from "@ant-design/icons";
import { Button, Upload } from "antd";
import Sider from "antd/es/layout/Sider";
import type { RcFile } from "antd/es/upload";
import { loadImageFromFile } from "../utils";
import { useEffect, useState } from "react";

export const Aside = () => {
  const [imgUploadStatus, setImgUploadStatus] = useState(false);
  const [metaDataUploadStatus, setMetaDataUploadStatus] = useState(false);
  const allowedImageTypes = ["image/png", "image/web", "image/jpeg"];
  const allowedMetaDateTypes = ["json", "xml"];
  const siderStyle: React.CSSProperties = {
    color: "#2B2B2B",
    backgroundColor: "#F5F3FF",
  };

  const uploadImgProps = {
    name: "file",
    accept: "image/png,image/webp,image/jpeg",
    async beforeUpload(file: RcFile) {
      const isRequiredType = allowedImageTypes.includes(file.type);

      setImgUploadStatus(isRequiredType);

      if (isRequiredType) {
        await loadImageFromFile(file);
      }

      return isRequiredType;
    },
  };
  const uploadMetaDataProps = {
    name: "file",
    accept: ".json,.xml",
    async beforeUpload(file: RcFile) {
      const isRequiredType = allowedMetaDateTypes.includes(file.type);
      console.log(file);
      setMetaDataUploadStatus(isRequiredType);
      const fileMeta = await file.text();
      return isRequiredType;
    },
  };

  function handleFilesChanged() {
    if (!imgUploadStatus && !metaDataUploadStatus) return;
  }

  useEffect(() => {
    handleFilesChanged();
  }, [imgUploadStatus, metaDataUploadStatus]);

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
        <label>Atlas Metadata (JSON or XML)</label>
        <Upload {...uploadMetaDataProps}>
          <Button icon={<UploadOutlined />}>Upload</Button>
        </Upload>
        <p>JSON from TexturePacker and XML are supported.</p>
      </div>
    </Sider>
  );
};
