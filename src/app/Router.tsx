import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "../components/Layout";
import Login from "../pages/login";
import Dashboard from "../pages/selfDashboard";
import ProjectDashboard from "../pages/ProjectDashboard";
import ProjectCreateForm from "../pages/ProjectCreateForm";
import ProjectView from "../pages/ProjectView";
import AdminDashboard from "../pages/AdminDashboard";
import AdminCreate from "../pages/AdminCreate";
import ForgotPassword from "@/pages/ForgotPassword";
import ProjectEditForm from "@/pages/ProjectEditForm";
import ProjectBasicEdit from "@/pages/ProjectBasicEdit";
import EnvironmentManagement from "@/pages/EnvironmentManagement";
import ProviderConfig from "@/pages/ProviderConfig";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/forgot-password/:token",
    element: <ForgotPassword />,
  },
  {
    path: "/dashboard",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "admin",
        element: <AdminDashboard />,
      },
      {
        path: "admin-create",
        element: <AdminCreate />,
      },
      {
        path: "project",
        element: <ProjectDashboard />,
      },
      {
        path: "project-create",
        element: <ProjectCreateForm />,
      },
      {
        path: "/dashboard/project/:projectId/view",
        element: <ProjectView />,
      },
      {
        path: "project-edit/:projectId",
        element: <ProjectEditForm />,
      },
      {
        path: "project-edit-basic/:projectId",
        element: <ProjectBasicEdit />,
      },
      {
        path: "project/:projectId/logs",
        element: <ProjectView />,
      },
      // Environment routes
      {
        path: "provider-config",
        element: <ProviderConfig />,
      },
      {
        path: "provider-config/:environmentName",
        element: <ProviderConfig />,
      },
    ],
  },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}