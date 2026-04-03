import { renderTable, renderStatus } from "./ui.js";

const movimentos = [
  {
    id: 9001,
    data: "02/04/2026 10:20",
    tipo: "entrada",
    origem: "Venda #2201",
    valor: "R$ 420,50",
    referencia: "Cartao",
  },
  {
    id: 9002,
    data: "02/04/2026 11:10",
    tipo: "saida",
    origem: "Despesa - Energia",
    valor: "R$ 120,00",
    referencia: "Pix",
  },
  {
    id: 9003,
    data: "02/04/2026 13:45",
    tipo: "entrada",
    origem: "Venda #2202",
    valor: "R$ 1.210,00",
    referencia: "Fiado",
  },
];

const tipoMovimento = (tipo) => {
  if (tipo === "entrada") return renderStatus("Entrada", "success");
  return renderStatus("Saida", "danger");
};

export const renderCaixa = () => `
  <section class="grid">
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-cash-stack"></i></div>
      <div>
        <p class="metric-label">Entradas hoje</p>
        <p class="metric-value">R$ 5.120</p>
        <p class="metric-note">Total do dia</p>
      </div>
    </div>
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-cash"></i></div>
      <div>
        <p class="metric-label">Saidas hoje</p>
        <p class="metric-value">R$ 820</p>
        <p class="metric-note">Despesas registradas</p>
      </div>
    </div>
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-bank"></i></div>
      <div>
        <p class="metric-label">Saldo do dia</p>
        <p class="metric-value">R$ 4.300</p>
        <p class="metric-note">Atualizado agora</p>
      </div>
    </div>
  </section>

  <section class="grid two">
    <div class="card">
      <div class="page-header mb-3">
        <div>
          <h4>Lancamentos de caixa</h4>
          <p class="page-subtitle">Registre entradas e saidas.</p>
        </div>
        <button class="btn btn-primary">
          <i class="bi bi-plus-circle"></i>
          Novo lancamento
        </button>
      </div>

      <div class="filters mb-3">
        <div class="filter-row">
          <input class="form-control" placeholder="Periodo inicial" />
          <input class="form-control" placeholder="Periodo final" />
          <select class="form-select">
            <option>Tipo</option>
            <option>Entrada</option>
            <option>Saida</option>
          </select>
          <input class="form-control" placeholder="Origem" />
        </div>
        <div class="filter-actions">
          <button class="btn btn-outline-secondary">Limpar</button>
          <button class="btn btn-dark">Aplicar filtros</button>
        </div>
      </div>

      ${renderTable(
        ["ID", "Data", "Tipo", "Origem", "Valor", "Referencia"],
        movimentos.map((movimento) => [
          `#${movimento.id}`,
          movimento.data,
          tipoMovimento(movimento.tipo),
          movimento.origem,
          movimento.valor,
          movimento.referencia,
        ])
      )}
    </div>

    <div class="card">
      <div class="card-header">
        <h4>Comparativo caixa x vendas</h4>
        <span class="badge text-bg-light">Ultimos 30 dias</span>
      </div>
      <div class="chart-placeholder">
        <div class="chart-bar"></div>
        <div class="chart-bar"></div>
        <div class="chart-bar"></div>
        <div class="chart-bar"></div>
        <div class="chart-bar"></div>
      </div>
      <div class="compare-grid mt-4">
        <div>
          <span>Entradas de vendas</span>
          <strong>R$ 82.450</strong>
        </div>
        <div>
          <span>Caixa total</span>
          <strong>R$ 86.210</strong>
        </div>
        <div>
          <span>Divergencia</span>
          <strong>R$ 3.760</strong>
        </div>
      </div>
    </div>
  </section>
`;
