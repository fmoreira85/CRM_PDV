import { apiRequest, buildQuery } from "./http.js";

const basePath = "/api/fornecedores";

export const listFornecedores = (params = {}) =>
  apiRequest(`${basePath}${buildQuery(params)}`);

export const getFornecedor = (id) => apiRequest(`${basePath}/${id}`);

export const createFornecedor = (payload) =>
  apiRequest(basePath, { method: "POST", body: payload });

export const updateFornecedor = (id, payload) =>
  apiRequest(`${basePath}/${id}`, { method: "PUT", body: payload });

export const deleteFornecedor = (id) =>
  apiRequest(`${basePath}/${id}`, { method: "DELETE" });
