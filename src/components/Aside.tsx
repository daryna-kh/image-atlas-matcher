import { Button, Upload, message, type UploadProps } from "antd";
import Sider from "antd/es/layout/Sider";
import { UploadOutlined } from "@ant-design/icons";
import { loadImageFromFile } from "../utils";
import type { RcFile } from "antd/es/upload";

export const Aside = () => {
  const siderStyle: React.CSSProperties = {
    textAlign: "center",
    lineHeight: "120px",
    color: "#2B2B2B",
    backgroundColor: "#F5F3FF",
  };
  const props: UploadProps = {
    name: "file",
    accept: "image/png,image/webp,image/jpeg",
    async onChange(info) {
      const result = await loadImageFromFile(info.file as RcFile);
    },
  };
  return (
    <Sider width="25%" style={siderStyle}>
      <Upload {...props}>
        <Button icon={<UploadOutlined />}>Upload</Button>
      </Upload>
    </Sider>
  );
};
