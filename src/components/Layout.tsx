import { Outlet, useNavigation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import PageLoader from "./common/Loader";

export default function Layout() {
  const navigation = useNavigation();

  return (
    <>
      <TopBar />
      <Sidebar />

      <main
        style={{
          marginLeft: "250px",   // same as sidebar width
          marginTop: "70px",     // same as topbar height
          padding: "24px",
          backgroundColor: "#f9fafb",
          minHeight: "calc(100vh - 70px)",
        }}
      >
        {navigation.state === "loading" && <PageLoader />}
        <Outlet />
      </main>
    </>
  );
}