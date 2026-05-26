import api from "./api";

/* ========================================================
   PROJECT APIs (Dashboard CRUD)
======================================================== */

/* -------- CREATE PROJECT -------- */
export const createProject = (data: {
  project_name: string;
  project_description: string;
  image_url: string | null;
  isActive: boolean;
}) => {
  return api.post("/project/create-project", data);
};

/* -------- GET ALL PROJECTS -------- */
export const getProjects = async () => {
  const response = await api.get("/project/get-projects");
  return response.data;
};

export const getAllProjectsAndEnvironments = async () => {
  const response = await api.get(`/project/get-all-projects-and-environments`);
  return response?.data;
}

export const assignUserToProjectEnv = async (data: any) => {
  const response = await api.post(`/project/assign-environment-to-user`, data);
  return response?.data;
}

/* -------- GET SINGLE PROJECT -------- */
export const getProjectById = async (projectId: string) => {
  const response = await api.get(`/project/get-project/${projectId}`);
  return response.data;
};

/* -------- UPDATE PROJECT -------- */
export const updateProject = async (projectId: string, data: any) => {
  const response = await api.patch(`/project/update-project/${projectId}`, data);
  return response.data;
};

/* -------- UPDATE PROJECT STATUS -------- */
export const updateProjectStatus = async (projectId: string, isActive: boolean) => {
  const response = await api.patch(`/project/update-project-status/${projectId}`, {
    isActive: isActive,
  });
  return response.data;
};

/* -------- DELETE PROJECT -------- */
export const deleteProject = async (projectId: string) => {
  const response = await api.delete(`/project/delete-project/${projectId}`);
  return response.data;
};

/* ========================================================
   ENVIRONMENT APIs (Project View)
======================================================== */

/* -------- CREATE ENVIRONMENT -------- */
export const createEnvironment = async (projectId: string, data: { environment_name: string; public_id?: string }) => {
  const response = await api.post(`/project/create-environment/${projectId}`, data);
  return response.data;
};

/* -------- GET ENVIRONMENTS -------- */
export const getEnvironmentsByProjectId = async (projectId: string) => {
  const response = await api.get(`/project/get-environments/${projectId}`);
  return response.data; // This is { success: true, data: [...] }
};

export const updateEnvironment = async (
  id: string,
  payload: {
    environment_name: string;
  }
) => {
  const res = await api.patch(
    `/project/update-environment/${id}`,
    payload
  );

  return res.data;
};

export const cloneEnvironment = async (
  id: string,
  payload: {
    environment_name: string;
  }
) => {
  const res = await api.post(
    `/project/clone-environment/${id}`,
    payload
  );

  return res.data;
};

export const deleteEnvironment = async (
  id: string
) => {

  const res = await api.delete(
    `/project/delete-environment/${id}`
  );

  return res.data;
};

/* ========================================================
   SERVICE APIs (Project View)
======================================================== */

/* -------- GET ALL SERVICES -------- */
export const getAllServices = async () => {
  const response = await api.get("/services/get-all-services");
  return response.data;
};

/* ========================================================
   PROVIDER APIs (Project View)
======================================================== */

/* -------- GET PROVIDERS BY SERVICE -------- */
export const getProvidersByServiceId = async (serviceId: string) => {
  const response = await api.get(`/services/get-providers-by-service-id/${serviceId}`);
  return response.data;
};

/* -------- GET SINGLE PROVIDER -------- */
export const getProviderById = async (providerId: string) => {
  const response = await api.get(`/services/get-provider-by-id/${providerId}`);
  return response.data;
};

/* -------- CREATE PROVIDER -------- */
export const createProvider = async (data: {
  environment_id: string;
  service_type_id: string;
  provider_id: string;
  provider_name: string;
  credentials: Record<string, string>;
  mode: string;
  endpoint?: string;
}) => {
  const response = await api.post("/services/create-provider", data);
  return response.data;
};

/* -------- GET PROVIDERS BY ENVIRONMENT -------- */
export const getProvidersByEnvironmentId = async (environmentId: string, serviceTypeId: string) => {
  const response = await api.get(`/services/get-all-providers-by-environment/${environmentId}?services_type_id=${serviceTypeId}`);
  return response.data;
};



/* -------- UPDATE PROVIDER -------- */
export const updateProvider = async (providerId: string, data: any) => {
  const response = await api.patch(`/services/update-provider/${providerId}`,
    { ...data, id: providerId },
  );
  return response.data;
};

/* -------- DELETE PROVIDER -------- */
export const deleteProvider = async (providerId: string) => {
  const response = await api.patch(`/services/delete-provider/${providerId}`);
  return response.data;
};

/* -------- GET ASSIGNED UNASSIGNED EMPLOYEES -------- */
export const getAssignedUnassignedEmployees = async (projectId: string, environmentId: string) => {
  const response = await api.get(
    `/project/get-assigned-unassigned-employees/${projectId}/${environmentId}`,
    { data: { project_id: projectId, environment_id: environmentId } }
  );
  return response.data;
};

export const assignUnassignEmployee = async (data: {
  project_id: string;
  environment_id: string;
  user_id: string[];
  status: boolean;
}) => {
  const response = await api.post(`/project/assign-unassign-employee`, data);
  return response.data;
};

export const createApiKey = (data: any) =>
  api.post("/token/create-api-key", data);

export const getApiKeys = (projectId: string) =>
  api.get(`/token/get-api-keys?project_id=${projectId}`);

export const regenerateApiKey = (id: string) =>
  api.patch(`/token/regenerate-api-key/${id}`);

export const deleteApiKey = (id: string) =>
  api.delete(`/token/delete-api-key/${id}`);

export const userAssignProjectEnv = async (id: string) => {
  console.log("id", id);
  const response = await api.get(`/users/user-assigned-projects/${id}`);
  return response?.data;
};