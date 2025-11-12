import { ConfigProvider, Layout, theme } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import "./App.css";
import { Aside } from "./components/Aside/Aside";
import { MainView } from "./components/MainView";
import { ContextProvider } from "./components/ContextProvider";

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
        <Layout>
          <ContextProvider>
            <Aside />
            <Content>
              <MainView />
            </Content>
          </ContextProvider>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
