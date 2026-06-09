// Router.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "../components/Layout";
import Login from "../pages/login";
import Dashboard from "../pages/selfDashboard";
import ProjectDashboard from "../pages/ProjectDashboard";
import ProjectView from "../pages/ProjectView";
import AdminDashboard from "../pages/AdminDashboard";
import ForgotPassword from "@/pages/ForgotPassword";
import UserDetailView from "@/pages/UserDetailView";
import Workspace from "@/pages/Workspace";
import AssignProjectsEnv from "@/pages/AssignProjectsEnv";
import NotFound from "@/components/NotFound/NotFound"; // Import your 404 component
import SetupAccount from "../pages/SetupAccount";
import ProfilePage from "@/pages/ProfilePage";
import ResetPasskey from "@/pages/ResetPasskey";

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
    path: "/reset-passkey/:token",
    element: <ResetPasskey />,
  },
  {
    path: "/setup-account/:token",
    element: <SetupAccount />,
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
        path: "profile",
        element: <ProfilePage />,
      },
      {
        path: "admin",
        element: <AdminDashboard />,
      },
      {
        path: "user/:userId/assign-projects",
        element: <AssignProjectsEnv />,
      },
      {
        path: "user/:userId",
        element: <UserDetailView />,
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
    ],
  },
  // 404 Page
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}