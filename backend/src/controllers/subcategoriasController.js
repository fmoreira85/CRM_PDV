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

const parseNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? undefined : numberValue;
};

export const listSubcategorias = async (req, res) => {
  try {
    const { nome, categoria_id, ativo } = req.query;

    const ativoValue = parseAtivo(ativo);
    if (ativo !== undefined && ativoValue !== 0 && ativoValue !== 1) {
      return res.status(400).json({ status: "error", message: "Filtro ativo invalido" });
    }

    const categoriaId = parseNumber(categoria_id);
    if (categoria_id !== undefined && categoriaId === undefined) {
      return res.status(400).json({ status: "error", message: "Categoria invalida" });
    }

    const filters = [];
    const params = [];

    if (nome) {
      filters.push("s.nome LIKE ?");
      params.push(`%${nome}%`);
    }

    if (categoriaId !== undefined) {
      filters.push("s.categoria_id = ?");
      params.push(categoriaId);
    }

    if (ativoValue !== undefined) {
      filters.push("s.ativo = ?");
      params.push(ativoValue);
    }

    const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT
        s.id,
        s.categoria_id,
        c.nome AS categoria_nome,
        s.nome,
        s.descricao,
        s.ativo,
        s.created_at,
        s.updated_at
      FROM subcategorias s
      JOIN categorias c ON c.id = s.categoria_id
      ${whereSql}
      ORDER BY s.id DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao listar subcategorias");
  }
};

export const getSubcategoria = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        s.id,
        s.categoria_id,
        c.nome AS categoria_nome,
        s.nome,
        s.descricao,
        s.ativo,
        s.created_at,
        s.updated_at
      FROM subcategorias s
      JOIN categorias c ON c.id = s.categoria_id
      WHERE s.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Subcategoria nao encontrada" });
    }

    return res.json({ status: "success", data: rows[0] });
  } catch (error) {
    return handleError(res, error, "Erro ao buscar subcategoria");
  }
};

export const createSubcategoria = async (req, res) => {
  try {
    const { nome, categoria_id } = req.body;
    if (!nome || !categoria_id) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    const categoriaId = Number(categoria_id);
    if (Number.isNaN(categoriaId)) {
      return res.status(400).json({ status: "error", message: "Categoria invalida" });
    }

    const descricao = req.body.descricao ?? null;
    const ativoValue = parseAtivo(req.body.ativo);

    if (ativoValue !== undefined && ativoValue !== 0 && ativoValue !== 1) {
      return res.status(400).json({ status: "error", message: "Campo ativo invalido" });
    }

    const [result] = await db.query(
      "INSERT INTO subcategorias (categoria_id, nome, descricao, ativo) VALUES (?, ?, ?, ?)",
      [categoriaId, nome, descricao, ativoValue ?? 1]
    );

    return res.status(201).json({
      status: "success",
      message: "Subcategoria criada",
      data: { id: result.insertId },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao criar subcategoria");
  }
};

export const updateSubcategoria = async (req, res) => {
  try {
    const [currentRows] = await db.query("SELECT * FROM subcategorias WHERE id = ?", [
      req.params.id,
    ]);

    if (currentRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Subcategoria nao encontrada" });
    }

    const current = currentRows[0];

    const nome = req.body.nome ?? current.nome;
    const categoriaId = req.body.categoria_id ?? current.categoria_id;
    const descricao = req.body.descricao ?? current.descricao;
    const ativoValue =
      req.body.ativo !== undefined ? parseAtivo(req.body.ativo) : current.ativo;

    if (!nome || !categoriaId) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    const categoriaNumber = Number(categoriaId);
    if (Number.isNaN(categoriaNumber)) {
      return res.status(400).json({ status: "error", message: "Categoria invalida" });
    }

    if (ativoValue !== 0 && ativoValue !== 1) {
      return res.status(400).json({ status: "error", message: "Campo ativo invalido" });
    }

    const [result] = await db.query(
      "UPDATE subcategorias SET categoria_id = ?, nome = ?, descricao = ?, ativo = ? WHERE id = ?",
      [categoriaNumber, nome, descricao, ativoValue, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Subcategoria nao encontrada" });
    }

    return res.json({ status: "success", message: "Subcategoria atualizada" });
  } catch (error) {
    return handleError(res, error, "Erro ao atualizar subcategoria");
  }
};

export const deleteSubcategoria = async (req, res) => {
  try {
    const [result] = await db.query(
      "UPDATE subcategorias SET ativo = 0 WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Subcategoria nao encontrada" });
    }

    return res.json({ status: "success", message: "Subcategoria inativada" });
  } catch (error) {
    return handleError(res, error, "Erro ao inativar subcategoria");
  }
};
