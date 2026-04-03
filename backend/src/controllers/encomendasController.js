import { getConnection } from "../../connections.js";

const db = getConnection();
const VALID_STATUS = ["aberta", "confirmada", "recebida", "cancelada"];

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

const ensureFornecedor = async (fornecedor_id) => {
  const [rows] = await db.query("SELECT id FROM fornecedores WHERE id = ?", [
    fornecedor_id,
  ]);
  return rows.length > 0;
};

const ensureProduto = async (produto_id) => {
  const [rows] = await db.query("SELECT id FROM produtos WHERE id = ?", [produto_id]);
  return rows.length > 0;
};

export const listEncomendas = async (req, res) => {
  try {
    const {
      fornecedor_id,
      produto_id,
      fornecedor,
      produto,
      status,
      proximos_prazo,
      dias_proximos,
      data_pedido_de,
      data_pedido_ate,
    } = req.query;

    const filters = [];
    const params = [];

    const fornecedorId = parseNumber(fornecedor_id);
    if (fornecedor_id !== undefined && fornecedorId === undefined) {
      return res.status(400).json({ status: "error", message: "Fornecedor invalido" });
    }

    const produtoId = parseNumber(produto_id);
    if (produto_id !== undefined && produtoId === undefined) {
      return res.status(400).json({ status: "error", message: "Produto invalido" });
    }

    if (status && !VALID_STATUS.includes(status)) {
      return res.status(400).json({ status: "error", message: "Status invalido" });
    }

    if (data_pedido_de && !isValidDate(data_pedido_de)) {
      return res.status(400).json({ status: "error", message: "Data inicial invalida" });
    }

    if (data_pedido_ate && !isValidDate(data_pedido_ate)) {
      return res.status(400).json({ status: "error", message: "Data final invalida" });
    }

    if (fornecedorId !== undefined) {
      filters.push("e.fornecedor_id = ?");
      params.push(fornecedorId);
    }

    if (produtoId !== undefined) {
      filters.push("e.produto_id = ?");
      params.push(produtoId);
    }

    if (fornecedor) {
      filters.push("f.nome LIKE ?");
      params.push(`%${fornecedor}%`);
    }

    if (produto) {
      filters.push("p.nome LIKE ?");
      params.push(`%${produto}%`);
    }

    if (status) {
      filters.push("e.status = ?");
      params.push(status);
    }

    if (data_pedido_de) {
      filters.push("e.data_pedido >= ?");
      params.push(data_pedido_de);
    }

    if (data_pedido_ate) {
      filters.push("e.data_pedido <= ?");
      params.push(data_pedido_ate);
    }

    if (proximos_prazo === "1" || proximos_prazo === "true") {
      const dias = parseNumber(dias_proximos) ?? 7;
      if (dias <= 0) {
        return res.status(400).json({ status: "error", message: "Dias invalido" });
      }
      filters.push(
        "e.prazo IS NOT NULL AND e.prazo BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)"
      );
      params.push(dias);
    }

    const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT
        e.id,
        e.fornecedor_id,
        f.nome AS fornecedor_nome,
        e.produto_id,
        p.nome AS produto_nome,
        e.quantidade,
        e.data_pedido,
        e.prazo,
        e.observacoes,
        e.status,
        CASE
          WHEN e.prazo IS NULL THEN NULL
          ELSE DATEDIFF(e.prazo, CURDATE())
        END AS dias_para_prazo,
        e.created_at,
        e.updated_at
      FROM encomendas e
      JOIN fornecedores f ON f.id = e.fornecedor_id
      JOIN produtos p ON p.id = e.produto_id
      ${whereSql}
      ORDER BY e.id DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao listar encomendas");
  }
};

export const getEncomenda = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        e.id,
        e.fornecedor_id,
        f.nome AS fornecedor_nome,
        e.produto_id,
        p.nome AS produto_nome,
        e.quantidade,
        e.data_pedido,
        e.prazo,
        e.observacoes,
        e.status,
        CASE
          WHEN e.prazo IS NULL THEN NULL
          ELSE DATEDIFF(e.prazo, CURDATE())
        END AS dias_para_prazo,
        e.created_at,
        e.updated_at
      FROM encomendas e
      JOIN fornecedores f ON f.id = e.fornecedor_id
      JOIN produtos p ON p.id = e.produto_id
      WHERE e.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Encomenda nao encontrada" });
    }

    return res.json({ status: "success", data: rows[0] });
  } catch (error) {
    return handleError(res, error, "Erro ao buscar encomenda");
  }
};

export const createEncomenda = async (req, res) => {
  try {
    const { fornecedor_id, produto_id, quantidade, data_pedido } = req.body;
    if (!fornecedor_id || !produto_id || !quantidade || !data_pedido) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    const fornecedorId = Number(fornecedor_id);
    const produtoId = Number(produto_id);
    if (Number.isNaN(fornecedorId) || Number.isNaN(produtoId)) {
      return res.status(400).json({ status: "error", message: "Fornecedor ou produto invalido" });
    }

    if (!isValidDate(data_pedido)) {
      return res.status(400).json({ status: "error", message: "Data do pedido invalida" });
    }

    const prazo = req.body.prazo ?? null;
    const observacoes = req.body.observacoes ?? null;
    const status = req.body.status ?? "aberta";

    if (prazo && !isValidDate(prazo)) {
      return res.status(400).json({ status: "error", message: "Prazo invalido" });
    }

    if (!VALID_STATUS.includes(status)) {
      return res.status(400).json({ status: "error", message: "Status invalido" });
    }

    const fornecedorExiste = await ensureFornecedor(fornecedorId);
    if (!fornecedorExiste) {
      return res.status(400).json({ status: "error", message: "Fornecedor invalido" });
    }

    const produtoExiste = await ensureProduto(produtoId);
    if (!produtoExiste) {
      return res.status(400).json({ status: "error", message: "Produto invalido" });
    }

    const [result] = await db.query(
      "INSERT INTO encomendas (fornecedor_id, produto_id, quantidade, data_pedido, prazo, observacoes, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [fornecedorId, produtoId, quantidade, data_pedido, prazo, observacoes, status]
    );

    return res.status(201).json({
      status: "success",
      message: "Encomenda criada",
      data: { id: result.insertId },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao criar encomenda");
  }
};

export const updateEncomenda = async (req, res) => {
  try {
    const [currentRows] = await db.query("SELECT * FROM encomendas WHERE id = ?", [
      req.params.id,
    ]);

    if (currentRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Encomenda nao encontrada" });
    }

    const current = currentRows[0];

    const payload = {
      fornecedor_id: req.body.fornecedor_id ?? current.fornecedor_id,
      produto_id: req.body.produto_id ?? current.produto_id,
      quantidade: req.body.quantidade ?? current.quantidade,
      data_pedido: req.body.data_pedido ?? current.data_pedido,
      prazo: req.body.prazo !== undefined ? req.body.prazo : current.prazo,
      observacoes: req.body.observacoes ?? current.observacoes,
      status: req.body.status ?? current.status,
    };

    if (!payload.fornecedor_id || !payload.produto_id || !payload.quantidade || !payload.data_pedido) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    const fornecedorId = Number(payload.fornecedor_id);
    const produtoId = Number(payload.produto_id);
    if (Number.isNaN(fornecedorId) || Number.isNaN(produtoId)) {
      return res.status(400).json({ status: "error", message: "Fornecedor ou produto invalido" });
    }

    if (!isValidDate(payload.data_pedido)) {
      return res.status(400).json({ status: "error", message: "Data do pedido invalida" });
    }

    if (payload.prazo && !isValidDate(payload.prazo)) {
      return res.status(400).json({ status: "error", message: "Prazo invalido" });
    }

    if (!VALID_STATUS.includes(payload.status)) {
      return res.status(400).json({ status: "error", message: "Status invalido" });
    }

    const fornecedorExiste = await ensureFornecedor(fornecedorId);
    if (!fornecedorExiste) {
      return res.status(400).json({ status: "error", message: "Fornecedor invalido" });
    }

    const produtoExiste = await ensureProduto(produtoId);
    if (!produtoExiste) {
      return res.status(400).json({ status: "error", message: "Produto invalido" });
    }

    const [result] = await db.query(
      "UPDATE encomendas SET fornecedor_id = ?, produto_id = ?, quantidade = ?, data_pedido = ?, prazo = ?, observacoes = ?, status = ? WHERE id = ?",
      [
        fornecedorId,
        produtoId,
        payload.quantidade,
        payload.data_pedido,
        payload.prazo,
        payload.observacoes,
        payload.status,
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Encomenda nao encontrada" });
    }

    return res.json({ status: "success", message: "Encomenda atualizada" });
  } catch (error) {
    return handleError(res, error, "Erro ao atualizar encomenda");
  }
};

export const deleteEncomenda = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM encomendas WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Encomenda nao encontrada" });
    }

    return res.json({ status: "success", message: "Encomenda removida" });
  } catch (error) {
    return handleError(res, error, "Erro ao remover encomenda");
  }
};
