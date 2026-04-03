import { apiRequest, buildQuery } from "./http.js";

const basePath = "/api/vendas";

export const listVendas = (params = {}) =>
  apiRequest(`${basePath}${buildQuery(params)}`);

export const getVenda = (id) => apiRequest(`${basePath}/${id}`);

export const createVenda = (payload) =>
  apiRequest(basePath, { method: "POST", body: payload });

export const updateVenda = (id, payload) =>
  apiRequest(`${basePath}/${id}`, { method: "PUT", body: payload });

export const deleteVenda = (id) =>
  apiRequest(`${basePath}/${id}`, { method: "DELETE" });
