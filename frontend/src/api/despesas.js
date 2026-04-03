import { apiRequest, buildQuery } from "./http.js";

const basePath = "/api/despesas";

export const listDespesas = (params = {}) =>
  apiRequest(`${basePath}${buildQuery(params)}`);

export const getDespesa = (id) => apiRequest(`${basePath}/${id}`);

export const createDespesa = (payload) =>
  apiRequest(basePath, { method: "POST", body: payload });

export const updateDespesa = (id, payload) =>
  apiRequest(`${basePath}/${id}`, { method: "PUT", body: payload });

export const deleteDespesa = (id) =>
  apiRequest(`${basePath}/${id}`, { method: "DELETE" });
