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
export const createEnvironment = async (projectId: string, data: { environment_name: string }) => {
  const response = await api.post(`/project/create-environment/${projectId}`, data);
  return response.data;
};

/* -------- GET ENVIRONMENTS -------- */
export const getEnvironmentsByProjectId = async (projectId: string) => {
  const response = await api.get(`/project/get-environments/${projectId}`);
  return response.data; // This is { success: true, data: [...] }
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
export const updateProvider = async (providerId: string, data: { credentials: Record<string, string> }) => {
  const response = await api.patch(`/services/update-provider/${providerId}`, data);
  return response.data;
};

/* -------- DELETE PROVIDER -------- */
export const deleteProvider = async (providerId: string) => {
  const response = await api.patch(`/services/delete-provider/${providerId}`);
  return response.data;
};