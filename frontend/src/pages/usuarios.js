import { renderTable, renderStatus, renderAlert, getStoredUser, isAdminUser } from "./ui.js";

const seedUsuarios = [
  {
    id: 1,
    nome: "Admin Sistema",
    email: "admin@crm.local",
    tipo: "admin",
    categoria: "-",
    status: "ativo",
  },
  {
    id: 2,
    nome: "Lucas Pereira",
    email: "lucas@crm.local",
    tipo: "funcionario",
    categoria: "1",
    status: "ativo",
  },
  {
    id: 3,
    nome: "Ana Souza",
    email: "ana@crm.local",
    tipo: "funcionario",
    categoria: "2",
    status: "ativo",
  },
  {
    id: 4,
    nome: "Marcos Lima",
    email: "marcos@crm.local",
    tipo: "funcionario",
    categoria: "3",
    status: "inativo",
  },
];

const statusUsuario = (status) => {
  if (status === "ativo") return renderStatus("Ativo", "success");
  return renderStatus("Inativo", "neutral");
};

const getPermission = () => {
  const user = getStoredUser();
  return {
    canManage: isAdminUser(user),
  };
};

const state = {
  items: [...seedUsuarios],
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
  const tipo = filters.tipo?.value || "";
  const categoria = filters.categoria?.value || "";
  const status = filters.status?.value || "";

  return state.items.filter((item) => {
    const matchesSearch =
      !search ||
      item.nome.toLowerCase().includes(search) ||
      item.email.toLowerCase().includes(search);
    const matchesTipo = !tipo || item.tipo === tipo;
    const matchesCategoria = !categoria || item.categoria === categoria;
    const matchesStatus = !status || item.status === status;

    return matchesSearch && matchesTipo && matchesCategoria && matchesStatus;
  });
};

const renderList = (container, items, canDelete, onEdit, onDelete) => {
  if (!container) return;

  container.innerHTML = renderTable(
    ["ID", "Nome", "Email", "Tipo", "Categoria", "Status", "Acoes"],
    items.map((usuario) => [
      `#${usuario.id}`,
      usuario.nome,
      usuario.email,
      usuario.tipo === "admin" ? "Admin" : "Funcionario",
      usuario.tipo === "admin" ? "-" : usuario.categoria,
      statusUsuario(usuario.status),
      `
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${usuario.id}">Editar</button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${usuario.id}" ${
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
  if (submitButton) submitButton.textContent = "Cadastrar usuario";
};

const fillForm = (form, usuario, submitButton) => {
  form.nome.value = usuario.nome;
  form.email.value = usuario.email;
  form.senha.value = "";
  form.tipo.value = usuario.tipo;
  form.categoria.value = usuario.tipo === "admin" ? "" : usuario.categoria;
  form.status.value = usuario.status;
  state.editingId = usuario.id;
  if (submitButton) submitButton.textContent = "Atualizar usuario";
};

const validateForm = ({ nome, email, tipo, categoria, senha }) => {
  if (!nome) return "Nome e obrigatorio";
  if (!email) return "Email e obrigatorio";
  if (!/^\S+@\S+\.\S+$/.test(email)) return "Email invalido";
  if (!tipo) return "Tipo de usuario e obrigatorio";
  if (tipo === "funcionario" && !categoria) return "Categoria e obrigatoria";
  if (!senha && !state.editingId) return "Senha e obrigatoria";
  return null;
};

export const renderUsuarios = () => `
  <section class="grid">
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-shield-lock"></i></div>
      <div>
        <p class="metric-label">Administradores</p>
        <p class="metric-value">2</p>
        <p class="metric-note">Acesso total</p>
      </div>
    </div>
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-person-badge"></i></div>
      <div>
        <p class="metric-label">Equipe ativa</p>
        <p class="metric-value">18</p>
        <p class="metric-note">Categorias 1-3</p>
      </div>
    </div>
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-person-x"></i></div>
      <div>
        <p class="metric-label">Usuarios inativos</p>
        <p class="metric-value">3</p>
        <p class="metric-note">Sem acesso</p>
      </div>
    </div>
  </section>

  <section class="grid two">
    <div class="card">
      <div class="page-header mb-3">
        <div>
          <h4>Gestao de usuarios</h4>
          <p class="page-subtitle">Apenas admin pode cadastrar novos usuarios.</p>
        </div>
        <button class="btn btn-primary" id="usuarios-new">
          <i class="bi bi-plus-circle"></i>
          Novo usuario
        </button>
      </div>

      <div class="filters mb-3">
        <div class="filter-row">
          <input class="form-control" id="usuarios-search" placeholder="Buscar por nome ou email" />
          <select class="form-select" id="usuarios-tipo">
            <option value="">Tipo de usuario</option>
            <option value="admin">Admin</option>
            <option value="funcionario">Funcionario</option>
          </select>
          <select class="form-select" id="usuarios-categoria">
            <option value="">Categoria</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
          <select class="form-select" id="usuarios-status">
            <option value="">Status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-outline-secondary" id="usuarios-clear">Limpar</button>
          <button class="btn btn-dark" id="usuarios-apply">Aplicar filtros</button>
        </div>
      </div>

      <div id="usuarios-table"></div>
    </div>

    <div class="card">
      <h4>Cadastrar usuario</h4>
      <p class="page-subtitle">Defina perfil e categoria de acesso.</p>
      <div id="usuarios-feedback" class="mb-3"></div>
      <form id="usuarios-form">
        <div class="form-grid">
          <input class="form-control" name="nome" placeholder="Nome completo" />
          <input class="form-control" name="email" placeholder="Email" />
          <input class="form-control" name="senha" placeholder="Senha provisoria" />
          <select class="form-select" name="tipo" id="usuarios-tipo-form">
            <option value="">Tipo de usuario</option>
            <option value="admin">Admin</option>
            <option value="funcionario">Funcionario</option>
          </select>
          <select class="form-select" name="categoria" id="usuarios-categoria-form">
            <option value="">Categoria do funcionario</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
          <select class="form-select" name="status">
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
        <div class="mt-3 d-flex gap-2">
          <button class="btn btn-outline-secondary" type="button" id="usuarios-cancel">Cancelar</button>
          <button class="btn btn-primary" type="submit" id="usuarios-submit">Cadastrar usuario</button>
        </div>
      </form>
      <p class="form-hint mt-3">
        Ative ou desative usuarios sem excluir registros historicos.
      </p>
    </div>
  </section>
`;

export const initUsuarios = () => {
  const tableContainer = document.getElementById("usuarios-table");
  const form = document.getElementById("usuarios-form");
  const feedback = document.getElementById("usuarios-feedback");
  const submitButton = document.getElementById("usuarios-submit");
  const cancelButton = document.getElementById("usuarios-cancel");
  const newButton = document.getElementById("usuarios-new");
  const tipoForm = document.getElementById("usuarios-tipo-form");
  const categoriaForm = document.getElementById("usuarios-categoria-form");

  const filters = {
    search: document.getElementById("usuarios-search"),
    tipo: document.getElementById("usuarios-tipo"),
    categoria: document.getElementById("usuarios-categoria"),
    status: document.getElementById("usuarios-status"),
  };

  const { canManage } = getPermission();

  const refresh = () => {
    const filtered = applyFilters(filters);
    renderList(tableContainer, filtered, canManage, handleEdit, handleDelete);
  };

  const handleEdit = (id) => {
    if (!canManage) {
      setFeedback(feedback, "danger", "Somente admin pode editar usuarios.");
      return;
    }
    const usuario = state.items.find((item) => item.id === id);
    if (!usuario) return;
    clearFeedback(feedback);
    fillForm(form, usuario, submitButton);
    toggleCategoriaField();
  };

  const handleDelete = (id) => {
    if (!canManage) {
      setFeedback(feedback, "danger", "Somente admin pode excluir usuarios.");
      return;
    }
    const shouldDelete = window.confirm("Confirma a exclusao deste usuario?");
    if (!shouldDelete) return;
    state.items = state.items.filter((item) => item.id !== id);
    setFeedback(feedback, "success", "Usuario removido com sucesso.");
    refresh();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    clearFeedback(feedback);

    if (!canManage) {
      setFeedback(feedback, "danger", "Somente admin pode cadastrar usuarios.");
      return;
    }

    const payload = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      senha: form.senha.value.trim(),
      tipo: form.tipo.value,
      categoria: form.categoria.value,
      status: form.status.value,
    };

    const validationError = validateForm(payload);
    if (validationError) {
      setFeedback(feedback, "danger", validationError);
      return;
    }

    const categoria = payload.tipo === "admin" ? "-" : payload.categoria;

    if (state.editingId) {
      state.items = state.items.map((item) =>
        item.id === state.editingId ? { ...item, ...payload, categoria } : item
      );
      setFeedback(feedback, "success", "Usuario atualizado com sucesso.");
    } else {
      const nextId = state.items.length
        ? Math.max(...state.items.map((item) => item.id)) + 1
        : 1;
      state.items = [...state.items, { id: nextId, ...payload, categoria }];
      setFeedback(feedback, "success", "Usuario cadastrado com sucesso.");
    }

    resetForm(form, submitButton);
    toggleCategoriaField();
    refresh();
  };

  const handleCancel = () => {
    resetForm(form, submitButton);
    clearFeedback(feedback);
    toggleCategoriaField();
  };

  const handleClearFilters = () => {
    Object.values(filters).forEach((input) => {
      if (input) input.value = "";
    });
    refresh();
  };

  const toggleCategoriaField = () => {
    if (!categoriaForm || !tipoForm) return;
    const tipo = tipoForm.value;
    if (tipo === "admin") {
      categoriaForm.value = "";
      categoriaForm.setAttribute("disabled", "disabled");
    } else {
      categoriaForm.removeAttribute("disabled");
    }
  };

  if (tipoForm) tipoForm.addEventListener("change", toggleCategoriaField);

  if (form) form.addEventListener("submit", handleSubmit);
  if (cancelButton) cancelButton.addEventListener("click", handleCancel);
  if (newButton) newButton.addEventListener("click", handleCancel);

  const applyButton = document.getElementById("usuarios-apply");
  const clearButton = document.getElementById("usuarios-clear");

  if (applyButton) applyButton.addEventListener("click", refresh);
  if (clearButton) clearButton.addEventListener("click", handleClearFilters);

  Object.values(filters).forEach((input) => {
    if (input) input.addEventListener("input", refresh);
    if (input) input.addEventListener("change", refresh);
  });

  toggleCategoriaField();
  refresh();
};
