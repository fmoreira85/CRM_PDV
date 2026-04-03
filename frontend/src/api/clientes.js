import { apiRequest, buildQuery } from "./http.js";

const basePath = "/api/clientes";

export const listClientes = (params = {}) =>
  apiRequest(`${basePath}${buildQuery(params)}`);

export const getCliente = (id) => apiRequest(`${basePath}/${id}`);

export const createCliente = (payload) =>
  apiRequest(basePath, { method: "POST", body: payload });

export const updateCliente = (id, payload) =>
  apiRequest(`${basePath}/${id}`, { method: "PUT", body: payload });

export const deleteCliente = (id) =>
  apiRequest(`${basePath}/${id}`, { method: "DELETE" });
