import { getConnection } from "../../connections.js";

const db = getConnection();
const VALID_TIPOS = ["admin", "funcionario"];
const VALID_CATEGORIAS = [1, 2, 3];

const handleError = (res, error, message) => {
  console.error(error);
  return res.status(500).json({ status: "error", message });
};

const parseAtivo = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? undefined : numberValue;
};

const validateTipoCategoria = (tipo_usuario, categoria_funcionario) => {
  if (!VALID_TIPOS.includes(tipo_usuario)) {
    return "Tipo de usuario invalido";
  }

  if (tipo_usuario === "admin") {
    if (categoria_funcionario !== null && categoria_funcionario !== undefined) {
      return "Admin nao deve possuir categoria de funcionario";
    }
    return null;
  }

  const categoria = Number(categoria_funcionario);
  if (!VALID_CATEGORIAS.includes(categoria)) {
    return "Categoria de funcionario invalida";
  }

  return null;
};

export const listUsuarios = async (req, res) => {
  try {
    const { tipo_usuario, categoria_funcionario, ativo, email, nome, search } = req.query;

    if (tipo_usuario && !VALID_TIPOS.includes(tipo_usuario)) {
      return res.status(400).json({ status: "error", message: "Tipo de usuario invalido" });
    }

    if (categoria_funcionario !== undefined) {
      const categoria = Number(categoria_funcionario);
      if (!VALID_CATEGORIAS.includes(categoria)) {
        return res
          .status(400)
          .json({ status: "error", message: "Categoria de funcionario invalida" });
      }
    }

    if (ativo !== undefined) {
      const ativoValue = parseAtivo(ativo);
      if (ativoValue !== 0 && ativoValue !== 1) {
        return res.status(400).json({ status: "error", message: "Filtro ativo invalido" });
      }
    }

    const filters = [];
    const params = [];

    if (tipo_usuario) {
      filters.push("tipo_usuario = ?");
      params.push(tipo_usuario);
    }

    if (categoria_funcionario !== undefined) {
      filters.push("categoria_funcionario = ?");
      params.push(Number(categoria_funcionario));
    }

    if (ativo !== undefined) {
      filters.push("ativo = ?");
      params.push(parseAtivo(ativo));
    }

    if (email) {
      filters.push("email LIKE ?");
      params.push(`%${email}%`);
    }

    if (nome) {
      filters.push("nome LIKE ?");
      params.push(`%${nome}%`);
    }

    if (search) {
      filters.push("(nome LIKE ? OR email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT id, nome, email, tipo_usuario, categoria_funcionario, ativo, created_at, updated_at FROM usuarios ${whereSql} ORDER BY id DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao listar usuarios");
  }
};

export const getUsuario = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nome, email, tipo_usuario, categoria_funcionario, ativo, created_at, updated_at FROM usuarios WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Usuario nao encontrado" });
    }

    return res.json({ status: "success", data: rows[0] });
  } catch (error) {
    return handleError(res, error, "Erro ao buscar usuario");
  }
};

export const createUsuario = async (req, res) => {
  try {
    const { nome, email, senha, tipo_usuario } = req.body;

    if (!nome || !email || !senha || !tipo_usuario) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    const categoria_funcionario = req.body.categoria_funcionario ?? null;
    const ativo = parseAtivo(req.body.ativo);

    if (ativo !== undefined && ativo !== 0 && ativo !== 1) {
      return res.status(400).json({ status: "error", message: "Campo ativo invalido" });
    }

    const validationMessage = validateTipoCategoria(tipo_usuario, categoria_funcionario);
    if (validationMessage) {
      return res.status(400).json({ status: "error", message: validationMessage });
    }

    const [existing] = await db.query("SELECT id FROM usuarios WHERE email = ?", [
      email,
    ]);

    if (existing.length > 0) {
      return res.status(409).json({ status: "error", message: "Email ja cadastrado" });
    }

    const [result] = await db.query(
      "INSERT INTO usuarios (nome, email, senha, tipo_usuario, categoria_funcionario, ativo) VALUES (?, ?, ?, ?, ?, ?)",
      [
        nome,
        email,
        senha,
        tipo_usuario,
        tipo_usuario === "admin" ? null : Number(categoria_funcionario),
        ativo ?? 1,
      ]
    );

    return res.status(201).json({
      status: "success",
      message: "Usuario criado",
      data: { id: result.insertId },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao criar usuario");
  }
};

export const updateUsuario = async (req, res) => {
  try {
    const [currentRows] = await db.query(
      "SELECT id, nome, email, senha, tipo_usuario, categoria_funcionario, ativo FROM usuarios WHERE id = ?",
      [req.params.id]
    );

    if (currentRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Usuario nao encontrado" });
    }

    const current = currentRows[0];

    const payload = {
      nome: req.body.nome ?? current.nome,
      email: req.body.email ?? current.email,
      senha: req.body.senha ?? current.senha,
      tipo_usuario: req.body.tipo_usuario ?? current.tipo_usuario,
      categoria_funcionario:
        req.body.categoria_funcionario !== undefined
          ? req.body.categoria_funcionario
          : current.categoria_funcionario,
      ativo:
        req.body.ativo !== undefined ? parseAtivo(req.body.ativo) : current.ativo,
    };

    if (!payload.nome || !payload.email || !payload.senha || !payload.tipo_usuario) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    if (payload.ativo !== 0 && payload.ativo !== 1) {
      return res.status(400).json({ status: "error", message: "Campo ativo invalido" });
    }

    const validationMessage = validateTipoCategoria(
      payload.tipo_usuario,
      payload.categoria_funcionario
    );
    if (validationMessage) {
      return res.status(400).json({ status: "error", message: validationMessage });
    }

    if (payload.email !== current.email) {
      const [existing] = await db.query(
        "SELECT id FROM usuarios WHERE email = ? AND id <> ?",
        [payload.email, req.params.id]
      );

      if (existing.length > 0) {
        return res.status(409).json({ status: "error", message: "Email ja cadastrado" });
      }
    }

    const categoriaFinal =
      payload.tipo_usuario === "admin" ? null : Number(payload.categoria_funcionario);

    const [result] = await db.query(
      "UPDATE usuarios SET nome = ?, email = ?, senha = ?, tipo_usuario = ?, categoria_funcionario = ?, ativo = ? WHERE id = ?",
      [
        payload.nome,
        payload.email,
        payload.senha,
        payload.tipo_usuario,
        categoriaFinal,
        payload.ativo,
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Usuario nao encontrado" });
    }

    return res.json({ status: "success", message: "Usuario atualizado" });
  } catch (error) {
    return handleError(res, error, "Erro ao atualizar usuario");
  }
};

export const deleteUsuario = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM usuarios WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Usuario nao encontrado" });
    }

    return res.json({ status: "success", message: "Usuario removido" });
  } catch (error) {
    return handleError(res, error, "Erro ao remover usuario");
  }
};
