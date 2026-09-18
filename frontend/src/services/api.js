import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("ns_token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (!e.response)
      e.friendlyMessage = "Unable to connect to NutriSphere server.";
    else
      e.friendlyMessage = e.response.data?.message || "Something went wrong.";
    return Promise.reject(e);
  },
);
export default api;
