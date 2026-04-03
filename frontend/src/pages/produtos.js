import { renderTable, renderStatus, renderAlert, getStoredUser, hasCategoria } from "./ui.js";

const seedProdutos = [
  {
    id: 1,
    sku: "PDV-1001",
    nome: "Cerveja Pilsen 350ml",
    categoria: "Bebidas",
    subcategoria: "Cervejas",
    marca: "Nordeste",
    estoque: "124",
    preco_custo: "3.20",
    preco_venda: "5.50",
    unidade: "UN",
    status: "ativo",
  },
  {
    id: 2,
    sku: "PDV-1023",
    nome: "Chocolate Barra 90g",
    categoria: "Mercearia",
    subcategoria: "Doces",
    marca: "Doce Lar",
    estoque: "38",
    preco_custo: "2.10",
    preco_venda: "4.20",
    unidade: "UN",
    status: "baixo",
  },
  {
    id: 3,
    sku: "PDV-1104",
    nome: "Detergente Neutro 500ml",
    categoria: "Limpeza",
    subcategoria: "Detergentes",
    marca: "Brilho",
    estoque: "0",
    preco_custo: "1.50",
    preco_venda: "3.50",
    unidade: "UN",
    status: "inativo",
  },
];

const statusProduto = (status) => {
  if (status === "ativo") return renderStatus("Ativo", "success");
  if (status === "baixo") return renderStatus("Baixo", "warning");
  return renderStatus("Inativo", "neutral");
};

const getPermission = () => {
  const user = getStoredUser();
  return {
    canManage: hasCategoria(user, 2),
  };
};

const state = {
  items: [...seedProdutos],
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
  const marca = (filters.marca?.value || "").toLowerCase();
  const categoria = filters.categoria?.value || "";
  const status = filters.status?.value || "";

  return state.items.filter((item) => {
    const matchesSearch =
      !search ||
      item.nome.toLowerCase().includes(search) ||
      item.sku.toLowerCase().includes(search);
    const matchesMarca = !marca || item.marca.toLowerCase().includes(marca);
    const matchesCategoria = !categoria || item.categoria === categoria;
    const matchesStatus = !status || item.status === status;

    return matchesSearch && matchesMarca && matchesCategoria && matchesStatus;
  });
};

const renderList = (container, items, canDelete, onEdit, onDelete) => {
  if (!container) return;

  container.innerHTML = renderTable(
    ["SKU", "Produto", "Categoria", "Marca", "Estoque", "Status", "Acoes"],
    items.map((produto) => [
      produto.sku,
      produto.nome,
      produto.categoria,
      produto.marca,
      produto.estoque,
      statusProduto(produto.status),
      `
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${produto.id}">
            Editar
          </button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${produto.id}" ${
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
    submitButton.textContent = "Cadastrar produto";
  }
};

const fillForm = (form, produto, submitButton) => {
  form.nome.value = produto.nome;
  form.marca.value = produto.marca;
  form.categoria.value = produto.categoria;
  form.subcategoria.value = produto.subcategoria;
  form.preco_custo.value = produto.preco_custo;
  form.preco_venda.value = produto.preco_venda;
  form.unidade.value = produto.unidade;
  form.status.value = produto.status;
  state.editingId = produto.id;
  if (submitButton) {
    submitButton.textContent = "Atualizar produto";
  }
};

const validateForm = ({ nome, categoria, preco_venda, preco_custo }) => {
  if (!nome) return "Nome do produto e obrigatorio";
  if (!categoria) return "Categoria e obrigatoria";
  const precoVenda = Number(preco_venda);
  if (Number.isNaN(precoVenda) || precoVenda <= 0) {
    return "Preco de venda invalido";
  }
  if (preco_custo) {
    const precoCusto = Number(preco_custo);
    if (Number.isNaN(precoCusto) || precoCusto <= 0) {
      return "Preco de custo invalido";
    }
  }
  return null;
};

export const renderProdutos = () => `
  <section class="grid">
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-box-seam"></i></div>
      <div>
        <p class="metric-label">Produtos ativos</p>
        <p class="metric-value">1.284</p>
        <p class="metric-note">Catalogo completo</p>
      </div>
    </div>
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-exclamation-triangle"></i></div>
      <div>
        <p class="metric-label">Reposicao urgente</p>
        <p class="metric-value">18</p>
        <p class="metric-note">Abaixo do ideal</p>
      </div>
    </div>
    <div class="card metric">
      <div class="metric-icon"><i class="bi bi-tags"></i></div>
      <div>
        <p class="metric-label">Margem media</p>
        <p class="metric-value">22%</p>
        <p class="metric-note">Ultimo trimestre</p>
      </div>
    </div>
  </section>

  <section class="grid two">
    <div class="card">
      <div class="page-header mb-3">
        <div>
          <h4>Produtos e categorias</h4>
          <p class="page-subtitle">Gerencie categorias, subcategorias e marcas.</p>
        </div>
        <button class="btn btn-primary" id="produtos-new">
          <i class="bi bi-plus-circle"></i>
          Novo produto
        </button>
      </div>

      <div class="filters mb-3">
        <div class="filter-row">
          <input class="form-control" id="produtos-search" placeholder="Buscar por nome ou SKU" />
          <input class="form-control" id="produtos-marca" placeholder="Marca" />
          <select class="form-select" id="produtos-categoria">
            <option value="">Categoria</option>
            <option value="Bebidas">Bebidas</option>
            <option value="Mercearia">Mercearia</option>
            <option value="Limpeza">Limpeza</option>
          </select>
          <select class="form-select" id="produtos-status">
            <option value="">Status</option>
            <option value="ativo">Ativo</option>
            <option value="baixo">Baixo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-outline-secondary" id="produtos-clear">Limpar</button>
          <button class="btn btn-dark" id="produtos-apply">Aplicar filtros</button>
        </div>
      </div>

      <div id="produtos-table"></div>
    </div>

    <div class="card">
      <h4>Cadastro rapido de produto</h4>
      <p class="page-subtitle">Atualize precos e vinculos de categoria.</p>
      <div id="produtos-feedback" class="mb-3"></div>
      <form id="produtos-form">
        <div class="form-grid">
          <input class="form-control" name="nome" placeholder="Nome do produto" />
          <input class="form-control" name="marca" placeholder="Marca" />
          <select class="form-select" name="categoria">
            <option value="">Categoria</option>
            <option value="Bebidas">Bebidas</option>
            <option value="Mercearia">Mercearia</option>
            <option value="Limpeza">Limpeza</option>
          </select>
          <input class="form-control" name="subcategoria" placeholder="Subcategoria" />
          <input class="form-control" name="preco_custo" placeholder="Preco de custo atual" />
          <input class="form-control" name="preco_venda" placeholder="Preco de venda atual" />
          <input class="form-control" name="unidade" placeholder="Unidade (ex: UN, KG)" />
          <select class="form-select" name="status">
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
        <div class="mt-3 d-flex gap-2">
          <button class="btn btn-outline-secondary" type="button" id="produtos-cancel">Cancelar</button>
          <button class="btn btn-primary" type="submit" id="produtos-submit">
            Cadastrar produto
          </button>
        </div>
      </form>
      <p class="form-hint mt-3">
        Produtos inativos permanecem no historico e nao somem do banco de dados.
      </p>
    </div>
  </section>
`;

export const initProdutos = () => {
  const tableContainer = document.getElementById("produtos-table");
  const form = document.getElementById("produtos-form");
  const feedback = document.getElementById("produtos-feedback");
  const submitButton = document.getElementById("produtos-submit");
  const cancelButton = document.getElementById("produtos-cancel");
  const newButton = document.getElementById("produtos-new");

  const filters = {
    search: document.getElementById("produtos-search"),
    marca: document.getElementById("produtos-marca"),
    categoria: document.getElementById("produtos-categoria"),
    status: document.getElementById("produtos-status"),
  };

  const { canManage } = getPermission();

  const refresh = () => {
    const filtered = applyFilters(filters);
    renderList(tableContainer, filtered, canManage, handleEdit, handleDelete);
  };

  const handleEdit = (id) => {
    const produto = state.items.find((item) => item.id === id);
    if (!produto) return;
    clearFeedback(feedback);
    fillForm(form, produto, submitButton);
  };

  const handleDelete = (id) => {
    if (!canManage) {
      setFeedback(feedback, "danger", "Sem permissao para excluir produtos.");
      return;
    }
    const shouldDelete = window.confirm("Confirma a exclusao deste produto?");
    if (!shouldDelete) return;
    state.items = state.items.filter((item) => item.id !== id);
    setFeedback(feedback, "success", "Produto removido com sucesso.");
    refresh();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    clearFeedback(feedback);

    const payload = {
      nome: form.nome.value.trim(),
      marca: form.marca.value.trim(),
      categoria: form.categoria.value,
      subcategoria: form.subcategoria.value.trim(),
      preco_custo: form.preco_custo.value.trim(),
      preco_venda: form.preco_venda.value.trim(),
      unidade: form.unidade.value.trim() || "UN",
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
      setFeedback(feedback, "success", "Produto atualizado com sucesso.");
    } else {
      const nextId = state.items.length
        ? Math.max(...state.items.map((item) => item.id)) + 1
        : 1;
      const sku = `PDV-${1000 + nextId}`;
      state.items = [...state.items, { id: nextId, sku, estoque: "0", ...payload }];
      setFeedback(feedback, "success", "Produto cadastrado com sucesso.");
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
    if (filters.marca) filters.marca.value = "";
    if (filters.categoria) filters.categoria.value = "";
    if (filters.status) filters.status.value = "";
    refresh();
  };

  if (form) form.addEventListener("submit", handleSubmit);
  if (cancelButton) cancelButton.addEventListener("click", handleCancel);
  if (newButton) newButton.addEventListener("click", handleCancel);

  const applyButton = document.getElementById("produtos-apply");
  const clearButton = document.getElementById("produtos-clear");

  if (applyButton) applyButton.addEventListener("click", refresh);
  if (clearButton) clearButton.addEventListener("click", handleClearFilters);

  Object.values(filters).forEach((input) => {
    if (input) input.addEventListener("input", refresh);
    if (input) input.addEventListener("change", refresh);
  });

  refresh();
};
