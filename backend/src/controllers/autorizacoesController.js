import { getConnection } from "../../connections.js";

const db = getConnection();
const VALID_TIPOS = ["desconto", "cancelamento"];
const VALID_STATUS = ["pendente", "aprovado", "negado"];

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

const isValidDateTime = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(value);

const isAdmin = (user) => user?.tipo_usuario === "admin";

export const listAutorizacoes = async (req, res) => {
  try {
    const {
      tipo,
      status,
      venda_id,
      item_vendido_id,
      solicitado_por,
      autorizado_por,
      data_de,
      data_ate,
    } = req.query;

    if (tipo && !VALID_TIPOS.includes(tipo)) {
      return res.status(400).json({ status: "error", message: "Tipo invalido" });
    }

    if (status && !VALID_STATUS.includes(status)) {
      return res.status(400).json({ status: "error", message: "Status invalido" });
    }

    if (data_de && !isValidDateTime(data_de)) {
      return res.status(400).json({ status: "error", message: "Data inicial invalida" });
    }

    if (data_ate && !isValidDateTime(data_ate)) {
      return res.status(400).json({ status: "error", message: "Data final invalida" });
    }

    const filters = [];
    const params = [];

    const vendaId = parseNumber(venda_id);
    if (venda_id !== undefined && vendaId === undefined) {
      return res.status(400).json({ status: "error", message: "Venda invalida" });
    }

    const itemId = parseNumber(item_vendido_id);
    if (item_vendido_id !== undefined && itemId === undefined) {
      return res.status(400).json({ status: "error", message: "Item invalido" });
    }

    const solicitadoPor = parseNumber(solicitado_por);
    if (solicitado_por !== undefined && solicitadoPor === undefined) {
      return res.status(400).json({ status: "error", message: "Solicitante invalido" });
    }

    const autorizadoPor = parseNumber(autorizado_por);
    if (autorizado_por !== undefined && autorizadoPor === undefined) {
      return res.status(400).json({ status: "error", message: "Autorizador invalido" });
    }

    if (tipo) {
      filters.push("a.tipo = ?");
      params.push(tipo);
    }

    if (status) {
      filters.push("a.status = ?");
      params.push(status);
    }

    if (vendaId !== undefined) {
      filters.push("a.venda_id = ?");
      params.push(vendaId);
    }

    if (itemId !== undefined) {
      filters.push("a.item_vendido_id = ?");
      params.push(itemId);
    }

    if (solicitadoPor !== undefined) {
      filters.push("a.solicitado_por = ?");
      params.push(solicitadoPor);
    }

    if (autorizadoPor !== undefined) {
      filters.push("a.autorizado_por = ?");
      params.push(autorizadoPor);
    }

    if (!isAdmin(req.user)) {
      filters.push("a.solicitado_por = ?");
      params.push(req.user.id);
    }

    if (data_de) {
      filters.push("a.created_at >= ?");
      params.push(data_de);
    }

    if (data_ate) {
      filters.push("a.created_at <= ?");
      params.push(data_ate);
    }

    const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT
        a.id,
        a.venda_id,
        a.item_vendido_id,
        a.tipo,
        a.solicitado_por,
        solicitante.nome AS solicitado_nome,
        a.autorizado_por,
        autorizador.nome AS autorizado_nome,
        a.motivo,
        a.valor_anterior,
        a.valor_novo,
        a.valor_alterado,
        a.status,
        a.autorizado_em,
        a.created_at,
        a.updated_at
      FROM autorizacoes_gerenciais a
      JOIN usuarios solicitante ON solicitante.id = a.solicitado_por
      LEFT JOIN usuarios autorizador ON autorizador.id = a.autorizado_por
      ${whereSql}
      ORDER BY a.id DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao listar autorizacoes");
  }
};

export const getAutorizacao = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        a.id,
        a.venda_id,
        a.item_vendido_id,
        a.tipo,
        a.solicitado_por,
        solicitante.nome AS solicitado_nome,
        a.autorizado_por,
        autorizador.nome AS autorizado_nome,
        a.motivo,
        a.valor_anterior,
        a.valor_novo,
        a.valor_alterado,
        a.status,
        a.autorizado_em,
        a.created_at,
        a.updated_at
      FROM autorizacoes_gerenciais a
      JOIN usuarios solicitante ON solicitante.id = a.solicitado_por
      LEFT JOIN usuarios autorizador ON autorizador.id = a.autorizado_por
      WHERE a.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Autorizacao nao encontrada" });
    }

    if (!isAdmin(req.user) && rows[0].solicitado_por !== req.user.id) {
      return res.status(403).json({ status: "error", message: "Acesso negado" });
    }

    return res.json({ status: "success", data: rows[0] });
  } catch (error) {
    return handleError(res, error, "Erro ao buscar autorizacao");
  }
};

export const createAutorizacao = async (req, res) => {
  try {
    const { venda_id, item_vendido_id, tipo, motivo, valor_novo } = req.body;

    if (!venda_id || !item_vendido_id || !tipo || !motivo) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    if (!VALID_TIPOS.includes(tipo)) {
      return res.status(400).json({ status: "error", message: "Tipo invalido" });
    }

    const vendaId = Number(venda_id);
    const itemId = Number(item_vendido_id);
    if (Number.isNaN(vendaId) || Number.isNaN(itemId)) {
      return res.status(400).json({ status: "error", message: "Venda ou item invalido" });
    }

    const [itemRows] = await db.query(
      "SELECT id, venda_id, quantidade, preco_venda_epoca FROM itens_vendidos WHERE id = ?",
      [itemId]
    );

    if (itemRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Item vendido nao encontrado" });
    }

    const item = itemRows[0];
    if (Number(item.venda_id) !== vendaId) {
      return res.status(400).json({ status: "error", message: "Item nao pertence a venda" });
    }

    const valorAnterior = Number(item.preco_venda_epoca) * Number(item.quantidade);
    let valorNovoTotal = 0;

    if (tipo === "desconto") {
      const valorNovoNumber = Number(valor_novo);
      if (Number.isNaN(valorNovoNumber) || valorNovoNumber <= 0) {
        return res.status(400).json({ status: "error", message: "Valor novo invalido" });
      }

      if (valorNovoNumber >= Number(item.preco_venda_epoca)) {
        return res
          .status(400)
          .json({ status: "error", message: "Desconto deve reduzir o preco" });
      }

      valorNovoTotal = valorNovoNumber * Number(item.quantidade);
    }

    if (tipo === "cancelamento") {
      valorNovoTotal = 0;
    }

    const valorAlterado = valorAnterior - valorNovoTotal;

    const [result] = await db.query(
      "INSERT INTO autorizacoes_gerenciais (venda_id, item_vendido_id, tipo, solicitado_por, motivo, valor_anterior, valor_novo, valor_alterado, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente')",
      [
        vendaId,
        itemId,
        tipo,
        req.user.id,
        motivo,
        valorAnterior,
        valorNovoTotal,
        valorAlterado,
      ]
    );

    return res.status(201).json({
      status: "success",
      message: "Solicitacao registrada",
      data: { id: result.insertId },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao criar solicitacao");
  }
};

export const approveAutorizacao = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, status FROM autorizacoes_gerenciais WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Autorizacao nao encontrada" });
    }

    if (rows[0].status !== "pendente") {
      return res
        .status(400)
        .json({ status: "error", message: "Autorizacao ja processada" });
    }

    await db.query(
      "UPDATE autorizacoes_gerenciais SET status = 'aprovado', autorizado_por = ?, autorizado_em = NOW() WHERE id = ?",
      [req.user.id, req.params.id]
    );

    return res.json({ status: "success", message: "Autorizacao aprovada" });
  } catch (error) {
    return handleError(res, error, "Erro ao aprovar autorizacao");
  }
};
