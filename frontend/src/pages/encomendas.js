import { renderTable, renderStatus, renderAlert, getStoredUser, hasCategoria } from "./ui.js";

const seedEncomendas = [
  {
    id: 501,
    fornecedor: "Distribuidora Alpha",
    produto: "Cerveja Pilsen 350ml",
    quantidade: 240,
    prazo: "2026-04-09",
    status: "aberta",
  },
  {
    id: 502,
    fornecedor: "Industrias Norte",
    produto: "Detergente Neutro 500ml",
    quantidade: 120,
    prazo: "2026-04-15",
    status: "confirmada",
  },
  {
    id: 503,
    fornecedor: "Fornecedor Oeste",
    produto: "Chocolate Barra 90g",
    quantidade: 300,
    prazo: "2026-03-28",
    status: "atrasada",
  },
];

const statusEncomenda = (status) => {
  if (status === "aberta") return renderStatus("Aberta", "info");
  if (status === "confirmada") return renderStatus("Confirmada", "success");
  if (status === "recebida") return renderStatus("Recebida", "success");
  return renderStatus("Atrasada", "danger");
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
};

const getPermission = () => {
  const user = getStoredUser();
  return {
    canManage: hasCategoria(user, 3),
  };
};

const state = {
  items: [...seedEncomendas],
  editingId: null,
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
  const prazoAte = filters.prazo?.value;

  return state.items.filter((item) => {
    const matchesSearch =
      !search ||
      item.fornecedor.toLowerCase().includes(search) ||
      item.produto.toLowerCase().includes(search);
    const matchesStatus = !status || item.status === status;

    let matchesPrazo = true;
    if (prazoAte) {
      const limite = new Date(prazoAte);
      const prazo = item.prazo ? new Date(item.prazo) : null;
      matchesPrazo = prazo ? prazo <= limite : false;
    }

    return matchesSearch && matchesStatus && matchesPrazo;
  });
};

const renderList = (container, items, canDelete, onEdit, onDelete) => {
  if (!container) return;

  container.innerHTML = renderTable(
    ["ID", "Fornecedor", "Produto", "Qtd", "Prazo", "Status", "Acoes"],
    items.map((encomenda) => [
      `#${encomenda.id}`,
      encomenda.fornecedor,
      encomenda.produto,
      encomenda.quantidade,
      formatDate(encomenda.prazo),
      statusEncomenda(encomenda.status),
      `
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${encomenda.id}">Editar</button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${encomenda.id}" ${
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
  if (submitButton) submitButton.textContent = "Cadastrar encomenda";
};

const fillForm = (form, encomenda, submitButton) => {
  form.fornecedor.value = encomenda.fornecedor;
  form.produto.value = encomenda.produto;
  form.quantidade.value = encomenda.quantidade;
  form.prazo.value = encomenda.prazo;
  form.status.value = encomenda.status;
  form.data_pedido.value = encomenda.data_pedido || "";
  state.editingId = encomenda.id;
  if (submitButton) submitButton.textContent = "Atualizar encomenda";
};

const validateForm = ({ fornecedor, produto, quantidade }) => {
  if (!fornecedor) return "Fornecedor e obrigatorio";
  if (!produto) return "Produto e obrigatorio";
  const qtd = Number(quantidade);
  if (Number.isNaN(qtd) || qtd <= 0) return "Quantidade invalida";
  return null;
};

export const renderEncomendas = () => `
  <section class="grid">
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-clipboard-check"></i></div>
      <div>
        <p class="metric-label">Encomendas abertas</p>
        <p class="metric-value">9</p>
        <p class="metric-note">Em andamento</p>
      </div>
    </div>
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-clock"></i></div>
      <div>
        <p class="metric-label">Proximas do prazo</p>
        <p class="metric-value">4</p>
        <p class="metric-note">Proximos 7 dias</p>
      </div>
    </div>
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-check-circle"></i></div>
      <div>
        <p class="metric-label">Recebidas no mes</p>
        <p class="metric-value">18</p>
        <p class="metric-note">Atualizado hoje</p>
      </div>
    </div>
  </section>

  <section class="grid two">
    <div class="card">
      <div class="page-header mb-3">
        <div>
          <h4>Controle de encomendas</h4>
          <p class="page-subtitle">Busque por fornecedor, produto ou prazo.</p>
        </div>
        <button class="btn btn-primary" id="encomendas-new">
          <i class="bi bi-plus-circle"></i>
          Nova encomenda
        </button>
      </div>

      <div class="filters mb-3">
        <div class="filter-row">
          <input class="form-control" id="encomendas-search" placeholder="Fornecedor ou produto" />
          <input class="form-control" id="encomendas-prazo" placeholder="Prazo ate" />
          <select class="form-select" id="encomendas-status">
            <option value="">Status</option>
            <option value="aberta">Aberta</option>
            <option value="confirmada">Confirmada</option>
            <option value="recebida">Recebida</option>
            <option value="atrasada">Atrasada</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-outline-secondary" id="encomendas-clear">Limpar</button>
          <button class="btn btn-dark" id="encomendas-apply">Aplicar filtros</button>
        </div>
      </div>

      <div id="encomendas-table"></div>
    </div>

    <div class="card">
      <h4>Registrar encomenda</h4>
      <p class="page-subtitle">Relacione fornecedor, produto e prazo.</p>
      <div id="encomendas-feedback" class="mb-3"></div>
      <form id="encomendas-form">
        <div class="form-grid">
          <input class="form-control" name="fornecedor" placeholder="Fornecedor" />
          <input class="form-control" name="produto" placeholder="Produto" />
          <input class="form-control" name="quantidade" placeholder="Quantidade" />
          <input class="form-control" name="data_pedido" placeholder="Data do pedido" />
          <input class="form-control" name="prazo" placeholder="Prazo" />
          <select class="form-select" name="status">
            <option value="aberta">Aberta</option>
            <option value="confirmada">Confirmada</option>
            <option value="recebida">Recebida</option>
            <option value="atrasada">Atrasada</option>
          </select>
        </div>
        <div class="mt-3 d-flex gap-2">
          <button class="btn btn-outline-secondary" type="button" id="encomendas-cancel">Cancelar</button>
          <button class="btn btn-primary" type="submit" id="encomendas-submit">Cadastrar encomenda</button>
        </div>
      </form>
      <p class="form-hint mt-3">
        Encomendas proximas do prazo devem aparecer automaticamente no dashboard.
      </p>
    </div>
  </section>
`;

export const initEncomendas = () => {
  const tableContainer = document.getElementById("encomendas-table");
  const form = document.getElementById("encomendas-form");
  const feedback = document.getElementById("encomendas-feedback");
  const submitButton = document.getElementById("encomendas-submit");
  const cancelButton = document.getElementById("encomendas-cancel");
  const newButton = document.getElementById("encomendas-new");

  const filters = {
    search: document.getElementById("encomendas-search"),
    prazo: document.getElementById("encomendas-prazo"),
    status: document.getElementById("encomendas-status"),
  };

  const { canManage } = getPermission();

  const refresh = () => {
    const filtered = applyFilters(filters);
    renderList(tableContainer, filtered, canManage, handleEdit, handleDelete);
  };

  const handleEdit = (id) => {
    if (!canManage) {
      setFeedback(feedback, "danger", "Sem permissao para editar encomendas.");
      return;
    }
    const encomenda = state.items.find((item) => item.id === id);
    if (!encomenda) return;
    clearFeedback(feedback);
    fillForm(form, encomenda, submitButton);
  };

  const handleDelete = (id) => {
    if (!canManage) {
      setFeedback(feedback, "danger", "Sem permissao para excluir encomendas.");
      return;
    }
    const shouldDelete = window.confirm("Confirma a exclusao desta encomenda?");
    if (!shouldDelete) return;
    state.items = state.items.filter((item) => item.id !== id);
    setFeedback(feedback, "success", "Encomenda removida com sucesso.");
    refresh();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    clearFeedback(feedback);

    if (!canManage) {
      setFeedback(feedback, "danger", "Sem permissao para cadastrar encomendas.");
      return;
    }

    const payload = {
      fornecedor: form.fornecedor.value.trim(),
      produto: form.produto.value.trim(),
      quantidade: form.quantidade.value.trim(),
      data_pedido: form.data_pedido.value.trim(),
      prazo: form.prazo.value.trim(),
      status: form.status.value,
    };

    const validationError = validateForm(payload);
    if (validationError) {
      setFeedback(feedback, "danger", validationError);
      return;
    }

    if (state.editingId) {
      state.items = state.items.map((item) =>
        item.id === state.editingId ? { ...item, ...payload } : item
      );
      setFeedback(feedback, "success", "Encomenda atualizada com sucesso.");
    } else {
      const nextId = state.items.length
        ? Math.max(...state.items.map((item) => item.id)) + 1
        : 1;
      state.items = [...state.items, { id: nextId, ...payload }];
      setFeedback(feedback, "success", "Encomenda cadastrada com sucesso.");
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
    if (filters.prazo) filters.prazo.value = "";
    if (filters.status) filters.status.value = "";
    refresh();
  };

  if (form) form.addEventListener("submit", handleSubmit);
  if (cancelButton) cancelButton.addEventListener("click", handleCancel);
  if (newButton) newButton.addEventListener("click", handleCancel);

  const applyButton = document.getElementById("encomendas-apply");
  const clearButton = document.getElementById("encomendas-clear");

  if (applyButton) applyButton.addEventListener("click", refresh);
  if (clearButton) clearButton.addEventListener("click", handleClearFilters);

  Object.values(filters).forEach((input) => {
    if (input) input.addEventListener("input", refresh);
    if (input) input.addEventListener("change", refresh);
  });

  refresh();
};
