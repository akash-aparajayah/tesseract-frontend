import axios from "axios";

const api = axios.create({
  // baseURL: "https://0csk9hw3-8500.inc1.devtunnels.ms/api",
  baseURL: "http://localhost:8500/api",
});

// REQUEST INTERCEPTOR: This is what injects the header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken"); // Check this name!

    if (token) {
      // Use backticks (`) for the string template
      config.headers.Authorization = `Bearer ${token}`;
      // console.log("Token attached to header:", token); // Debugging line
    } else {
      console.warn("No token found in localStorage");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // 🚨 AUTO LOGOUT
      console.error(
        "401 API FAILED =>",
        error.config?.url
      );

      console.error(
        "401 RESPONSE =>",
        error.response?.data
      );
    }

    return Promise.reject(error);
  },
);

export const validateSetupTokenApi = (
  token: string
) => {
  return api.get(
    `/auth/setup-account/${token}`
  );
};

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

export default api;
