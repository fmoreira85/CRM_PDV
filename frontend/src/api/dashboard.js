import { apiRequest, buildQuery } from "./http.js";

const basePath = "/api/dashboard";

export const getDashboardSummary = () => apiRequest(basePath);

export const getLucroMensal = (params = {}) =>
  apiRequest(`${basePath}/lucro/mensal${buildQuery(params)}`);

export const getLucroAnual = (params = {}) =>
  apiRequest(`${basePath}/lucro/anual${buildQuery(params)}`);

export const getLucroTotal = () => apiRequest(`${basePath}/lucro/total`);

export const getProdutoMaisVendido = (params = {}) =>
  apiRequest(`${basePath}/produtos/mais-vendido${buildQuery(params)}`);

export const getProdutoMenosVendido = (params = {}) =>
  apiRequest(`${basePath}/produtos/menos-vendido${buildQuery(params)}`);

export const getCategoriaMaisVendida = (params = {}) =>
  apiRequest(`${basePath}/categorias/mais-vendida${buildQuery(params)}`);

export const getCategoriaMenosVendida = (params = {}) =>
  apiRequest(`${basePath}/categorias/menos-vendida${buildQuery(params)}`);

export const getClientesInadimplentes = (params = {}) =>
  apiRequest(`${basePath}/clientes/inadimplentes${buildQuery(params)}`);

export const getClientesProximosVencimento = (params = {}) =>
  apiRequest(`${basePath}/clientes/proximos-vencimento${buildQuery(params)}`);

export const getTotalReceber = (params = {}) =>
  apiRequest(`${basePath}/receber/total${buildQuery(params)}`);

export const getEncomendasProximas = (params = {}) =>
  apiRequest(`${basePath}/encomendas/proximas${buildQuery(params)}`);

export const getProdutosAbaixoIdeal = (params = {}) =>
  apiRequest(`${basePath}/estoque/abaixo-ideal${buildQuery(params)}`);

export const getLotesProximosVencimento = (params = {}) =>
  apiRequest(`${basePath}/estoque/lotes-proximos${buildQuery(params)}`);

export const getDescartesPorTipo = (params = {}) =>
  apiRequest(`${basePath}/descartes/tipo${buildQuery(params)}`);

export const getDescartesPorCategoria = (params = {}) =>
  apiRequest(`${basePath}/descartes/categoria${buildQuery(params)}`);

export const getDescartesPorMarca = (params = {}) =>
  apiRequest(`${basePath}/descartes/marca${buildQuery(params)}`);

export const getVendasPorFuncionarioDia = (params = {}) =>
  apiRequest(`${basePath}/vendas/funcionario/dia${buildQuery(params)}`);

export const getVendasPorFuncionarioSemana = (params = {}) =>
  apiRequest(`${basePath}/vendas/funcionario/semana${buildQuery(params)}`);

export const getVendasPorFuncionarioMes = (params = {}) =>
  apiRequest(`${basePath}/vendas/funcionario/mes${buildQuery(params)}`);

export const getVendasPorFuncionarioAno = (params = {}) =>
  apiRequest(`${basePath}/vendas/funcionario/ano${buildQuery(params)}`);

export const getComparativoCaixaVendas = (params = {}) =>
  apiRequest(`${basePath}/comparativo/caixa-vendas${buildQuery(params)}`);

export const getComparativoVendasEstoque = (params = {}) =>
  apiRequest(`${basePath}/comparativo/vendas-estoque${buildQuery(params)}`);

export const getComparativoVendasEstoqueCaixa = (params = {}) =>
  apiRequest(`${basePath}/comparativo/vendas-estoque-caixa${buildQuery(params)}`);
