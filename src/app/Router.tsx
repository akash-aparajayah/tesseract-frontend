import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "../components/Layout";

import Login from "../pages/login";
import ForgotPassword from "@/pages/ForgotPassword";

import Dashboard from "../pages/selfDashboard";
import ProjectDashboard from "../pages/ProjectDashboard";
import ProjectCreateForm from "../pages/ProjectCreateForm";
import ProjectView from "../pages/ProjectView";
import ProjectEditForm from "@/pages/ProjectEditForm";
import ProjectEdit from "@/pages/ProjectBasicEdit";

// import EnvironmentManagement from "@/pages/EnvironmentManagement";
import ProviderConfig from "@/pages/ProviderConfig";

import AdminDashboard from "../pages/AdminDashboard";
import AdminCreate from "../pages/AdminCreate";

const router = createBrowserRouter([
  // 🔓 Public Routes
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/forgot-password/:token",
    element: <ForgotPassword />,
  },

  // 🔐 Protected Routes
  {
    path: "/dashboard",
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Dashboard /> },

          { path: "admin", element: <AdminDashboard /> },
          { path: "admin-create", element: <AdminCreate /> },

          { path: "project", element: <ProjectDashboard /> },
          { path: "project-create", element: <ProjectCreateForm /> },

          { path: "project-edit/:projectId", element: <ProjectEditForm /> },
          { path: "project-edit-basic/:projectId", element: <ProjectEdit /> },

          { path: "project/:projectId/logs", element: <ProjectView /> },

          // { path: "environments", element: <EnvironmentManagement /> },
          { path: "provider-config/:environmentName", element: <ProviderConfig /> },
        ],
      },
    ],
  },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}