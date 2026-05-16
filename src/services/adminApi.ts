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
export const createUserApi = (user_name: string, email: string, password: string, role: string, is_active: boolean) => {
  return api.post("/users/create-user", {
    user_name,
    email,
    password,
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

