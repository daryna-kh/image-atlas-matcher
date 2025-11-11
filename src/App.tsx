import { ConfigProvider, Layout, theme } from "antd";
import "./App.css";
import { Content, Header } from "antd/es/layout/layout";
import { Aside } from "./components/Aside";
import { Context, initialValue } from "./store/context";

const headerStyle: React.CSSProperties = {
  textAlign: "center",
  height: 64,
  paddingInline: 48,
  lineHeight: "64px",
  color: "#2B2B2B",
  backgroundColor: "#837BBF",
};

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorBgContainer: "#fff",
        },
      }}
    >
      <Layout>
        <Header style={headerStyle}>Image Atlas Matcher</Header>
        <Context.Provider value={initialValue}>
          <Aside />
          <Content>Content</Content>
        </Context.Provider>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
