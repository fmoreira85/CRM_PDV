import { apiRequest } from "./http.js";

export const login = (payload) =>
  apiRequest("/api/auth/login", {
    method: "POST",
    auth: false,
    body: payload,
  });
