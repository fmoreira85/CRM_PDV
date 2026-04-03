const isAdmin = (user) => user?.tipo_usuario === "admin";
const isFuncionarioCategoria = (user, categoria) =>
  user?.tipo_usuario === "funcionario" &&
  Number(user?.categoria_funcionario) === categoria;

const deny = (res) =>
  res.status(403).json({
    status: "error",
    message: "Acesso negado",
  });

export const allowAdmin = (req, res, next) => {
  if (isAdmin(req.user)) {
    return next();
  }

  return deny(res);
};

const allowCategorias = (categorias) => (req, res, next) => {
  if (isAdmin(req.user)) {
    return next();
  }

  const permitido = categorias.some((categoria) =>
    isFuncionarioCategoria(req.user, categoria)
  );

  if (!permitido) {
    return deny(res);
  }

  return next();
};

export const canReadVendas = allowCategorias([1]);
export const canCreateVendas = allowCategorias([1]);
export const canManageVendas = allowAdmin;

export const canReadItensVendidos = allowCategorias([1]);
export const canCreateItensVendidos = allowCategorias([1]);
export const canManageItensVendidos = allowCategorias([1]);

export const canRequestAutorizacao = allowCategorias([1]);
export const canApproveAutorizacao = allowAdmin;

export const canManageProdutos = allowCategorias([2]);
export const canManageClientes = allowCategorias([2]);
export const canManageEstoque = allowCategorias([2]);
export const canManageMovimentacoesEstoque = allowCategorias([2]);

export const canManageFornecedores = allowCategorias([3]);
export const canManageEncomendas = allowCategorias([3]);

export const canManageUsuarios = allowAdmin;
export const canManageDespesas = allowAdmin;
export const canManageCaixa = allowAdmin;
export const canReadDashboard = allowAdmin;
