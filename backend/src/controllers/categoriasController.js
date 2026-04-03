import { getConnection } from "../../connections.js";

const db = getConnection();

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

export const listCategorias = async (req, res) => {
  try {
    const { nome, ativo } = req.query;
    const ativoValue = parseAtivo(ativo);

    if (ativo !== undefined && ativoValue !== 0 && ativoValue !== 1) {
      return res.status(400).json({ status: "error", message: "Filtro ativo invalido" });
    }

    const filters = [];
    const params = [];

    if (nome) {
      filters.push("nome LIKE ?");
      params.push(`%${nome}%`);
    }

    if (ativoValue !== undefined) {
      filters.push("ativo = ?");
      params.push(ativoValue);
    }

    const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT id, nome, descricao, ativo, created_at, updated_at FROM categorias ${whereSql} ORDER BY id DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao listar categorias");
  }
};

export const getCategoria = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nome, descricao, ativo, created_at, updated_at FROM categorias WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Categoria nao encontrada" });
    }

    return res.json({ status: "success", data: rows[0] });
  } catch (error) {
    return handleError(res, error, "Erro ao buscar categoria");
  }
};

export const createCategoria = async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) {
      return res
        .status(400)
        .json({ status: "error", message: "Nome da categoria e obrigatorio" });
    }

    const descricao = req.body.descricao ?? null;
    const ativoValue = parseAtivo(req.body.ativo);

    if (ativoValue !== undefined && ativoValue !== 0 && ativoValue !== 1) {
      return res.status(400).json({ status: "error", message: "Campo ativo invalido" });
    }

    const [result] = await db.query(
      "INSERT INTO categorias (nome, descricao, ativo) VALUES (?, ?, ?)",
      [nome, descricao, ativoValue ?? 1]
    );

    return res.status(201).json({
      status: "success",
      message: "Categoria criada",
      data: { id: result.insertId },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao criar categoria");
  }
};

export const updateCategoria = async (req, res) => {
  try {
    const [currentRows] = await db.query("SELECT * FROM categorias WHERE id = ?", [
      req.params.id,
    ]);

    if (currentRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Categoria nao encontrada" });
    }

    const current = currentRows[0];
    const nome = req.body.nome ?? current.nome;
    const descricao = req.body.descricao ?? current.descricao;
    const ativoValue =
      req.body.ativo !== undefined ? parseAtivo(req.body.ativo) : current.ativo;

    if (!nome) {
      return res
        .status(400)
        .json({ status: "error", message: "Nome da categoria e obrigatorio" });
    }

    if (ativoValue !== 0 && ativoValue !== 1) {
      return res.status(400).json({ status: "error", message: "Campo ativo invalido" });
    }

    const [result] = await db.query(
      "UPDATE categorias SET nome = ?, descricao = ?, ativo = ? WHERE id = ?",
      [nome, descricao, ativoValue, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Categoria nao encontrada" });
    }

    return res.json({ status: "success", message: "Categoria atualizada" });
  } catch (error) {
    return handleError(res, error, "Erro ao atualizar categoria");
  }
};

export const deleteCategoria = async (req, res) => {
  try {
    const [result] = await db.query("UPDATE categorias SET ativo = 0 WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Categoria nao encontrada" });
    }

    return res.json({ status: "success", message: "Categoria inativada" });
  } catch (error) {
    return handleError(res, error, "Erro ao inativar categoria");
  }
};
