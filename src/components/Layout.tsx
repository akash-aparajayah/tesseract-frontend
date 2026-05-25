import { Outlet, useNavigation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Breadcrumb from "./Breadcrumb";
import PageLoader from "./common/Loader";

export default function Layout() {
  const navigation = useNavigation();

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Top Bar */}
      <TopBar />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main
        style={{
          marginLeft: "250px",
          marginTop: "55px",
          padding: "18px",
          backgroundColor: "#f9fafb",
          height: "calc(100vh - 55px)",
          overflowY: "auto",
          overflowX: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Route Loader */}
        {navigation.state === "loading" && <PageLoader />}

        {/* Breadcrumb */}
        <Breadcrumb />

        {/* Page Content */}
        <Outlet />
      </main>
    </div>
  );
}