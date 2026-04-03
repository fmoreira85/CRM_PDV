import { renderTable, renderStatus, renderAlert, getStoredUser, isAdminUser } from "./ui.js";

const seedDespesas = [
  {
    id: 401,
    descricao: "Manutencao de freezer",
    categoria: "Manutencao",
    valor: "480.00",
    data: "2026-03-30",
    responsavel: "Admin",
    status: "aprovada",
  },
  {
    id: 402,
    descricao: "Contas de energia",
    categoria: "Energia",
    valor: "1120.00",
    data: "2026-04-01",
    responsavel: "Admin",
    status: "pendente",
  },
  {
    id: 403,
    descricao: "Marketing digital",
    categoria: "Marketing",
    valor: "850.00",
    data: "2026-04-02",
    responsavel: "Admin",
    status: "aprovada",
  },
];

const statusDespesa = (status) => {
  if (status === "aprovada") return renderStatus("Aprovada", "success");
  return renderStatus("Pendente", "warning");
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
    canManage: isAdminUser(user),
  };
};

const state = {
  items: [...seedDespesas],
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
  const categoria = filters.categoria?.value || "";
  const status = filters.status?.value || "";
  const dataInicio = filters.dataInicio?.value;
  const dataFim = filters.dataFim?.value;

  return state.items.filter((item) => {
    const matchesSearch =
      !search || item.descricao.toLowerCase().includes(search);
    const matchesCategoria = !categoria || item.categoria === categoria;
    const matchesStatus = !status || item.status === status;

    let matchesData = true;
    if (dataInicio) {
      matchesData = new Date(item.data) >= new Date(dataInicio);
    }
    if (matchesData && dataFim) {
      matchesData = new Date(item.data) <= new Date(dataFim);
    }

    return matchesSearch && matchesCategoria && matchesStatus && matchesData;
  });
};

const renderList = (container, items, canDelete, onEdit, onDelete) => {
  if (!container) return;

  container.innerHTML = renderTable(
    ["ID", "Descricao", "Categoria", "Valor", "Data", "Responsavel", "Status", "Acoes"],
    items.map((despesa) => [
      `#${despesa.id}`,
      despesa.descricao,
      despesa.categoria,
      formatMoney(despesa.valor),
      formatDate(despesa.data),
      despesa.responsavel,
      statusDespesa(despesa.status),
      `
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${despesa.id}">Editar</button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${despesa.id}" ${
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
  if (submitButton) submitButton.textContent = "Cadastrar despesa";
};

const fillForm = (form, despesa, submitButton) => {
  form.descricao.value = despesa.descricao;
  form.categoria.value = despesa.categoria;
  form.valor.value = despesa.valor;
  form.data.value = despesa.data;
  form.responsavel.value = despesa.responsavel;
  form.status.value = despesa.status;
  state.editingId = despesa.id;
  if (submitButton) submitButton.textContent = "Atualizar despesa";
};

const validateForm = ({ descricao, categoria, valor }) => {
  if (!descricao) return "Descricao e obrigatoria";
  if (!categoria) return "Categoria e obrigatoria";
  const valorNumber = Number(valor);
  if (Number.isNaN(valorNumber) || valorNumber <= 0) return "Valor invalido";
  return null;
};

export const renderDespesas = () => `
  <section class="grid">
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-receipt"></i></div>
      <div>
        <p class="metric-label">Despesas do mes</p>
        <p class="metric-value">R$ 8.420</p>
        <p class="metric-note">Abril 2026</p>
      </div>
    </div>
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-calendar2-week"></i></div>
      <div>
        <p class="metric-label">Despesas do ano</p>
        <p class="metric-value">R$ 42.900</p>
        <p class="metric-note">Acumulado</p>
      </div>
    </div>
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-exclamation-circle"></i></div>
      <div>
        <p class="metric-label">Lancamentos pendentes</p>
        <p class="metric-value">3</p>
        <p class="metric-note">Revisar aprovacao</p>
      </div>
    </div>
  </section>

  <section class="grid two">
    <div class="card">
      <div class="page-header mb-3">
        <div>
          <h4>Controle de despesas</h4>
          <p class="page-subtitle">Filtre por periodo, categoria ou responsavel.</p>
        </div>
        <button class="btn btn-primary" id="despesas-new">
          <i class="bi bi-plus-circle"></i>
          Nova despesa
        </button>
      </div>

      <div class="filters mb-3">
        <div class="filter-row">
          <input class="form-control" id="despesas-search" placeholder="Buscar descricao" />
          <input class="form-control" id="despesas-data-inicio" placeholder="Data inicial" />
          <input class="form-control" id="despesas-data-fim" placeholder="Data final" />
          <select class="form-select" id="despesas-categoria">
            <option value="">Categoria</option>
            <option value="Energia">Energia</option>
            <option value="Marketing">Marketing</option>
            <option value="Manutencao">Manutencao</option>
          </select>
          <select class="form-select" id="despesas-status">
            <option value="">Status</option>
            <option value="aprovada">Aprovada</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-outline-secondary" id="despesas-clear">Limpar</button>
          <button class="btn btn-dark" id="despesas-apply">Aplicar filtros</button>
        </div>
      </div>

      <div id="despesas-table"></div>
    </div>

    <div class="card">
      <h4>Registrar nova despesa</h4>
      <p class="page-subtitle">Somente administradores podem cadastrar.</p>
      <div id="despesas-feedback" class="mb-3"></div>
      <form id="despesas-form">
        <div class="form-grid">
          <input class="form-control" name="descricao" placeholder="Descricao" />
          <input class="form-control" name="categoria" placeholder="Categoria" />
          <input class="form-control" name="valor" placeholder="Valor" />
          <input class="form-control" name="data" placeholder="Data" />
          <input class="form-control" name="responsavel" placeholder="Responsavel" />
          <select class="form-select" name="status">
            <option value="aprovada">Aprovada</option>
            <option value="pendente">Pendente</option>
          </select>
        </div>
        <div class="mt-3 d-flex gap-2">
          <button class="btn btn-outline-secondary" type="button" id="despesas-cancel">Cancelar</button>
          <button class="btn btn-primary" type="submit" id="despesas-submit">Cadastrar despesa</button>
        </div>
      </form>
      <p class="form-hint mt-3">
        Use filtros mensais para apoiar relatorios financeiros futuros.
      </p>
    </div>
  </section>
`;

export const initDespesas = () => {
  const tableContainer = document.getElementById("despesas-table");
  const form = document.getElementById("despesas-form");
  const feedback = document.getElementById("despesas-feedback");
  const submitButton = document.getElementById("despesas-submit");
  const cancelButton = document.getElementById("despesas-cancel");
  const newButton = document.getElementById("despesas-new");

  const filters = {
    search: document.getElementById("despesas-search"),
    dataInicio: document.getElementById("despesas-data-inicio"),
    dataFim: document.getElementById("despesas-data-fim"),
    categoria: document.getElementById("despesas-categoria"),
    status: document.getElementById("despesas-status"),
  };

  const { canManage } = getPermission();

  const refresh = () => {
    const filtered = applyFilters(filters);
    renderList(tableContainer, filtered, canManage, handleEdit, handleDelete);
  };

  const handleEdit = (id) => {
    if (!canManage) {
      setFeedback(feedback, "danger", "Somente admin pode editar despesas.");
      return;
    }
    const despesa = state.items.find((item) => item.id === id);
    if (!despesa) return;
    clearFeedback(feedback);
    fillForm(form, despesa, submitButton);
  };

  const handleDelete = (id) => {
    if (!canManage) {
      setFeedback(feedback, "danger", "Somente admin pode excluir despesas.");
      return;
    }
    const shouldDelete = window.confirm("Confirma a exclusao desta despesa?");
    if (!shouldDelete) return;
    state.items = state.items.filter((item) => item.id !== id);
    setFeedback(feedback, "success", "Despesa removida com sucesso.");
    refresh();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    clearFeedback(feedback);

    if (!canManage) {
      setFeedback(feedback, "danger", "Somente admin pode cadastrar despesas.");
      return;
    }

    const payload = {
      descricao: form.descricao.value.trim(),
      categoria: form.categoria.value.trim(),
      valor: form.valor.value.trim(),
      data: form.data.value.trim(),
      responsavel: form.responsavel.value.trim() || "Admin",
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
      setFeedback(feedback, "success", "Despesa atualizada com sucesso.");
    } else {
      const nextId = state.items.length
        ? Math.max(...state.items.map((item) => item.id)) + 1
        : 1;
      state.items = [...state.items, { id: nextId, ...payload }];
      setFeedback(feedback, "success", "Despesa cadastrada com sucesso.");
    }

    resetForm(form, submitButton);
    refresh();
  };

  const handleCancel = () => {
    resetForm(form, submitButton);
    clearFeedback(feedback);
  };

  const handleClearFilters = () => {
    Object.values(filters).forEach((input) => {
      if (input) input.value = "";
    });
    refresh();
  };

  if (form) form.addEventListener("submit", handleSubmit);
  if (cancelButton) cancelButton.addEventListener("click", handleCancel);
  if (newButton) newButton.addEventListener("click", handleCancel);

  const applyButton = document.getElementById("despesas-apply");
  const clearButton = document.getElementById("despesas-clear");

  if (applyButton) applyButton.addEventListener("click", refresh);
  if (clearButton) clearButton.addEventListener("click", handleClearFilters);

  Object.values(filters).forEach((input) => {
    if (input) input.addEventListener("input", refresh);
    if (input) input.addEventListener("change", refresh);
  });

  refresh();
};
