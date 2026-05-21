import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "../components/Layout";
import Login from "../pages/login";
import Dashboard from "../pages/selfDashboard";
import ProjectDashboard from "../pages/ProjectDashboard";
import ProjectView from "../pages/ProjectView";
import AdminDashboard from "../pages/AdminDashboard";
import AdminCreate from "../pages/AdminCreate";
import ForgotPassword from "@/pages/ForgotPassword";
import UserDetailView from "@/pages/UserDetailView";
import Workspace from "@/pages/Workspace";

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
        path: "project/:projectId/view",
        element: <ProjectView />,
      },

      {
        path: "project/:projectId/logs",
        element: <ProjectView />,
      },
      {
        path: "workspace",
        element: <Workspace />, // Empty placeholder component for now
      },
      {
        path: "user/:userId",
        element: <UserDetailView />,
      },
    ],
  },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}