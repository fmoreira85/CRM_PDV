import { getDashboardSummary } from "../api/dashboard.js";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const number = new Intl.NumberFormat("pt-BR");

const monthLabels = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
};

const toCurrency = (value) => currency.format(Number(value || 0));
const toNumber = (value) => number.format(Number(value || 0));

const createBarChart = (data, max = null) => {
  const maxValue =
    max ??
    Math.max(
      1,
      ...data.map((item) => Math.abs(Number(item.value ?? item.valor ?? 0)))
    );

  return `
    <div class="bar-chart">
      ${data
        .map((item) => {
          const value = Number(item.value ?? item.valor ?? 0);
          const height = Math.round((Math.abs(value) / maxValue) * 100);
          return `
            <div class="bar-item">
              <div class="bar" style="height: ${height}%"></div>
              <span class="bar-label">${item.label}</span>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
};

const createTable = (headers, rows) => `
  <div class="table-responsive">
    <table class="table table-sm table-dashboard">
      <thead>
        <tr>
          ${headers.map((header) => `<th>${header}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${
          rows.length
            ? rows.map((row) => `<tr>${row.map((col) => `<td>${col}</td>`).join("")}</tr>`).join("")
            : `<tr><td colspan="${headers.length}" class="text-muted">Sem dados</td></tr>`
        }
      </tbody>
    </table>
  </div>
`;

const fallbackDashboard = () => ({
  lucro: {
    mes: 0,
    ano: 0,
    total: 0,
    por_mes: monthLabels.map((label, index) => ({ mes: index + 1, valor: 0 })),
    por_ano: [],
  },
  produtos: { mes: { top: null, bottom: null }, ano: { top: null, bottom: null }, total: { top: null, bottom: null } },
  categorias: { mes: { top: null, bottom: null }, ano: { top: null, bottom: null }, total: { top: null, bottom: null } },
  inadimplentes: { total_receber: 0 },
  encomendas_proximas: [],
  estoque_baixo: [],
  lotes_proximos: [],
  descartes: { total_quantidade: 0, por_categoria: [], por_marca: [], por_tipo: [] },
  comparativo: {
    vendas_mes: 0,
    caixa_entradas_mes: 0,
    caixa_entradas_vendas_mes: 0,
    estoque_saida_venda_mes: 0,
    divergencia_caixa_vendas: 0,
  },
});

const fetchDashboard = async () => {
  try {
    const payload = await getDashboardSummary();
    return payload.data ?? payload;
  } catch (error) {
    console.warn("Dashboard offline, usando dados mockados.");
    return fallbackDashboard();
  }
};

const updateCard = (id, value, subtitle) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `
    <div class="stat-value">${value}</div>
    <div class="stat-label">${subtitle}</div>
  `;
};

export const renderDashboard = () => `
  <div class="dashboard">
    <section class="grid dashboard-cards">
      <div class="card stat-card">
        <div class="stat-icon"><i class="bi bi-graph-up-arrow"></i></div>
        <div id="card-profit-month" class="stat-body"></div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon"><i class="bi bi-calendar2-week"></i></div>
        <div id="card-profit-year" class="stat-body"></div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon"><i class="bi bi-cash-stack"></i></div>
        <div id="card-profit-total" class="stat-body"></div>
      </div>
      <div class="card stat-card">
        <div class="stat-icon"><i class="bi bi-exclamation-circle"></i></div>
        <div id="card-receivable" class="stat-body"></div>
      </div>
    </section>

    <section class="grid two">
      <div class="card">
        <div class="card-header">
          <h4>Lucro por mes</h4>
          <span class="badge text-bg-light">Ano atual</span>
        </div>
        <div id="chart-profit-month" class="chart-area"></div>
      </div>
      <div class="card">
        <div class="card-header">
          <h4>Lucro por ano</h4>
          <span class="badge text-bg-light">Historico</span>
        </div>
        <div id="chart-profit-year" class="chart-area"></div>
      </div>
    </section>

    <section class="grid two">
      <div class="card">
        <div class="card-header">
          <h4>Ranking de produtos</h4>
        </div>
        <div id="table-produtos-ranking"></div>
      </div>
      <div class="card">
        <div class="card-header">
          <h4>Ranking de categorias</h4>
        </div>
        <div id="table-categorias-ranking"></div>
      </div>
    </section>

    <section class="grid two">
      <div class="card">
        <div class="card-header">
          <h4>Encomendas proximas do prazo</h4>
          <i class="bi bi-truck"></i>
        </div>
        <div id="table-encomendas"></div>
      </div>
      <div class="card">
        <div class="card-header">
          <h4>Alertas de estoque</h4>
          <i class="bi bi-exclamation-triangle"></i>
        </div>
        <div id="table-baixo-estoque"></div>
        <div class="mt-3" id="table-validade"></div>
      </div>
    </section>

    <section class="grid two">
      <div class="card">
        <div class="card-header">
          <h4>Descartes</h4>
          <span class="badge text-bg-light">Perdas/Avarias</span>
        </div>
        <div class="discard-summary">
          <div class="discard-total">
            <span class="text-muted">Quantidade descartada</span>
            <strong id="discard-total"></strong>
          </div>
        </div>
        <div class="chart-stack">
          <div>
            <p class="chart-title">Por categoria</p>
            <div id="chart-descartes-categoria" class="chart-area"></div>
          </div>
          <div>
            <p class="chart-title">Por marca</p>
            <div id="chart-descartes-marca" class="chart-area"></div>
          </div>
          <div>
            <p class="chart-title">Por tipo</p>
            <div id="chart-descartes-tipo" class="chart-area"></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <h4>Comparativo Caixa x Vendas</h4>
          <i class="bi bi-bar-chart"></i>
        </div>
        <div id="chart-comparativo" class="chart-area"></div>
        <div class="compare-grid">
          <div>
            <span>Vendas mes</span>
            <strong id="compare-vendas"></strong>
          </div>
          <div>
            <span>Caixa entradas mes</span>
            <strong id="compare-caixa"></strong>
          </div>
          <div>
            <span>Entradas de vendas</span>
            <strong id="compare-caixa-vendas"></strong>
          </div>
          <div>
            <span>Saidas de estoque</span>
            <strong id="compare-estoque"></strong>
          </div>
        </div>
      </div>
    </section>
  </div>
`;

export const initDashboard = async () => {
  const data = await fetchDashboard();

  updateCard("card-profit-month", toCurrency(data.lucro.mes), "Lucro no mes");
  updateCard("card-profit-year", toCurrency(data.lucro.ano), "Lucro no ano");
  updateCard("card-profit-total", toCurrency(data.lucro.total), "Lucro total");
  updateCard(
    "card-receivable",
    toCurrency(data.inadimplentes.total_receber),
    "Total a receber"
  );

  const lucroMesData = data.lucro.por_mes.map((item) => ({
    label: monthLabels[item.mes - 1],
    value: item.valor,
  }));
  document.getElementById("chart-profit-month").innerHTML = createBarChart(lucroMesData);

  const lucroAnoData = data.lucro.por_ano.map((item) => ({
    label: String(item.ano),
    value: item.valor,
  }));
  document.getElementById("chart-profit-year").innerHTML = createBarChart(lucroAnoData);

  const produtoRows = [
    [
      "Mes",
      data.produtos.mes.top?.nome ?? "-",
      data.produtos.mes.bottom?.nome ?? "-",
    ],
    [
      "Ano",
      data.produtos.ano.top?.nome ?? "-",
      data.produtos.ano.bottom?.nome ?? "-",
    ],
    [
      "Geral",
      data.produtos.total.top?.nome ?? "-",
      data.produtos.total.bottom?.nome ?? "-",
    ],
  ];

  document.getElementById("table-produtos-ranking").innerHTML = createTable(
    ["Periodo", "Mais vendido", "Menos vendido"],
    produtoRows
  );

  const categoriaRows = [
    [
      "Mes",
      data.categorias.mes.top?.nome ?? "-",
      data.categorias.mes.bottom?.nome ?? "-",
    ],
    [
      "Ano",
      data.categorias.ano.top?.nome ?? "-",
      data.categorias.ano.bottom?.nome ?? "-",
    ],
    [
      "Geral",
      data.categorias.total.top?.nome ?? "-",
      data.categorias.total.bottom?.nome ?? "-",
    ],
  ];

  document.getElementById("table-categorias-ranking").innerHTML = createTable(
    ["Periodo", "Mais vendida", "Menos vendida"],
    categoriaRows
  );

  document.getElementById("table-encomendas").innerHTML = createTable(
    ["Fornecedor", "Produto", "Prazo", "Status"],
    data.encomendas_proximas.map((item) => [
      item.fornecedor,
      item.produto,
      `${formatDate(item.prazo)} (${item.dias_para_prazo}d)`,
      item.status,
    ])
  );

  document.getElementById("table-baixo-estoque").innerHTML = createTable(
    ["Produto", "Atual", "Ideal"],
    data.estoque_baixo.map((item) => [
      item.produto_nome,
      toNumber(item.quantidade_total),
      toNumber(item.nivel_ideal_total),
    ])
  );

  document.getElementById("table-validade").innerHTML = createTable(
    ["Produto", "Lote", "Validade"],
    data.lotes_proximos.map((item) => [
      item.produto_nome,
      item.lote,
      `${formatDate(item.validade)} (${item.dias_para_vencimento}d)`,
    ])
  );

  document.getElementById("discard-total").textContent = toNumber(
    data.descartes.total_quantidade
  );

  const descartesCategoria = data.descartes.por_categoria.map((item) => ({
    label: item.categoria,
    value: item.quantidade,
  }));
  document.getElementById("chart-descartes-categoria").innerHTML =
    createBarChart(descartesCategoria);

  const descartesMarca = data.descartes.por_marca.map((item) => ({
    label: item.marca,
    value: item.quantidade,
  }));
  document.getElementById("chart-descartes-marca").innerHTML =
    createBarChart(descartesMarca);

  const descartesTipo = data.descartes.por_tipo.map((item) => ({
    label: item.tipo,
    value: item.quantidade,
  }));
  document.getElementById("chart-descartes-tipo").innerHTML =
    createBarChart(descartesTipo);

  const comparativoData = [
    { label: "Vendas", value: data.comparativo.vendas_mes },
    { label: "Caixa", value: data.comparativo.caixa_entradas_mes },
    { label: "Entradas vendas", value: data.comparativo.caixa_entradas_vendas_mes },
  ];
  document.getElementById("chart-comparativo").innerHTML =
    createBarChart(comparativoData);

  document.getElementById("compare-vendas").textContent = toCurrency(
    data.comparativo.vendas_mes
  );
  document.getElementById("compare-caixa").textContent = toCurrency(
    data.comparativo.caixa_entradas_mes
  );
  document.getElementById("compare-caixa-vendas").textContent = toCurrency(
    data.comparativo.caixa_entradas_vendas_mes
  );
  document.getElementById("compare-estoque").textContent = toNumber(
    data.comparativo.estoque_saida_venda_mes
  );
};
