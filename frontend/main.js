import { renderDashboard, initDashboard } from "./src/pages/dashboard.js";
import { renderLogin, initLogin } from "./src/pages/login.js";
import { renderClientes, initClientes } from "./src/pages/clientes.js";
import { renderProdutos, initProdutos } from "./src/pages/produtos.js";
import { renderEstoque, initEstoque } from "./src/pages/estoque.js";
import { renderVendas, initVendas } from "./src/pages/vendas.js";
import { renderDespesas, initDespesas } from "./src/pages/despesas.js";
import { renderFornecedores, initFornecedores } from "./src/pages/fornecedores.js";
import { renderEncomendas, initEncomendas } from "./src/pages/encomendas.js";
import { renderCaixa } from "./src/pages/caixa.js";
import { renderUsuarios, initUsuarios } from "./src/pages/usuarios.js";
import { setContent } from "./src/utils/dom.js";

const pageTitle = document.querySelector("#page-title");
const pageSubtitle = document.querySelector("#page-subtitle");
const pageContent = document.querySelector("#page-content");
const navItems = document.querySelectorAll(".nav-item");
const layout = document.querySelector("#app-layout");
const userName = document.querySelector("#user-name");
const userRole = document.querySelector("#user-role");
const logoutButton = document.querySelector("#logout-button");
const topbarPrimaryAction = document.querySelector("#topbar-primary-action");

const pages = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Visao geral do negocio",
    render: renderDashboard,
    init: initDashboard,
  },
  clientes: {
    title: "Clientes",
    subtitle: "Relacionamento e financeiro",
    render: renderClientes,
    init: initClientes,
  },
  produtos: {
    title: "Produtos",
    subtitle: "Catalogo, categorias e precos",
    render: renderProdutos,
    init: initProdutos,
  },
  estoque: {
    title: "Estoque",
    subtitle: "Controle de lotes e validade",
    render: renderEstoque,
    init: initEstoque,
  },
  vendas: {
    title: "Vendas",
    subtitle: "Fluxo comercial diario",
    render: renderVendas,
    init: initVendas,
  },
  despesas: {
    title: "Despesas",
    subtitle: "Saidas e custos operacionais",
    render: renderDespesas,
    init: initDespesas,
  },
  fornecedores: {
    title: "Fornecedores",
    subtitle: "Parceiros e compras",
    render: renderFornecedores,
    init: initFornecedores,
  },
  encomendas: {
    title: "Encomendas",
    subtitle: "Pedidos e prazos",
    render: renderEncomendas,
    init: initEncomendas,
  },
  caixa: {
    title: "Caixa",
    subtitle: "Entradas e saidas",
    render: renderCaixa,
  },
  usuarios: {
    title: "Usuarios",
    subtitle: "Controle de acessos",
    render: renderUsuarios,
    init: initUsuarios,
  },
  login: {
    title: "Login",
    subtitle: "Acesso ao painel",
    render: renderLogin,
    init: initLogin,
  },
};

const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const resolveRole = (user) => {
  if (!user) return "guest";
  if (user.tipo_usuario === "admin") return "admin";
  if (user.tipo_usuario === "funcionario") {
    const categoria = Number(user.categoria_funcionario);
    if (categoria === 1) return "cat1";
    if (categoria === 2) return "cat2";
    if (categoria === 3) return "cat3";
  }
  return "guest";
};

const rolePages = {
  admin: [
    "dashboard",
    "clientes",
    "produtos",
    "estoque",
    "vendas",
    "despesas",
    "fornecedores",
    "encomendas",
    "caixa",
    "usuarios",
  ],
  cat1: ["vendas"],
  cat2: ["clientes", "produtos", "estoque"],
  cat3: ["fornecedores", "encomendas"],
  guest: ["login"],
};

const getAllowedPages = (role) => rolePages[role] || rolePages.guest;

const getDefaultPage = (role) => {
  const allowed = getAllowedPages(role);
  return allowed[0] || "login";
};

const setActiveNav = (targetKey) => {
  navItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.nav === targetKey);
  });
};

const applyNavVisibility = (allowedPages) => {
  navItems.forEach((item) => {
    const key = item.dataset.nav;
    item.classList.toggle("d-none", !allowedPages.includes(key));
  });

  const sections = document.querySelectorAll(".nav-section");
  sections.forEach((section) => {
    let next = section.nextElementSibling;
    let hasVisible = false;
    while (next && !next.classList.contains("nav-section")) {
      if (!next.classList.contains("d-none")) {
        hasVisible = true;
        break;
      }
      next = next.nextElementSibling;
    }
    section.classList.toggle("d-none", !hasVisible);
  });
};

const setUserMeta = (user) => {
  if (userName) {
    userName.textContent = user?.nome ?? "Admin";
  }
  if (userRole) {
    if (user?.tipo_usuario === "admin") {
      userRole.textContent = "Administrador";
    } else if (user?.categoria_funcionario) {
      userRole.textContent = `Categoria ${user.categoria_funcionario}`;
    } else {
      userRole.textContent = "Usuario";
    }
  }
};

const resolveRoute = (key) => {
  const role = resolveRole(getCurrentUser());
  const allowedPages = getAllowedPages(role);

  if (!key) {
    return localStorage.getItem("auth_token") ? getDefaultPage(role) : "login";
  }
  if (!pages[key]) {
    return getDefaultPage(role);
  }
  if (key !== "login" && !localStorage.getItem("auth_token")) {
    return "login";
  }
  if (key !== "login" && !allowedPages.includes(key)) {
    return getDefaultPage(role);
  }
  return key;
};

const renderPage = (key) => {
  const pageKey = resolveRoute(key);
  const page = pages[pageKey];
  const role = resolveRole(getCurrentUser());
  const allowedPages = getAllowedPages(role);

  if (layout) {
    layout.classList.toggle("is-auth", pageKey === "login");
  }

  applyNavVisibility(allowedPages);

  if (topbarPrimaryAction) {
    topbarPrimaryAction.classList.toggle(
      "d-none",
      !allowedPages.includes("vendas")
    );
  }

  if (pageTitle) {
    pageTitle.textContent = page.title ?? "";
  }
  if (pageSubtitle) {
    pageSubtitle.textContent = page.subtitle ?? "";
  }

  setContent(pageContent, page.render());
  setActiveNav(pageKey);

  if (typeof page.init === "function") {
    page.init({ navigate, setUser: setUserMeta });
  }
};

const navigate = (key) => {
  window.location.hash = key;
};

const renderFromHash = () => {
  const hash = window.location.hash.replace("#", "");
  renderPage(hash);
};

navItems.forEach((item) => {
  item.addEventListener("click", () => navigate(item.dataset.nav));
});

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    navigate("login");
  });
}

const storedUser = localStorage.getItem("auth_user");
if (storedUser) {
  try {
    setUserMeta(JSON.parse(storedUser));
  } catch (error) {
    console.warn("Nao foi possivel ler o usuario salvo.");
  }
}

window.addEventListener("hashchange", renderFromHash);

renderFromHash();
