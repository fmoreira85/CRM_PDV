import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { canReadDashboard } from "../middleware/permissions.js";
import {
  getDashboardSummary,
  getLucroMensal,
  getLucroAnual,
  getLucroTotal,
  getProdutoMaisVendido,
  getProdutoMenosVendido,
  getCategoriaMaisVendida,
  getCategoriaMenosVendida,
  getClientesInadimplentes,
  getClientesProximosVencimento,
  getTotalReceber,
  getEncomendasProximasPrazo,
  getProdutosAbaixoEstoqueIdeal,
  getLotesProximosVencimento,
  getDescartesPorTipo,
  getDescartesPorCategoria,
  getDescartesPorMarca,
  getVendasPorFuncionarioDia,
  getVendasPorFuncionarioSemana,
  getVendasPorFuncionarioMes,
  getVendasPorFuncionarioAno,
  getComparativoCaixaVendas,
  getComparativoVendasEstoque,
  getComparativoVendasEstoqueCaixa,
} from "../controllers/dashboardController.js";

const router = Router();

router.use(authenticate, canReadDashboard);

router.get("/", getDashboardSummary);
router.get("/lucro/mensal", getLucroMensal);
router.get("/lucro/anual", getLucroAnual);
router.get("/lucro/total", getLucroTotal);

router.get("/produtos/mais-vendido", getProdutoMaisVendido);
router.get("/produtos/menos-vendido", getProdutoMenosVendido);
router.get("/categorias/mais-vendida", getCategoriaMaisVendida);
router.get("/categorias/menos-vendida", getCategoriaMenosVendida);

router.get("/clientes/inadimplentes", getClientesInadimplentes);
router.get("/clientes/proximos-vencimento", getClientesProximosVencimento);
router.get("/receber/total", getTotalReceber);

router.get("/encomendas/proximas", getEncomendasProximasPrazo);
router.get("/estoque/abaixo-ideal", getProdutosAbaixoEstoqueIdeal);
router.get("/estoque/lotes-proximos", getLotesProximosVencimento);

router.get("/descartes/tipo", getDescartesPorTipo);
router.get("/descartes/categoria", getDescartesPorCategoria);
router.get("/descartes/marca", getDescartesPorMarca);

router.get("/vendas/funcionario/dia", getVendasPorFuncionarioDia);
router.get("/vendas/funcionario/semana", getVendasPorFuncionarioSemana);
router.get("/vendas/funcionario/mes", getVendasPorFuncionarioMes);
router.get("/vendas/funcionario/ano", getVendasPorFuncionarioAno);

router.get("/comparativo/caixa-vendas", getComparativoCaixaVendas);
router.get("/comparativo/vendas-estoque", getComparativoVendasEstoque);
router.get("/comparativo/vendas-estoque-caixa", getComparativoVendasEstoqueCaixa);

export default router;
