import api from "./api";

// get user API
export const getAllUsersApi = () => {
  return api.get("/users/get-all-users");
};

//activate or deactivate user API
export const activateOrDeactivateUserApi = (id: string, active: boolean) => {
  return api.patch(`/users/change-user-status/${id}`, {
    is_active: active,
  });
};

//change password API
export const changePasswordApi = (id: number, password: string) => {
  return api.patch(`/users/change-password/${id}`, {
    password,
  });
};

//create user API
export const createUserApi = (user_name: string, email: string, role: string, is_active: boolean) => {
  return api.post("/users/create-user", {
    user_name,
    email,
    role,
    is_active,
  });
};

//delete user API
export const deleteUserApi = (id: string) => {
  return api.delete(`/users/delete-user/${id}`);
};

//get user by id API
export const getUserByIdApi = (id: string) => {
  console.log("enter")
  return api.get(`/users/get-user/${id}`);
};

export const getUserDetailsWithProjectsAndEnvironments = async (id: string) => {
  const response = await api.get(`/users/get-user-details-with-projects-env/${id}`);
  return response?.data;
}

export const removeEnvironmentFromUser = async (data: { user_id: string; environment_id: string, project_id: string }) => {
  const response = await api.patch(`/users/remove-environment-from-user`, data);
  return response?.data;
}

//update user API
export const updateUserApi = (
  id: string,
  data: {
    user_name: string;
    email: string;
    role: string;
  }
) => {
  return api.patch(`/users/update-user/${id}`, data);
};

