import { Outlet, useNavigation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Breadcrumb from "./Breadcrumb";
import PageLoader from "./common/Loader";
import { useEffect, useState } from "react";

import {
  getProjects,
  getAllProjectsAndEnvironments,
} from "@/services/projectApi";

import {
  getAllUsersApi,
} from "@/services/adminApi";

const getUserRole = () => {
  try {
    const token =
      localStorage.getItem("accessToken");

    if (!token) return null;

    const payload = JSON.parse(
      atob(token.split(".")[1])
    );

    return payload.role;
  } catch {
    return null;
  }
};

export default function Layout() {
  const navigation = useNavigation();
  const [globalProjects, setGlobalProjects] =
    useState<any[]>([]);

  const [globalEnvironments, setGlobalEnvironments] =
    useState<any[]>([]);

  const [globalProviders, setGlobalProviders] =
    useState<any[]>([]);

  const [globalUsers, setGlobalUsers] =
    useState<any[]>([]);

  useEffect(() => {

    const loadGlobalSearchData = async () => {
      try {
        const role = getUserRole();

        if (
          role === "SUPER_ADMIN" ||
          role === "ADMIN"
        ) {

          // PROJECTS
          const projectsRes =
            await getProjects();

          const projects =
            Array.isArray(projectsRes?.data)
              ? projectsRes.data
              : Array.isArray(projectsRes?.data?.projects)
                ? projectsRes.data.projects
                : [];

          setGlobalProjects(projects);

          // USERS
          const usersRes =
            await getAllUsersApi();

          const users =
            Array.isArray(usersRes?.data)
              ? usersRes.data
              : Array.isArray(usersRes?.data?.users)
                ? usersRes.data.users
                : [];

          setGlobalUsers(users);

          // PROJECTS + ENVIRONMENTS
          const projectsEnvRes =
            await getAllProjectsAndEnvironments();

          const allProjects =
            Array.isArray(projectsEnvRes?.data)
              ? projectsEnvRes.data
              : Array.isArray(
                projectsEnvRes?.data?.projects
              )
                ? projectsEnvRes.data.projects
                : [];

          const environments: any[] = [];
          const providers: any[] = [];

          allProjects.forEach(
            (project: any) => {
              const projectId =
                project.public_id || project.id;

              (project.environments || [])
                .forEach((env: any) => {
                  environments.push({
                    ...env,
                    label: env.environment_name,
                    project_id: projectId,
                  });
                });

              (project.providers || [])
                .forEach((provider: any) => {
                  providers.push({
                    ...provider,
                    label: provider.provider_name,
                    project_id: projectId,
                  });
                });
            }
          );

          setGlobalEnvironments(
            environments
          );

          setGlobalProviders(
            providers
          );
        }

      } catch (error) {

        console.error(
          "Global search load failed",
          error
        );

      }
    };

    loadGlobalSearchData();

  }, []);



  return (
    <div className="dashboard-layout-wrapper">
      <div className="dashboard-layout-inner">
        <div className="dashboard-layout">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="dashboard-content">
            {/* Top Bar */}
            <TopBar
              projects={globalProjects}
              environments={globalEnvironments}
              providers={globalProviders}
              users={globalUsers}
            />

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