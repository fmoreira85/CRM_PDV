import { apiRequest, buildQuery } from "./http.js";

const basePath = "/api/caixa";

export const listCaixa = (params = {}) =>
  apiRequest(`${basePath}${buildQuery(params)}`);

export const getCaixa = (id) => apiRequest(`${basePath}/${id}`);

export const createCaixa = (payload) =>
  apiRequest(basePath, { method: "POST", body: payload });

export const updateCaixa = (id, payload) =>
  apiRequest(`${basePath}/${id}`, { method: "PUT", body: payload });

export const deleteCaixa = (id) =>
  apiRequest(`${basePath}/${id}`, { method: "DELETE" });

export const getResumoCaixa = (params = {}) =>
  apiRequest(`${basePath}/resumo${buildQuery(params)}`);

export const getComparativoCaixa = (params = {}) =>
  apiRequest(`${basePath}/comparativo${buildQuery(params)}`);
