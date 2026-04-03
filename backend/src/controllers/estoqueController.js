import { getConnection } from "../../connections.js";

const db = getConnection();

const handleError = (res, error, message) => {
  console.error(error);
  return res.status(500).json({ status: "error", message });
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? undefined : numberValue;
};

const isValidDate = (value) =>
  value === null || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value));

const validateQuantidade = (value) => {
  if (value === undefined || value === null) return true;
  const numeric = Number(value);
  return !Number.isNaN(numeric) && numeric >= 0;
};

export const listEstoque = async (req, res) => {
  try {
    const { produto_id, lote, validade_de, validade_ate, abaixo_ideal } = req.query;

    const produtoId = parseNumber(produto_id);
    if (produto_id !== undefined && produtoId === undefined) {
      return res.status(400).json({ status: "error", message: "Produto invalido" });
    }

    if (validade_de && !isValidDate(validade_de)) {
      return res.status(400).json({ status: "error", message: "Data inicial invalida" });
    }

    if (validade_ate && !isValidDate(validade_ate)) {
      return res.status(400).json({ status: "error", message: "Data final invalida" });
    }

    const filters = [];
    const params = [];

    if (produtoId !== undefined) {
      filters.push("e.produto_id = ?");
      params.push(produtoId);
    }

    if (lote) {
      filters.push("e.lote LIKE ?");
      params.push(`%${lote}%`);
    }

    if (validade_de) {
      filters.push("e.validade >= ?");
      params.push(validade_de);
    }

    if (validade_ate) {
      filters.push("e.validade <= ?");
      params.push(validade_ate);
    }

    if (abaixo_ideal === "1" || abaixo_ideal === "true") {
      filters.push("e.quantidade_atual <= e.nivel_ideal");
    }

    const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT
        e.id,
        e.produto_id,
        p.nome AS produto_nome,
        e.lote,
        e.validade,
        e.quantidade_atual,
        e.nivel_ideal,
        CASE
          WHEN e.validade IS NULL THEN NULL
          ELSE DATEDIFF(e.validade, CURDATE())
        END AS dias_para_vencimento,
        e.created_at,
        e.updated_at
      FROM estoque e
      JOIN produtos p ON p.id = e.produto_id
      ${whereSql}
      ORDER BY e.id DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao listar estoque");
  }
};

export const listBaixoEstoque = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        p.id AS produto_id,
        p.nome AS produto_nome,
        p.categoria_id,
        p.subcategoria_id,
        SUM(e.quantidade_atual) AS quantidade_total,
        SUM(e.nivel_ideal) AS nivel_ideal_total,
        (SUM(e.nivel_ideal) - SUM(e.quantidade_atual)) AS quantidade_falta
      FROM estoque e
      JOIN produtos p ON p.id = e.produto_id
      GROUP BY p.id
      HAVING SUM(e.quantidade_atual) <= SUM(e.nivel_ideal)
      ORDER BY quantidade_falta DESC`
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao listar produtos abaixo do ideal");
  }
};

export const listVencimentosProximos = async (req, res) => {
  try {
    const dias = parseNumber(req.query.dias) ?? 7;
    if (dias <= 0) {
      return res.status(400).json({ status: "error", message: "Dias invalido" });
    }

    const [rows] = await db.query(
      `SELECT
        e.id,
        e.produto_id,
        p.nome AS produto_nome,
        e.lote,
        e.validade,
        e.quantidade_atual,
        e.nivel_ideal,
        DATEDIFF(e.validade, CURDATE()) AS dias_para_vencimento,
        e.created_at,
        e.updated_at
      FROM estoque e
      JOIN produtos p ON p.id = e.produto_id
      WHERE e.validade IS NOT NULL
        AND e.validade BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY e.validade ASC`,
      [dias]
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao listar vencimentos proximos");
  }
};

export const getEstoque = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        e.id,
        e.produto_id,
        p.nome AS produto_nome,
        e.lote,
        e.validade,
        e.quantidade_atual,
        e.nivel_ideal,
        CASE
          WHEN e.validade IS NULL THEN NULL
          ELSE DATEDIFF(e.validade, CURDATE())
        END AS dias_para_vencimento,
        e.created_at,
        e.updated_at
      FROM estoque e
      JOIN produtos p ON p.id = e.produto_id
      WHERE e.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Registro de estoque nao encontrado" });
    }

    return res.json({ status: "success", data: rows[0] });
  } catch (error) {
    return handleError(res, error, "Erro ao buscar estoque");
  }
};

export const createEstoque = async (req, res) => {
  try {
    const { produto_id, lote } = req.body;
    if (!produto_id || !lote) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    const produtoId = Number(produto_id);
    if (Number.isNaN(produtoId)) {
      return res.status(400).json({ status: "error", message: "Produto invalido" });
    }

    const validade = req.body.validade ?? null;
    if (!isValidDate(validade)) {
      return res.status(400).json({ status: "error", message: "Data de validade invalida" });
    }

    const quantidade_atual = req.body.quantidade_atual ?? 0;
    const nivel_ideal = req.body.nivel_ideal ?? 0;

    if (!validateQuantidade(quantidade_atual) || !validateQuantidade(nivel_ideal)) {
      return res.status(400).json({ status: "error", message: "Quantidade invalida" });
    }

    const [existing] = await db.query(
      "SELECT id FROM estoque WHERE produto_id = ? AND lote = ?",
      [produtoId, lote]
    );

    if (existing.length > 0) {
      return res.status(409).json({ status: "error", message: "Lote ja cadastrado para este produto" });
    }

    const [result] = await db.query(
      "INSERT INTO estoque (produto_id, lote, validade, quantidade_atual, nivel_ideal) VALUES (?, ?, ?, ?, ?)",
      [produtoId, lote, validade, quantidade_atual, nivel_ideal]
    );

    return res.status(201).json({
      status: "success",
      message: "Estoque criado",
      data: { id: result.insertId },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao criar estoque");
  }
};

export const updateEstoque = async (req, res) => {
  try {
    const [currentRows] = await db.query("SELECT * FROM estoque WHERE id = ?", [
      req.params.id,
    ]);

    if (currentRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Registro de estoque nao encontrado" });
    }

    const current = currentRows[0];

    const payload = {
      produto_id: req.body.produto_id ?? current.produto_id,
      lote: req.body.lote ?? current.lote,
      validade:
        req.body.validade !== undefined ? req.body.validade : current.validade,
      quantidade_atual:
        req.body.quantidade_atual !== undefined
          ? req.body.quantidade_atual
          : current.quantidade_atual,
      nivel_ideal:
        req.body.nivel_ideal !== undefined ? req.body.nivel_ideal : current.nivel_ideal,
    };

    const produtoId = Number(payload.produto_id);
    if (Number.isNaN(produtoId)) {
      return res.status(400).json({ status: "error", message: "Produto invalido" });
    }

    if (!payload.lote) {
      return res.status(400).json({ status: "error", message: "Lote e obrigatorio" });
    }

    if (!isValidDate(payload.validade)) {
      return res.status(400).json({ status: "error", message: "Data de validade invalida" });
    }

    if (!validateQuantidade(payload.quantidade_atual) || !validateQuantidade(payload.nivel_ideal)) {
      return res.status(400).json({ status: "error", message: "Quantidade invalida" });
    }

    const [duplicate] = await db.query(
      "SELECT id FROM estoque WHERE produto_id = ? AND lote = ? AND id <> ?",
      [produtoId, payload.lote, req.params.id]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({ status: "error", message: "Lote ja cadastrado para este produto" });
    }

    const [result] = await db.query(
      "UPDATE estoque SET produto_id = ?, lote = ?, validade = ?, quantidade_atual = ?, nivel_ideal = ? WHERE id = ?",
      [
        produtoId,
        payload.lote,
        payload.validade,
        payload.quantidade_atual,
        payload.nivel_ideal,
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Registro de estoque nao encontrado" });
    }

    return res.json({ status: "success", message: "Estoque atualizado" });
  } catch (error) {
    return handleError(res, error, "Erro ao atualizar estoque");
  }
};

export const deleteEstoque = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM estoque WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Registro de estoque nao encontrado" });
    }

    return res.json({ status: "success", message: "Estoque removido" });
  } catch (error) {
    return handleError(res, error, "Erro ao remover estoque");
  }
};
