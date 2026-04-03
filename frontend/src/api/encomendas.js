import { apiRequest, buildQuery } from "./http.js";

const basePath = "/api/encomendas";

export const listEncomendas = (params = {}) =>
  apiRequest(`${basePath}${buildQuery(params)}`);

export const getEncomenda = (id) => apiRequest(`${basePath}/${id}`);

export const createEncomenda = (payload) =>
  apiRequest(basePath, { method: "POST", body: payload });

export const updateEncomenda = (id, payload) =>
  apiRequest(`${basePath}/${id}`, { method: "PUT", body: payload });

export const deleteEncomenda = (id) =>
  apiRequest(`${basePath}/${id}`, { method: "DELETE" });
