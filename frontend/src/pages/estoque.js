import { renderTable, renderStatus, renderAlert, getStoredUser, hasCategoria } from "./ui.js";

const seedLotes = [
  {
    id: 201,
    produto: "Cerveja Pilsen 350ml",
    lote: "L-2026-001",
    validade: "2026-04-30",
    quantidade: 56,
    nivel_ideal: 120,
  },
  {
    id: 202,
    produto: "Chocolate Barra 90g",
    lote: "L-2026-014",
    validade: "2026-05-12",
    quantidade: 18,
    nivel_ideal: 60,
  },
  {
    id: 203,
    produto: "Detergente Neutro 500ml",
    lote: "L-2026-002",
    validade: "2026-08-10",
    quantidade: 210,
    nivel_ideal: 140,
  },
];

const getPermission = () => {
  const user = getStoredUser();
  return {
    canManage: hasCategoria(user, 2),
  };
};

const state = {
  items: [...seedLotes],
  editingId: null,
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
};

const getStatus = (item) => {
  const quantidade = Number(item.quantidade || 0);
  const ideal = Number(item.nivel_ideal || 0);
  const validade = item.validade ? new Date(item.validade) : null;
  const hoje = new Date();
  let alertaValidade = false;

  if (validade && !Number.isNaN(validade.getTime())) {
    const diff = (validade - hoje) / (1000 * 60 * 60 * 24);
    alertaValidade = diff <= 15;
  }

  if (quantidade <= ideal) {
    return renderStatus("Baixo", "danger");
  }

  if (alertaValidade) {
    return renderStatus("Validade", "warning");
  }

  return renderStatus("Ok", "success");
};

const setFeedback = (container, type, message) => {
  if (!container) return;
  container.innerHTML = renderAlert(type, message);
};

const clearFeedback = (container) => {
  if (!container) return;
  container.innerHTML = "";
};

const applyFilters = (filters) => {
  const search = (filters.search?.value || "").toLowerCase();
  const status = filters.status?.value || "";
  const validadeAte = filters.validade?.value;

  return state.items.filter((item) => {
    const matchesSearch =
      !search ||
      item.produto.toLowerCase().includes(search) ||
      item.lote.toLowerCase().includes(search);

    let matchesStatus = true;
    if (status) {
      if (status === "baixo") {
        matchesStatus = Number(item.quantidade) <= Number(item.nivel_ideal);
      } else if (status === "validade") {
        if (!item.validade) {
          matchesStatus = false;
        } else {
          const validade = new Date(item.validade);
          const diff = (validade - new Date()) / (1000 * 60 * 60 * 24);
          matchesStatus = diff <= 15;
        }
      } else if (status === "ok") {
        matchesStatus =
          Number(item.quantidade) > Number(item.nivel_ideal) && (!item.validade || (new Date(item.validade) - new Date()) / (1000 * 60 * 60 * 24) > 15);
      }
    }

    let matchesValidade = true;
    if (validadeAte) {
      const limite = new Date(validadeAte);
      const validade = item.validade ? new Date(item.validade) : null;
      matchesValidade = validade ? validade <= limite : false;
    }

    return matchesSearch && matchesStatus && matchesValidade;
  });
};

const renderList = (container, items, canDelete, onEdit, onDelete) => {
  if (!container) return;

  container.innerHTML = renderTable(
    ["Produto", "Lote", "Validade", "Qtd", "Ideal", "Status", "Acoes"],
    items.map((lote) => [
      lote.produto,
      lote.lote,
      formatDate(lote.validade),
      lote.quantidade,
      lote.nivel_ideal,
      getStatus(lote),
      `
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${lote.id}">Editar</button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${lote.id}" ${
            canDelete ? "" : "disabled"
          }>Excluir</button>
        </div>
      `,
    ])
  );

  container.querySelectorAll("button[data-action='edit']").forEach((button) => {
    button.addEventListener("click", () => onEdit(Number(button.dataset.id)));
  });

  container.querySelectorAll("button[data-action='delete']").forEach((button) => {
    button.addEventListener("click", () => onDelete(Number(button.dataset.id)));
  });
};

const resetForm = (form, submitButton) => {
  form.reset();
  state.editingId = null;
  if (submitButton) submitButton.textContent = "Cadastrar lote";
};

const fillForm = (form, lote, submitButton) => {
  form.produto.value = lote.produto;
  form.lote.value = lote.lote;
  form.validade.value = lote.validade;
  form.quantidade.value = lote.quantidade;
  form.nivel_ideal.value = lote.nivel_ideal;
  state.editingId = lote.id;
  if (submitButton) submitButton.textContent = "Atualizar lote";
};

const validateForm = ({ produto, lote, quantidade, nivel_ideal }) => {
  if (!produto) return "Produto e obrigatorio";
  if (!lote) return "Lote e obrigatorio";
  const qtd = Number(quantidade);
  if (Number.isNaN(qtd) || qtd <= 0) return "Quantidade invalida";
  if (nivel_ideal !== undefined && nivel_ideal !== "") {
    const ideal = Number(nivel_ideal);
    if (Number.isNaN(ideal) || ideal < 0) return "Nivel ideal invalido";
  }
  return null;
};

export const renderEstoque = () => `
  <section class="grid">
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-archive"></i></div>
      <div>
        <p class="metric-label">Itens abaixo do ideal</p>
        <p class="metric-value">23</p>
        <p class="metric-note">Rever reposicao</p>
      </div>
    </div>
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-clock-history"></i></div>
      <div>
        <p class="metric-label">Lotes a vencer</p>
        <p class="metric-value">7</p>
        <p class="metric-note">Proximos 15 dias</p>
      </div>
    </div>
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-box2-heart"></i></div>
      <div>
        <p class="metric-label">Unidades em estoque</p>
        <p class="metric-value">8.420</p>
        <p class="metric-note">Saldo atual</p>
      </div>
    </div>
  </section>

  <section class="grid two">
    <div class="card">
      <div class="page-header mb-3">
        <div>
          <h4>Controle de lotes</h4>
          <p class="page-subtitle">Visualize validade, quantidade e nivel ideal.</p>
        </div>
        <button class="btn btn-primary" id="estoque-new">
          <i class="bi bi-plus-circle"></i>
          Novo lote
        </button>
      </div>

      <div class="filters mb-3">
        <div class="filter-row">
          <input class="form-control" id="estoque-search" placeholder="Buscar produto ou lote" />
          <input class="form-control" id="estoque-validade" placeholder="Validade ate" />
          <select class="form-select" id="estoque-status">
            <option value="">Status</option>
            <option value="ok">Ok</option>
            <option value="baixo">Baixo</option>
            <option value="validade">Validade</option>
          </select>
          <select class="form-select">
            <option>Ordenar por</option>
            <option>Mais recentes</option>
            <option>Validade</option>
            <option>Quantidade</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-outline-secondary" id="estoque-clear">Limpar</button>
          <button class="btn btn-dark" id="estoque-apply">Aplicar filtros</button>
        </div>
      </div>

      <div id="estoque-table"></div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4>Alertas de estoque</h4>
        <span class="badge text-bg-light">Resumo visual</span>
      </div>
      <div class="chart-placeholder">
        <div class="chart-bar"></div>
        <div class="chart-bar"></div>
        <div class="chart-bar"></div>
        <div class="chart-bar"></div>
        <div class="chart-bar"></div>
      </div>
      <p class="card-footnote">
        Use as movimentacoes para registrar entradas e saidas de cada lote.
      </p>
      <div class="mt-4">
        <h5>Movimentacao rapida</h5>
        <div id="estoque-feedback" class="mb-3"></div>
        <form id="estoque-form" class="mt-3">
          <div class="form-grid">
            <input class="form-control" name="produto" placeholder="Produto" />
            <input class="form-control" name="lote" placeholder="Lote" />
            <input class="form-control" name="validade" placeholder="Validade" />
            <input class="form-control" name="quantidade" placeholder="Quantidade" />
            <input class="form-control" name="nivel_ideal" placeholder="Nivel ideal" />
          </div>
          <div class="mt-3 d-flex gap-2">
            <button class="btn btn-outline-secondary" type="button" id="estoque-cancel">Cancelar</button>
            <button class="btn btn-outline-primary" type="submit" id="estoque-submit">Cadastrar lote</button>
          </div>
        </form>
      </div>
    </div>
  </section>
`;

export const initEstoque = () => {
  const tableContainer = document.getElementById("estoque-table");
  const form = document.getElementById("estoque-form");
  const feedback = document.getElementById("estoque-feedback");
  const submitButton = document.getElementById("estoque-submit");
  const cancelButton = document.getElementById("estoque-cancel");
  const newButton = document.getElementById("estoque-new");

  const filters = {
    search: document.getElementById("estoque-search"),
    validade: document.getElementById("estoque-validade"),
    status: document.getElementById("estoque-status"),
  };

  const { canManage } = getPermission();

  const refresh = () => {
    const filtered = applyFilters(filters);
    renderList(tableContainer, filtered, canManage, handleEdit, handleDelete);
  };

  const handleEdit = (id) => {
    const lote = state.items.find((item) => item.id === id);
    if (!lote) return;
    clearFeedback(feedback);
    fillForm(form, lote, submitButton);
  };

  const handleDelete = (id) => {
    if (!canManage) {
      setFeedback(feedback, "danger", "Sem permissao para excluir lotes.");
      return;
    }
    const shouldDelete = window.confirm("Confirma a exclusao deste lote?");
    if (!shouldDelete) return;
    state.items = state.items.filter((item) => item.id !== id);
    setFeedback(feedback, "success", "Lote removido com sucesso.");
    refresh();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    clearFeedback(feedback);

    const payload = {
      produto: form.produto.value.trim(),
      lote: form.lote.value.trim(),
      validade: form.validade.value.trim(),
      quantidade: form.quantidade.value.trim(),
      nivel_ideal: form.nivel_ideal.value.trim() || 0,
    };

    const validationError = validateForm(payload);
    if (validationError) {
      setFeedback(feedback, "danger", validationError);
      return;
    }

    if (state.editingId) {
      state.items = state.items.map((item) =>
        item.id === state.editingId
          ? { ...item, ...payload, quantidade: Number(payload.quantidade) }
          : item
      );
      setFeedback(feedback, "success", "Lote atualizado com sucesso.");
    } else {
      const nextId = state.items.length
        ? Math.max(...state.items.map((item) => item.id)) + 1
        : 1;
      state.items = [
        ...state.items,
        { id: nextId, ...payload, quantidade: Number(payload.quantidade) },
      ];
      setFeedback(feedback, "success", "Lote cadastrado com sucesso.");
    }

    resetForm(form, submitButton);
    refresh();
  };

  const handleCancel = () => {
    resetForm(form, submitButton);
    clearFeedback(feedback);
  };

  const handleClearFilters = () => {
    if (filters.search) filters.search.value = "";
    if (filters.validade) filters.validade.value = "";
    if (filters.status) filters.status.value = "";
    refresh();
  };

  if (form) form.addEventListener("submit", handleSubmit);
  if (cancelButton) cancelButton.addEventListener("click", handleCancel);
  if (newButton) newButton.addEventListener("click", handleCancel);

  const applyButton = document.getElementById("estoque-apply");
  const clearButton = document.getElementById("estoque-clear");

  if (applyButton) applyButton.addEventListener("click", refresh);
  if (clearButton) clearButton.addEventListener("click", handleClearFilters);

  Object.values(filters).forEach((input) => {
    if (input) input.addEventListener("input", refresh);
    if (input) input.addEventListener("change", refresh);
  });

  refresh();
};
