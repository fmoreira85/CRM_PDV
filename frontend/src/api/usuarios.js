import { apiRequest, buildQuery } from "./http.js";

const basePath = "/api/usuarios";

export const listUsuarios = (params = {}) =>
  apiRequest(`${basePath}${buildQuery(params)}`);

export const getUsuario = (id) => apiRequest(`${basePath}/${id}`);

export const createUsuario = (payload) =>
  apiRequest(basePath, { method: "POST", body: payload });

export const updateUsuario = (id, payload) =>
  apiRequest(`${basePath}/${id}`, { method: "PUT", body: payload });

export const deleteUsuario = (id) =>
  apiRequest(`${basePath}/${id}`, { method: "DELETE" });
