import { renderTable, renderStatus, renderAlert, getStoredUser, hasCategoria } from "./ui.js";

const seedClientes = [
  {
    id: 101,
    nome: "Mariana Costa",
    tipo: "fisica",
    documento: "123.456.789-10",
    telefone: "(65) 99912-4433",
    email: "mariana@email.com",
    status: "ok",
    vencimento: "15/04/2026",
  },
  {
    id: 102,
    nome: "Mercadinho Central",
    tipo: "juridica",
    documento: "12.345.678/0001-90",
    telefone: "(65) 99200-1122",
    email: "financeiro@mercadinho.com",
    status: "pendente",
    vencimento: "08/04/2026",
  },
  {
    id: 103,
    nome: "Carlos Mendes",
    tipo: "fisica",
    documento: "987.654.321-00",
    telefone: "(65) 99880-2211",
    email: "carlos@email.com",
    status: "inadimplente",
    vencimento: "25/03/2026",
  },
];

const statusLabel = (status) => {
  if (status === "ok") return renderStatus("Em dia", "success");
  if (status === "pendente") return renderStatus("Pendente", "warning");
  return renderStatus("Inadimplente", "danger");
};

const getPermission = () => {
  const user = getStoredUser();
  return {
    canManage: hasCategoria(user, 2),
  };
};

const state = {
  items: [...seedClientes],
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
  const tipo = filters.tipo?.value || "";
  const documento = (filters.documento?.value || "").toLowerCase();

  return state.items.filter((item) => {
    const matchesSearch =
      !search ||
      item.nome.toLowerCase().includes(search) ||
      item.documento.toLowerCase().includes(search) ||
      item.telefone.toLowerCase().includes(search) ||
      item.email.toLowerCase().includes(search);
    const matchesStatus = !status || item.status === status;
    const matchesTipo = !tipo || item.tipo === tipo;
    const matchesDocumento = !documento || item.documento.toLowerCase().includes(documento);

    return matchesSearch && matchesStatus && matchesTipo && matchesDocumento;
  });
};

const renderList = (container, items, canDelete, onEdit, onDelete) => {
  if (!container) return;

  container.innerHTML = renderTable(
    ["ID", "Cliente", "Documento", "Telefone", "Status", "Vencimento", "Acoes"],
    items.map((cliente) => [
      `#${cliente.id}`,
      cliente.nome,
      cliente.documento,
      cliente.telefone,
      statusLabel(cliente.status),
      cliente.vencimento,
      `
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${cliente.id}">
            Editar
          </button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${cliente.id}" ${
            canDelete ? "" : "disabled"
          }>
            Excluir
          </button>
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
  if (submitButton) {
    submitButton.textContent = "Cadastrar cliente";
  }
};

const fillForm = (form, cliente, submitButton) => {
  form.nome.value = cliente.nome;
  form.tipo.value = cliente.tipo;
  form.documento.value = cliente.documento;
  form.telefone.value = cliente.telefone;
  form.email.value = cliente.email;
  form.status.value = cliente.status;
  form.vencimento.value = cliente.vencimento;
  state.editingId = cliente.id;
  if (submitButton) {
    submitButton.textContent = "Atualizar cliente";
  }
};

const validateForm = ({ nome, tipo, documento, email }) => {
  if (!nome) return "Nome e obrigatorio";
  if (!tipo) return "Tipo de pessoa e obrigatorio";
  if (!documento) return "CPF ou CNPJ e obrigatorio";
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return "Email invalido";
  }
  return null;
};

export const renderClientes = () => `
  <section class="grid">
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-people"></i></div>
      <div>
        <p class="metric-label">Clientes ativos</p>
        <p class="metric-value">428</p>
        <p class="metric-note">Base atual</p>
      </div>
    </div>
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-exclamation-circle"></i></div>
      <div>
        <p class="metric-label">Inadimplentes</p>
        <p class="metric-value">12</p>
        <p class="metric-note">Ultimos 30 dias</p>
      </div>
    </div>
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-calendar2-week"></i></div>
      <div>
        <p class="metric-label">Vencimentos proximos</p>
        <p class="metric-value">9</p>
        <p class="metric-note">Proximos 7 dias</p>
      </div>
    </div>
  </section>

  <section class="grid two">
    <div class="card">
      <div class="page-header mb-3">
        <div>
          <h4>Clientes cadastrados</h4>
          <p class="page-subtitle">Busque por nome, documento ou status.</p>
        </div>
        <button class="btn btn-primary" id="clientes-new">
          <i class="bi bi-person-plus"></i>
          Novo cliente
        </button>
      </div>

      <div class="filters mb-3">
        <div class="filter-row">
          <input class="form-control" id="clientes-search" placeholder="Buscar por nome ou ID" />
          <input class="form-control" id="clientes-documento" placeholder="CPF ou CNPJ" />
          <select class="form-select" id="clientes-status-filter">
            <option value="">Status</option>
            <option value="ok">Em dia</option>
            <option value="pendente">Pendente</option>
            <option value="inadimplente">Inadimplente</option>
          </select>
          <select class="form-select" id="clientes-tipo-filter">
            <option value="">Tipo</option>
            <option value="fisica">Fisica</option>
            <option value="juridica">Juridica</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-outline-secondary" id="clientes-clear">Limpar</button>
          <button class="btn btn-dark" id="clientes-apply">Aplicar filtros</button>
        </div>
      </div>

      <div id="clientes-table"></div>
    </div>

    <div class="card">
      <h4>Cadastro rapido</h4>
      <p class="page-subtitle">Inclua cliente pessoa fisica ou juridica.</p>
      <div id="clientes-feedback" class="mb-3"></div>
      <form id="clientes-form">
        <div class="form-grid">
          <input class="form-control" name="nome" placeholder="Nome completo" />
          <select class="form-select" name="tipo">
            <option value="">Tipo de pessoa</option>
            <option value="fisica">Fisica</option>
            <option value="juridica">Juridica</option>
          </select>
          <input class="form-control" name="documento" placeholder="CPF ou CNPJ" />
          <input class="form-control" name="telefone" placeholder="Telefone" />
          <input class="form-control" name="email" placeholder="Email" />
          <select class="form-select" name="status">
            <option value="ok">Em dia</option>
            <option value="pendente">Pendente</option>
            <option value="inadimplente">Inadimplente</option>
          </select>
          <input class="form-control" name="vencimento" placeholder="Data de vencimento" />
        </div>
        <div class="mt-3 d-flex gap-2">
          <button class="btn btn-outline-secondary" type="button" id="clientes-cancel">Cancelar</button>
          <button class="btn btn-primary" type="submit" id="clientes-submit">
            Cadastrar cliente
          </button>
        </div>
      </form>
      <p class="form-hint mt-3">
        Campos adicionais e status financeiro podem ser ajustados no detalhe do cliente.
      </p>
    </div>
  </section>
`;

export const initClientes = () => {
  const tableContainer = document.getElementById("clientes-table");
  const form = document.getElementById("clientes-form");
  const feedback = document.getElementById("clientes-feedback");
  const submitButton = document.getElementById("clientes-submit");
  const cancelButton = document.getElementById("clientes-cancel");
  const newButton = document.getElementById("clientes-new");

  const filters = {
    search: document.getElementById("clientes-search"),
    documento: document.getElementById("clientes-documento"),
    status: document.getElementById("clientes-status-filter"),
    tipo: document.getElementById("clientes-tipo-filter"),
  };

  const { canManage } = getPermission();

  const refresh = () => {
    const filtered = applyFilters(filters);
    renderList(tableContainer, filtered, canManage, handleEdit, handleDelete);
  };

  const handleEdit = (id) => {
    const cliente = state.items.find((item) => item.id === id);
    if (!cliente) return;
    clearFeedback(feedback);
    fillForm(form, cliente, submitButton);
  };

  const handleDelete = (id) => {
    if (!canManage) {
      setFeedback(feedback, "danger", "Sem permissao para excluir clientes.");
      return;
    }
    const shouldDelete = window.confirm("Confirma a exclusao deste cliente?");
    if (!shouldDelete) return;
    state.items = state.items.filter((item) => item.id !== id);
    setFeedback(feedback, "success", "Cliente removido com sucesso.");
    refresh();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    clearFeedback(feedback);

    const payload = {
      nome: form.nome.value.trim(),
      tipo: form.tipo.value,
      documento: form.documento.value.trim(),
      telefone: form.telefone.value.trim(),
      email: form.email.value.trim(),
      status: form.status.value,
      vencimento: form.vencimento.value.trim(),
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
      setFeedback(feedback, "success", "Cliente atualizado com sucesso.");
    } else {
      const nextId = state.items.length
        ? Math.max(...state.items.map((item) => item.id)) + 1
        : 1;
      state.items = [...state.items, { id: nextId, ...payload }];
      setFeedback(feedback, "success", "Cliente cadastrado com sucesso.");
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
    if (filters.documento) filters.documento.value = "";
    if (filters.status) filters.status.value = "";
    if (filters.tipo) filters.tipo.value = "";
    refresh();
  };

  if (form) form.addEventListener("submit", handleSubmit);
  if (cancelButton) cancelButton.addEventListener("click", handleCancel);
  if (newButton) newButton.addEventListener("click", handleCancel);

  const applyButton = document.getElementById("clientes-apply");
  const clearButton = document.getElementById("clientes-clear");

  if (applyButton) applyButton.addEventListener("click", refresh);
  if (clearButton) clearButton.addEventListener("click", handleClearFilters);

  Object.values(filters).forEach((input) => {
    if (input) input.addEventListener("input", refresh);
    if (input) input.addEventListener("change", refresh);
  });

  refresh();
};
