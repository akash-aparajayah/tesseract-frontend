import api from "./api";

// LOGIN
export const loginUser = (data: { email: string; password: string }) => {
  return api.post("/auth/login", data);
};

// LOGOUT
export const logoutUser = () => {
  return api.post("/auth/logout");
};

// FORGOT PASSWORD
export const forgotPasswordApi = (data: { email: string }) => {
  return api.post("/auth/forgotPassword", data);
};

// RESET PASSWORD
export const resetPasswordApi = (data: { token: string; password: string }) => {
  return api.post("/auth/resetPassword", data);
};

// USERS
export const getUserApi = () => {
  return api.get("/users/get-users");
};

// HEALTH
export const healthCheckApi = () => {
  return api.get("/health");
};

export const updatePasswordApi = (data: { password: string }) => {
  return api.patch("/auth/update-password", data);
};

// Validate current password
export const validateUserSecretApi = (
  data: {
    value: string;
    type: "password" | "passkey";
  }
) => {
  return api.post(
    "/auth/validate-user-secret",
    data
  );
}

// VALIDATE SETUP TOKEN
export const validateSetupTokenApi = (
  token: string
) => {
  return api.get(
    `/auth/setup-account/${token}`
  );
};

// COMPLETE ACCOUNT SETUP
export const completeSetupApi = (
  data: {
    token: string;
    password: string;
    credentialPasskey: string;
  }
) => {
  return api.post(
    "/auth/setup-account",
    data
  );
};

export const verifyUser = (data: { passKey: string }) => {
  return api.post("/auth/verify-sensitive-user-access", data);
};

// UPDATE PASSKEY

export const updatePasskeyApi = (
  data: {
    currentPasskey: string;
    newPasskey: string;
  }
) => {
  return api.patch(
    "/auth/update-passkey",
    data
  );
};

export const forgotPasskeyApi = () => {
  return api.post(
    "/auth/forgot-passkey"
  );
};

export const resetPasskeyApi = (
  data: {
    token: string;
    passkey: string;
  }
) => {
  return api.post(
    "/auth/reset-passkey",
    data
  );
};

// FORGOT PASSWORD SELF
export const forgotPasswordSelfApi =
  () => {
    return api.post(
      "/auth/forgot-password-self"
    );
  };