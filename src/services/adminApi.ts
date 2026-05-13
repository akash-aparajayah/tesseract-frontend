import api from "./api";

// get admin API
export const getAllAdminApi = () => {
    return api.get("/users/getAllUsers");
};

//activate or deactivate admin API
export const activateOrDeactivateAdminApi = (id: number, active: boolean) => {
  return api.patch(`/users/${id}/status`, {
    active,
  });
};

//change password API
export const changePasswordApi = (id: number, password: string) => {
  return api.patch(`/users/${id}/password`, {
    password,
  });
};

//create admin API
export const createAdminApi = (name: string, email: string, password: string, role: string) => {
  return api.post("/auth/create-admin", {
    name,
    email,
    password,
    role,
  });
};

//delete admin API
export const deleteAdminApi = (id: number) => {
  return api.delete(`/admin/users/${id}`);
};

