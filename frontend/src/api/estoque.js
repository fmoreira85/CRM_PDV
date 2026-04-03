import { apiRequest, buildQuery } from "./http.js";

const basePath = "/api/estoque";

export const listEstoque = (params = {}) =>
  apiRequest(`${basePath}${buildQuery(params)}`);

export const getEstoque = (id) => apiRequest(`${basePath}/${id}`);

export const createEstoque = (payload) =>
  apiRequest(basePath, { method: "POST", body: payload });

export const updateEstoque = (id, payload) =>
  apiRequest(`${basePath}/${id}`, { method: "PUT", body: payload });

export const deleteEstoque = (id) =>
  apiRequest(`${basePath}/${id}`, { method: "DELETE" });

export const getBaixoEstoque = (params = {}) =>
  apiRequest(`${basePath}/baixo-estoque${buildQuery(params)}`);

export const getLotesProximosVencimento = (params = {}) =>
  apiRequest(`${basePath}/proximos-vencimento${buildQuery(params)}`);
