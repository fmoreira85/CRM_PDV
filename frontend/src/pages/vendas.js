import { renderTable, renderStatus, renderAlert, getStoredUser, hasCategoria, isAdminUser } from "./ui.js";

const seedVendas = [
  {
    id: 2201,
    cliente: "Mariana Costa",
    data: "2026-04-02",
    total: "420.50",
    status: "pago",
    forma: "Cartao",
    vendedor: "Lucas",
  },
  {
    id: 2202,
    cliente: "Mercadinho Central",
    data: "2026-04-02",
    total: "1210.00",
    status: "pendente",
    forma: "Fiado",
    vendedor: "Ana",
  },
  {
    id: 2203,
    cliente: "Carlos Mendes",
    data: "2026-04-01",
    total: "89.90",
    status: "cancelada",
    forma: "Pix",
    vendedor: "Marcos",
  },
];

const statusVenda = (status) => {
  if (status === "pago") return renderStatus("Pago", "success");
  if (status === "pendente") return renderStatus("Pendente", "warning");
  return renderStatus("Cancelada", "neutral");
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
};

const formatMoney = (value) => {
  const number = Number(value || 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
};

const getPermission = () => {
  const user = getStoredUser();
  return {
    canManage: hasCategoria(user, 1),
    canDelete: isAdminUser(user),
  };
};

const state = {
  items: [...seedVendas],
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
  const forma = filters.forma?.value || "";
  const vendedor = filters.vendedor?.value || "";

  return state.items.filter((item) => {
    const matchesSearch =
      !search ||
      item.cliente.toLowerCase().includes(search) ||
      String(item.id).includes(search);
    const matchesStatus = !status || item.status === status;
    const matchesForma = !forma || item.forma === forma;
    const matchesVendedor = !vendedor || item.vendedor === vendedor;

    return matchesSearch && matchesStatus && matchesForma && matchesVendedor;
  });
};

const renderList = (container, items, canDelete, onEdit, onDelete) => {
  if (!container) return;

  container.innerHTML = renderTable(
    ["ID", "Cliente", "Data", "Total", "Status", "Forma", "Vendedor", "Acoes"],
    items.map((venda) => [
      `#${venda.id}`,
      venda.cliente,
      formatDate(venda.data),
      formatMoney(venda.total),
      statusVenda(venda.status),
      venda.forma,
      venda.vendedor,
      `
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${venda.id}">Editar</button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${venda.id}" ${
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
  if (submitButton) submitButton.textContent = "Cadastrar venda";
};

const fillForm = (form, venda, submitButton) => {
  form.cliente.value = venda.cliente;
  form.data.value = venda.data;
  form.total.value = venda.total;
  form.status.value = venda.status;
  form.forma.value = venda.forma;
  form.vendedor.value = venda.vendedor;
  state.editingId = venda.id;
  if (submitButton) submitButton.textContent = "Atualizar venda";
};

const validateForm = ({ cliente, total, status }) => {
  if (!cliente) return "Cliente e obrigatorio";
  if (!status) return "Status e obrigatorio";
  const totalValue = Number(total);
  if (Number.isNaN(totalValue) || totalValue <= 0) return "Valor total invalido";
  return null;
};

export const renderVendas = () => `
  <section class="grid">
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-cash-stack"></i></div>
      <div>
        <p class="metric-label">Vendas do dia</p>
        <p class="metric-value">R$ 4.820</p>
        <p class="metric-note">12 transacoes</p>
      </div>
    </div>
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-bar-chart"></i></div>
      <div>
        <p class="metric-label">Vendas do mes</p>
        <p class="metric-value">R$ 82.450</p>
        <p class="metric-note">Meta 90%</p>
      </div>
    </div>
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-receipt"></i></div>
      <div>
        <p class="metric-label">Ticket medio</p>
        <p class="metric-value">R$ 78</p>
        <p class="metric-note">Ultimos 30 dias</p>
      </div>
    </div>
  </section>

  <section class="grid two">
    <div class="card">
      <div class="page-header mb-3">
        <div>
          <h4>Vendas recentes</h4>
          <p class="page-subtitle">Filtros por data, status e vendedor.</p>
        </div>
        <button class="btn btn-primary" id="vendas-new">
          <i class="bi bi-plus-circle"></i>
          Nova venda
        </button>
      </div>

      <div class="filters mb-3">
        <div class="filter-row">
          <input class="form-control" id="vendas-search" placeholder="Buscar por cliente ou ID" />
          <select class="form-select" id="vendas-status">
            <option value="">Status</option>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <select class="form-select" id="vendas-forma">
            <option value="">Forma de pagamento</option>
            <option value="Pix">Pix</option>
            <option value="Cartao">Cartao</option>
            <option value="Fiado">Fiado</option>
          </select>
          <select class="form-select" id="vendas-vendedor">
            <option value="">Vendedor</option>
            <option value="Lucas">Lucas</option>
            <option value="Ana">Ana</option>
            <option value="Marcos">Marcos</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-outline-secondary" id="vendas-clear">Limpar</button>
          <button class="btn btn-dark" id="vendas-apply">Aplicar filtros</button>
        </div>
      </div>

      <div id="vendas-table"></div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4>Registrar venda</h4>
        <span class="badge text-bg-light">Fluxo rapido</span>
      </div>
      <div id="vendas-feedback" class="mb-3"></div>
      <form id="vendas-form" class="mt-2">
        <div class="form-grid">
          <input class="form-control" name="cliente" placeholder="Cliente" />
          <input class="form-control" name="data" placeholder="Data" />
          <input class="form-control" name="total" placeholder="Valor total" />
          <select class="form-select" name="status">
            <option value="">Status</option>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <select class="form-select" name="forma">
            <option value="">Forma de pagamento</option>
            <option value="Pix">Pix</option>
            <option value="Cartao">Cartao</option>
            <option value="Fiado">Fiado</option>
          </select>
          <input class="form-control" name="vendedor" placeholder="Vendedor" />
        </div>
        <div class="mt-3 d-flex gap-2">
          <button class="btn btn-outline-secondary" type="button" id="vendas-cancel">Cancelar</button>
          <button class="btn btn-primary" type="submit" id="vendas-submit">Cadastrar venda</button>
        </div>
      </form>
      <p class="form-hint mt-3">
        Vendas fiadas devem gerar contas a receber automaticamente.
      </p>
    </div>
  </section>
`;

export const initVendas = () => {
  const tableContainer = document.getElementById("vendas-table");
  const form = document.getElementById("vendas-form");
  const feedback = document.getElementById("vendas-feedback");
  const submitButton = document.getElementById("vendas-submit");
  const cancelButton = document.getElementById("vendas-cancel");
  const newButton = document.getElementById("vendas-new");

  const filters = {
    search: document.getElementById("vendas-search"),
    status: document.getElementById("vendas-status"),
    forma: document.getElementById("vendas-forma"),
    vendedor: document.getElementById("vendas-vendedor"),
  };

  const { canManage, canDelete } = getPermission();

  const refresh = () => {
    const filtered = applyFilters(filters);
    renderList(tableContainer, filtered, canDelete, handleEdit, handleDelete);
  };

  const handleEdit = (id) => {
    if (!canManage) {
      setFeedback(feedback, "danger", "Sem permissao para editar vendas.");
      return;
    }
    const venda = state.items.find((item) => item.id === id);
    if (!venda) return;
    clearFeedback(feedback);
    fillForm(form, venda, submitButton);
  };

  const handleDelete = (id) => {
    if (!canDelete) {
      setFeedback(feedback, "danger", "Somente admin pode excluir vendas.");
      return;
    }
    const shouldDelete = window.confirm("Confirma a exclusao desta venda?");
    if (!shouldDelete) return;
    state.items = state.items.filter((item) => item.id !== id);
    setFeedback(feedback, "success", "Venda removida com sucesso.");
    refresh();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    clearFeedback(feedback);

    if (!canManage) {
      setFeedback(feedback, "danger", "Sem permissao para registrar vendas.");
      return;
    }

    const payload = {
      cliente: form.cliente.value.trim(),
      data: form.data.value.trim(),
      total: form.total.value.trim(),
      status: form.status.value,
      forma: form.forma.value,
      vendedor: form.vendedor.value.trim() || "-",
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
      setFeedback(feedback, "success", "Venda atualizada com sucesso.");
    } else {
      const nextId = state.items.length
        ? Math.max(...state.items.map((item) => item.id)) + 1
        : 1;
      state.items = [...state.items, { id: nextId, ...payload }];
      setFeedback(feedback, "success", "Venda cadastrada com sucesso.");
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
    if (filters.status) filters.status.value = "";
    if (filters.forma) filters.forma.value = "";
    if (filters.vendedor) filters.vendedor.value = "";
    refresh();
  };

  if (form) form.addEventListener("submit", handleSubmit);
  if (cancelButton) cancelButton.addEventListener("click", handleCancel);
  if (newButton) newButton.addEventListener("click", handleCancel);

  const applyButton = document.getElementById("vendas-apply");
  const clearButton = document.getElementById("vendas-clear");

  if (applyButton) applyButton.addEventListener("click", refresh);
  if (clearButton) clearButton.addEventListener("click", handleClearFilters);

  Object.values(filters).forEach((input) => {
    if (input) input.addEventListener("input", refresh);
    if (input) input.addEventListener("change", refresh);
  });

  refresh();
};
