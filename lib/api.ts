import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/api/v1",
    withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    if (
      status === 401 &&
      !url?.includes("/auth/login") &&
      !url?.includes("/auth/register") &&
      !url?.includes("/user")
    ) {
      if (typeof window !== "undefined") {
        // prevent infinite redirect loop
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;