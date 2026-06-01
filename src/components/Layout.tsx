import { Outlet, useNavigation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Breadcrumb from "./Breadcrumb";
import PageLoader from "./common/Loader";

export default function Layout() {
  const navigation = useNavigation();

  return (
    <div className="dashboard-layout-wrapper">
      <div className="dashboard-layout-inner">
        <div className="dashboard-layout">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="dashboard-content">
            {/* Top Bar */}
            <TopBar />

            {/* Route Loader */}
            {navigation.state === "loading" && <PageLoader />}

            {/* Breadcrumb */}
            <Breadcrumb />

            {/* Page Content */}
            <div className="page-content">
              <Outlet />
            </div>
          </div>
        </div>
        {/* GLOBAL PANEL ROOT */}
        <div id="global-slide-panel-root"></div>
      </div>
    </div>
  );
}