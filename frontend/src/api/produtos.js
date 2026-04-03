import { apiRequest, buildQuery } from "./http.js";

const basePath = "/api/produtos";
const categoriasPath = "/api/categorias";
const subcategoriasPath = "/api/subcategorias";

export const listProdutos = (params = {}) =>
  apiRequest(`${basePath}${buildQuery(params)}`);

export const getProduto = (id) => apiRequest(`${basePath}/${id}`);

export const createProduto = (payload) =>
  apiRequest(basePath, { method: "POST", body: payload });

export const updateProduto = (id, payload) =>
  apiRequest(`${basePath}/${id}`, { method: "PUT", body: payload });

export const deleteProduto = (id) =>
  apiRequest(`${basePath}/${id}`, { method: "DELETE" });

export const listCategorias = (params = {}) =>
  apiRequest(`${categoriasPath}${buildQuery(params)}`);

export const getCategoria = (id) => apiRequest(`${categoriasPath}/${id}`);

export const createCategoria = (payload) =>
  apiRequest(categoriasPath, { method: "POST", body: payload });

export const updateCategoria = (id, payload) =>
  apiRequest(`${categoriasPath}/${id}`, { method: "PUT", body: payload });

export const deleteCategoria = (id) =>
  apiRequest(`${categoriasPath}/${id}`, { method: "DELETE" });

export const listSubcategorias = (params = {}) =>
  apiRequest(`${subcategoriasPath}${buildQuery(params)}`);

export const getSubcategoria = (id) => apiRequest(`${subcategoriasPath}/${id}`);

export const createSubcategoria = (payload) =>
  apiRequest(subcategoriasPath, { method: "POST", body: payload });

export const updateSubcategoria = (id, payload) =>
  apiRequest(`${subcategoriasPath}/${id}`, { method: "PUT", body: payload });

export const deleteSubcategoria = (id) =>
  apiRequest(`${subcategoriasPath}/${id}`, { method: "DELETE" });
