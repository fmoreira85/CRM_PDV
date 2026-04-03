import { renderTable, renderStatus, renderAlert, getStoredUser, hasCategoria } from "./ui.js";

const seedFornecedores = [
  {
    id: 71,
    nome: "Distribuidora Alpha",
    cnpj: "45.123.456/0001-10",
    telefone: "(65) 3333-1122",
    email: "contato@alpha.com",
    status: "ativo",
  },
  {
    id: 72,
    nome: "Industrias Norte",
    cnpj: "12.998.332/0001-55",
    telefone: "(65) 3333-8899",
    email: "suporte@norte.com",
    status: "ativo",
  },
  {
    id: 73,
    nome: "Fornecedor Oeste",
    cnpj: "77.221.445/0001-33",
    telefone: "(65) 3333-9911",
    email: "comercial@oeste.com",
    status: "inativo",
  },
];

const statusFornecedor = (status) => {
  if (status === "ativo") return renderStatus("Ativo", "success");
  return renderStatus("Inativo", "neutral");
};

const getPermission = () => {
  const user = getStoredUser();
  return {
    canManage: hasCategoria(user, 3),
  };
};

const state = {
  items: [...seedFornecedores],
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

  return state.items.filter((item) => {
    const matchesSearch =
      !search ||
      item.nome.toLowerCase().includes(search) ||
      item.cnpj.toLowerCase().includes(search) ||
      item.telefone.toLowerCase().includes(search) ||
      item.email.toLowerCase().includes(search);
    const matchesStatus = !status || item.status === status;

    return matchesSearch && matchesStatus;
  });
};

const renderList = (container, items, canDelete, onEdit, onDelete) => {
  if (!container) return;

  container.innerHTML = renderTable(
    ["ID", "Fornecedor", "CNPJ", "Telefone", "Email", "Status", "Acoes"],
    items.map((fornecedor) => [
      `#${fornecedor.id}`,
      fornecedor.nome,
      fornecedor.cnpj,
      fornecedor.telefone,
      fornecedor.email,
      statusFornecedor(fornecedor.status),
      `
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${fornecedor.id}">Editar</button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${fornecedor.id}" ${
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
  if (submitButton) submitButton.textContent = "Cadastrar fornecedor";
};

const fillForm = (form, fornecedor, submitButton) => {
  form.nome.value = fornecedor.nome;
  form.cnpj.value = fornecedor.cnpj;
  form.telefone.value = fornecedor.telefone;
  form.email.value = fornecedor.email;
  form.status.value = fornecedor.status;
  state.editingId = fornecedor.id;
  if (submitButton) submitButton.textContent = "Atualizar fornecedor";
};

const validateForm = ({ nome, cnpj, email }) => {
  if (!nome) return "Nome e obrigatorio";
  if (!cnpj) return "CNPJ e obrigatorio";
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return "Email invalido";
  return null;
};

export const renderFornecedores = () => `
  <section class="grid">
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-truck"></i></div>
      <div>
        <p class="metric-label">Fornecedores ativos</p>
        <p class="metric-value">38</p>
        <p class="metric-note">Parceiros homologados</p>
      </div>
    </div>
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-clipboard-check"></i></div>
      <div>
        <p class="metric-label">Pedidos em aberto</p>
        <p class="metric-value">6</p>
        <p class="metric-note">Encomendas em andamento</p>
      </div>
    </div>
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-stars"></i></div>
      <div>
        <p class="metric-label">Avaliacao media</p>
        <p class="metric-value">4.6</p>
        <p class="metric-note">Relacionamento comercial</p>
      </div>
    </div>
  </section>

  <section class="grid two">
    <div class="card">
      <div class="page-header mb-3">
        <div>
          <h4>Fornecedores cadastrados</h4>
          <p class="page-subtitle">Busque por nome, CNPJ ou contato.</p>
        </div>
        <button class="btn btn-primary" id="fornecedores-new">
          <i class="bi bi-plus-circle"></i>
          Novo fornecedor
        </button>
      </div>

      <div class="filters mb-3">
        <div class="filter-row">
          <input class="form-control" id="fornecedores-search" placeholder="Buscar por nome, CNPJ ou contato" />
          <select class="form-select" id="fornecedores-status">
            <option value="">Status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-outline-secondary" id="fornecedores-clear">Limpar</button>
          <button class="btn btn-dark" id="fornecedores-apply">Aplicar filtros</button>
        </div>
      </div>

      <div id="fornecedores-table"></div>
    </div>

    <div class="card">
      <h4>Cadastro rapido</h4>
      <p class="page-subtitle">Inclua dados completos do fornecedor.</p>
      <div id="fornecedores-feedback" class="mb-3"></div>
      <form id="fornecedores-form">
        <div class="form-grid">
          <input class="form-control" name="nome" placeholder="Nome fantasia" />
          <input class="form-control" name="cnpj" placeholder="CNPJ" />
          <input class="form-control" name="telefone" placeholder="Telefone" />
          <input class="form-control" name="email" placeholder="Email" />
          <select class="form-select" name="status">
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
        <div class="mt-3 d-flex gap-2">
          <button class="btn btn-outline-secondary" type="button" id="fornecedores-cancel">Cancelar</button>
          <button class="btn btn-primary" type="submit" id="fornecedores-submit">Cadastrar fornecedor</button>
        </div>
      </form>
      <p class="form-hint mt-3">
        Permissoes de gestao sao restritas a admin e categoria 3.
      </p>
    </div>
  </section>
`;

export const initFornecedores = () => {
  const tableContainer = document.getElementById("fornecedores-table");
  const form = document.getElementById("fornecedores-form");
  const feedback = document.getElementById("fornecedores-feedback");
  const submitButton = document.getElementById("fornecedores-submit");
  const cancelButton = document.getElementById("fornecedores-cancel");
  const newButton = document.getElementById("fornecedores-new");

  const filters = {
    search: document.getElementById("fornecedores-search"),
    status: document.getElementById("fornecedores-status"),
  };

  const { canManage } = getPermission();

  const refresh = () => {
    const filtered = applyFilters(filters);
    renderList(tableContainer, filtered, canManage, handleEdit, handleDelete);
  };

  const handleEdit = (id) => {
    if (!canManage) {
      setFeedback(feedback, "danger", "Sem permissao para editar fornecedores.");
      return;
    }
    const fornecedor = state.items.find((item) => item.id === id);
    if (!fornecedor) return;
    clearFeedback(feedback);
    fillForm(form, fornecedor, submitButton);
  };

  const handleDelete = (id) => {
    if (!canManage) {
      setFeedback(feedback, "danger", "Sem permissao para excluir fornecedores.");
      return;
    }
    const shouldDelete = window.confirm("Confirma a exclusao deste fornecedor?");
    if (!shouldDelete) return;
    state.items = state.items.filter((item) => item.id !== id);
    setFeedback(feedback, "success", "Fornecedor removido com sucesso.");
    refresh();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    clearFeedback(feedback);

    if (!canManage) {
      setFeedback(feedback, "danger", "Sem permissao para cadastrar fornecedores.");
      return;
    }

    const payload = {
      nome: form.nome.value.trim(),
      cnpj: form.cnpj.value.trim(),
      telefone: form.telefone.value.trim(),
      email: form.email.value.trim(),
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
      setFeedback(feedback, "success", "Fornecedor atualizado com sucesso.");
    } else {
      const nextId = state.items.length
        ? Math.max(...state.items.map((item) => item.id)) + 1
        : 1;
      state.items = [...state.items, { id: nextId, ...payload }];
      setFeedback(feedback, "success", "Fornecedor cadastrado com sucesso.");
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
    refresh();
  };

  if (form) form.addEventListener("submit", handleSubmit);
  if (cancelButton) cancelButton.addEventListener("click", handleCancel);
  if (newButton) newButton.addEventListener("click", handleCancel);

  const applyButton = document.getElementById("fornecedores-apply");
  const clearButton = document.getElementById("fornecedores-clear");

  if (applyButton) applyButton.addEventListener("click", refresh);
  if (clearButton) clearButton.addEventListener("click", handleClearFilters);

  Object.values(filters).forEach((input) => {
    if (input) input.addEventListener("input", refresh);
    if (input) input.addEventListener("change", refresh);
  });

  refresh();
};
