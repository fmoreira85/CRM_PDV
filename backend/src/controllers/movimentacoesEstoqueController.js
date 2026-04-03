import { getConnection } from "../../connections.js";

const db = getConnection();

const TIPOS_MOVIMENTO = ["entrada", "saida"];
const MOTIVOS_SAIDA = [
  "venda",
  "perda_avaria",
  "consumo_proprio",
  "devolucao_fornecedor",
];
const MOTIVOS_ENTRADA = ["entrada_compra", "ajuste"];
const TODOS_MOTIVOS = [...MOTIVOS_SAIDA, ...MOTIVOS_ENTRADA];

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

const isValidDateTime = (value) => {
  if (!value) return false;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return true;
  if (typeof value === "string") {
    return /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(value);
  }
  return false;
};

const validateTipoMotivo = (tipo_movimento, motivo) => {
  if (!TIPOS_MOVIMENTO.includes(tipo_movimento)) {
    return "Tipo de movimentacao invalido";
  }

  if (!TODOS_MOTIVOS.includes(motivo)) {
    return "Motivo de movimentacao invalido";
  }

  if (tipo_movimento === "saida" && !MOTIVOS_SAIDA.includes(motivo)) {
    return "Motivo invalido para saida";
  }

  if (tipo_movimento === "entrada" && !MOTIVOS_ENTRADA.includes(motivo)) {
    return "Motivo invalido para entrada";
  }

  return null;
};

const resolveEstoque = async (connection, { estoque_id, produto_id, lote }) => {
  if (estoque_id) {
    const [rows] = await connection.query(
      "SELECT id, produto_id, lote, quantidade_atual FROM estoque WHERE id = ?",
      [estoque_id]
    );

    if (rows.length === 0) {
      return { error: "Lote de estoque nao encontrado" };
    }

    const estoque = rows[0];
    if (produto_id && Number(produto_id) !== Number(estoque.produto_id)) {
      return { error: "Produto nao corresponde ao lote informado" };
    }

    return { estoque };
  }

  if (!produto_id || !lote) {
    return { error: "Produto e lote sao obrigatorios" };
  }

  const [rows] = await connection.query(
    "SELECT id, produto_id, lote, quantidade_atual FROM estoque WHERE produto_id = ? AND lote = ?",
    [produto_id, lote]
  );

  if (rows.length === 0) {
    return { error: "Lote nao encontrado para o produto informado" };
  }

  return { estoque: rows[0] };
};

const buildFilters = (query) => {
  const {
    produto_id,
    estoque_id,
    usuario_id,
    tipo_movimento,
    motivo,
    data_de,
    data_ate,
    lote,
  } = query;

  const filters = [];
  const params = [];

  const produtoId = parseNumber(produto_id);
  if (produto_id !== undefined && produtoId === undefined) {
    return { error: "Produto invalido" };
  }

  const estoqueId = parseNumber(estoque_id);
  if (estoque_id !== undefined && estoqueId === undefined) {
    return { error: "Estoque invalido" };
  }

  const usuarioId = parseNumber(usuario_id);
  if (usuario_id !== undefined && usuarioId === undefined) {
    return { error: "Usuario invalido" };
  }

  if (tipo_movimento && !TIPOS_MOVIMENTO.includes(tipo_movimento)) {
    return { error: "Tipo de movimentacao invalido" };
  }

  if (motivo && !TODOS_MOTIVOS.includes(motivo)) {
    return { error: "Motivo de movimentacao invalido" };
  }

  if (data_de && !isValidDateTime(data_de)) {
    return { error: "Data inicial invalida" };
  }

  if (data_ate && !isValidDateTime(data_ate)) {
    return { error: "Data final invalida" };
  }

  if (produtoId !== undefined) {
    filters.push("me.produto_id = ?");
    params.push(produtoId);
  }

  if (estoqueId !== undefined) {
    filters.push("me.estoque_id = ?");
    params.push(estoqueId);
  }

  if (usuarioId !== undefined) {
    filters.push("me.usuario_id = ?");
    params.push(usuarioId);
  }

  if (tipo_movimento) {
    filters.push("me.tipo_movimento = ?");
    params.push(tipo_movimento);
  }

  if (motivo) {
    filters.push("me.motivo = ?");
    params.push(motivo);
  }

  if (lote) {
    filters.push("e.lote LIKE ?");
    params.push(`%${lote}%`);
  }

  if (data_de) {
    filters.push("me.data_movimentacao >= ?");
    params.push(data_de);
  }

  if (data_ate) {
    filters.push("me.data_movimentacao <= ?");
    params.push(data_ate);
  }

  return {
    whereSql: filters.length ? `WHERE ${filters.join(" AND ")}` : "",
    params,
  };
};

export const listMovimentacoesEstoque = async (req, res) => {
  try {
    const filterResult = buildFilters(req.query);
    if (filterResult.error) {
      return res.status(400).json({ status: "error", message: filterResult.error });
    }

    const { whereSql, params } = filterResult;

    const [rows] = await db.query(
      `SELECT
        me.id,
        me.produto_id,
        p.nome AS produto_nome,
        me.estoque_id,
        e.lote,
        e.validade,
        me.usuario_id,
        u.nome AS usuario_nome,
        me.tipo_movimento,
        me.motivo,
        me.quantidade,
        me.data_movimentacao,
        me.created_at,
        me.updated_at
      FROM movimentacoes_estoque me
      JOIN produtos p ON p.id = me.produto_id
      JOIN estoque e ON e.id = me.estoque_id
      JOIN usuarios u ON u.id = me.usuario_id
      ${whereSql}
      ORDER BY me.id DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao listar movimentacoes de estoque");
  }
};

export const listDescarte = async (req, res) => {
  try {
    const filterResult = buildFilters(req.query);
    if (filterResult.error) {
      return res.status(400).json({ status: "error", message: filterResult.error });
    }

    const { whereSql, params } = filterResult;
    const extraFilter = whereSql ? `${whereSql} AND` : "WHERE";

    const [rows] = await db.query(
      `SELECT
        me.id,
        me.produto_id,
        p.nome AS produto_nome,
        me.estoque_id,
        e.lote,
        e.validade,
        me.usuario_id,
        u.nome AS usuario_nome,
        me.quantidade,
        me.data_movimentacao,
        me.created_at
      FROM movimentacoes_estoque me
      JOIN produtos p ON p.id = me.produto_id
      JOIN estoque e ON e.id = me.estoque_id
      JOIN usuarios u ON u.id = me.usuario_id
      ${extraFilter} me.tipo_movimento = 'saida' AND me.motivo = 'perda_avaria'
      ORDER BY me.data_movimentacao DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao listar descartes");
  }
};

export const listConferencia = async (req, res) => {
  try {
    const filterResult = buildFilters(req.query);
    if (filterResult.error) {
      return res.status(400).json({ status: "error", message: filterResult.error });
    }

    const { whereSql, params } = filterResult;
    const extraFilter = whereSql ? `${whereSql} AND` : "WHERE";

    const [rows] = await db.query(
      `SELECT
        me.id,
        me.produto_id,
        p.nome AS produto_nome,
        me.estoque_id,
        e.lote,
        e.validade,
        me.usuario_id,
        u.nome AS usuario_nome,
        me.tipo_movimento,
        me.quantidade,
        me.data_movimentacao,
        me.created_at
      FROM movimentacoes_estoque me
      JOIN produtos p ON p.id = me.produto_id
      JOIN estoque e ON e.id = me.estoque_id
      JOIN usuarios u ON u.id = me.usuario_id
      ${extraFilter} me.motivo = 'ajuste'
      ORDER BY me.data_movimentacao DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao listar conferencia de estoque");
  }
};

export const getMovimentacaoEstoque = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        me.id,
        me.produto_id,
        p.nome AS produto_nome,
        me.estoque_id,
        e.lote,
        e.validade,
        me.usuario_id,
        u.nome AS usuario_nome,
        me.tipo_movimento,
        me.motivo,
        me.quantidade,
        me.data_movimentacao,
        me.created_at,
        me.updated_at
      FROM movimentacoes_estoque me
      JOIN produtos p ON p.id = me.produto_id
      JOIN estoque e ON e.id = me.estoque_id
      JOIN usuarios u ON u.id = me.usuario_id
      WHERE me.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Movimentacao nao encontrada" });
    }

    return res.json({ status: "success", data: rows[0] });
  } catch (error) {
    return handleError(res, error, "Erro ao buscar movimentacao");
  }
};

export const createMovimentacaoEstoque = async (req, res) => {
  let connection;
  try {
    const {
      produto_id,
      estoque_id,
      lote,
      usuario_id,
      tipo_movimento,
      motivo,
      quantidade,
      data_movimentacao,
    } = req.body;

    if (!usuario_id || !tipo_movimento || !motivo || !quantidade) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    const quantidadeNumber = Number(quantidade);
    if (Number.isNaN(quantidadeNumber) || quantidadeNumber <= 0) {
      return res.status(400).json({ status: "error", message: "Quantidade invalida" });
    }

    const validationMessage = validateTipoMotivo(tipo_movimento, motivo);
    if (validationMessage) {
      return res.status(400).json({ status: "error", message: validationMessage });
    }

    if (data_movimentacao && !isValidDateTime(data_movimentacao)) {
      return res.status(400).json({ status: "error", message: "Data invalida" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const { estoque, error } = await resolveEstoque(connection, {
      estoque_id,
      produto_id,
      lote,
    });

    if (error) {
      await connection.rollback();
      return res.status(400).json({ status: "error", message: error });
    }

    const [[estoqueRow]] = await connection.query(
      "SELECT quantidade_atual FROM estoque WHERE id = ? FOR UPDATE",
      [estoque.id]
    );

    const delta = tipo_movimento === "entrada" ? quantidadeNumber : -quantidadeNumber;
    const novaQuantidade = Number(estoqueRow.quantidade_atual) + delta;

    if (novaQuantidade < 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ status: "error", message: "Quantidade insuficiente em estoque" });
    }

    await connection.query("UPDATE estoque SET quantidade_atual = ? WHERE id = ?", [
      novaQuantidade,
      estoque.id,
    ]);

    const [result] = await connection.query(
      "INSERT INTO movimentacoes_estoque (produto_id, estoque_id, usuario_id, tipo_movimento, motivo, quantidade, data_movimentacao) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        estoque.produto_id,
        estoque.id,
        usuario_id,
        tipo_movimento,
        motivo,
        quantidadeNumber,
        data_movimentacao ?? new Date(),
      ]
    );

    await connection.commit();

    return res.status(201).json({
      status: "success",
      message: "Movimentacao criada",
      data: { id: result.insertId },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    return handleError(res, error, "Erro ao criar movimentacao");
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const updateMovimentacaoEstoque = async (req, res) => {
  let connection;
  try {
    const [currentRows] = await db.query(
      "SELECT * FROM movimentacoes_estoque WHERE id = ?",
      [req.params.id]
    );

    if (currentRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Movimentacao nao encontrada" });
    }

    const current = currentRows[0];

    if (
      (req.body.produto_id !== undefined &&
        Number(req.body.produto_id) !== Number(current.produto_id)) ||
      (req.body.estoque_id !== undefined &&
        Number(req.body.estoque_id) !== Number(current.estoque_id)) ||
      req.body.lote !== undefined
    ) {
      return res.status(400).json({
        status: "error",
        message: "Nao e permitido alterar produto ou lote da movimentacao",
      });
    }

    const payload = {
      usuario_id: req.body.usuario_id ?? current.usuario_id,
      tipo_movimento: req.body.tipo_movimento ?? current.tipo_movimento,
      motivo: req.body.motivo ?? current.motivo,
      quantidade: req.body.quantidade ?? current.quantidade,
      data_movimentacao: req.body.data_movimentacao ?? current.data_movimentacao,
    };

    if (!payload.usuario_id || !payload.tipo_movimento || !payload.motivo || !payload.quantidade) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    const quantidadeNumber = Number(payload.quantidade);
    if (Number.isNaN(quantidadeNumber) || quantidadeNumber <= 0) {
      return res.status(400).json({ status: "error", message: "Quantidade invalida" });
    }

    const validationMessage = validateTipoMotivo(payload.tipo_movimento, payload.motivo);
    if (validationMessage) {
      return res.status(400).json({ status: "error", message: validationMessage });
    }

    if (payload.data_movimentacao && !isValidDateTime(payload.data_movimentacao)) {
      return res.status(400).json({ status: "error", message: "Data invalida" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [[estoqueRow]] = await connection.query(
      "SELECT quantidade_atual FROM estoque WHERE id = ? FOR UPDATE",
      [current.estoque_id]
    );

    let novaQuantidade = Number(estoqueRow.quantidade_atual);
    const deltaReverso =
      current.tipo_movimento === "entrada" ? -Number(current.quantidade) : Number(current.quantidade);
    novaQuantidade += deltaReverso;

    if (novaQuantidade < 0) {
      await connection.rollback();
      return res.status(400).json({ status: "error", message: "Estoque insuficiente" });
    }

    const deltaNovo =
      payload.tipo_movimento === "entrada" ? quantidadeNumber : -quantidadeNumber;
    novaQuantidade += deltaNovo;

    if (novaQuantidade < 0) {
      await connection.rollback();
      return res.status(400).json({ status: "error", message: "Estoque insuficiente" });
    }

    await connection.query("UPDATE estoque SET quantidade_atual = ? WHERE id = ?", [
      novaQuantidade,
      current.estoque_id,
    ]);

    await connection.query(
      "UPDATE movimentacoes_estoque SET usuario_id = ?, tipo_movimento = ?, motivo = ?, quantidade = ?, data_movimentacao = ? WHERE id = ?",
      [
        payload.usuario_id,
        payload.tipo_movimento,
        payload.motivo,
        quantidadeNumber,
        payload.data_movimentacao,
        req.params.id,
      ]
    );

    await connection.commit();

    return res.json({ status: "success", message: "Movimentacao atualizada" });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    return handleError(res, error, "Erro ao atualizar movimentacao");
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const deleteMovimentacaoEstoque = async (req, res) => {
  let connection;
  try {
    const [currentRows] = await db.query(
      "SELECT * FROM movimentacoes_estoque WHERE id = ?",
      [req.params.id]
    );

    if (currentRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Movimentacao nao encontrada" });
    }

    const current = currentRows[0];

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [[estoqueRow]] = await connection.query(
      "SELECT quantidade_atual FROM estoque WHERE id = ? FOR UPDATE",
      [current.estoque_id]
    );

    let novaQuantidade = Number(estoqueRow.quantidade_atual);
    const deltaReverso =
      current.tipo_movimento === "entrada" ? -Number(current.quantidade) : Number(current.quantidade);
    novaQuantidade += deltaReverso;

    if (novaQuantidade < 0) {
      await connection.rollback();
      return res.status(400).json({ status: "error", message: "Estoque insuficiente" });
    }

    await connection.query("UPDATE estoque SET quantidade_atual = ? WHERE id = ?", [
      novaQuantidade,
      current.estoque_id,
    ]);

    await connection.query("DELETE FROM movimentacoes_estoque WHERE id = ?", [
      req.params.id,
    ]);

    await connection.commit();

    return res.json({ status: "success", message: "Movimentacao removida" });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    return handleError(res, error, "Erro ao remover movimentacao");
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
