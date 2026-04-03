import { getConnection } from "../../connections.js";
import {
  applyEntradaEstoque,
  applySaidaEstoque,
  getCliente,
  getFormaPagamento,
  getProduto,
} from "../utils/estoqueMovimentacao.js";

const db = getConnection();
const VALID_STATUS = ["aberta", "concluida", "cancelada"];
const VALID_STATUS_PAGAMENTO = ["pago", "pendente", "inadimplente"];

const isCategoria1 = (req) =>
  req.user?.tipo_usuario === "funcionario" && Number(req.user?.categoria_funcionario) === 1;

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

const buildVendaFilters = (query) => {
  const {
    cliente_id,
    usuario_id,
    forma_pagamento_id,
    status,
    status_pagamento,
    data_de,
    data_ate,
  } = query;

  const filters = [];
  const params = [];

  const clienteId = parseNumber(cliente_id);
  if (cliente_id !== undefined && clienteId === undefined) {
    return { error: "Cliente invalido" };
  }

  const usuarioId = parseNumber(usuario_id);
  if (usuario_id !== undefined && usuarioId === undefined) {
    return { error: "Usuario invalido" };
  }

  const formaId = parseNumber(forma_pagamento_id);
  if (forma_pagamento_id !== undefined && formaId === undefined) {
    return { error: "Forma de pagamento invalida" };
  }

  if (status && !VALID_STATUS.includes(status)) {
    return { error: "Status invalido" };
  }

  if (status_pagamento && !VALID_STATUS_PAGAMENTO.includes(status_pagamento)) {
    return { error: "Status de pagamento invalido" };
  }

  if (data_de && !isValidDateTime(data_de)) {
    return { error: "Data inicial invalida" };
  }

  if (data_ate && !isValidDateTime(data_ate)) {
    return { error: "Data final invalida" };
  }

  if (clienteId !== undefined) {
    filters.push("v.cliente_id = ?");
    params.push(clienteId);
  }

  if (usuarioId !== undefined) {
    filters.push("v.usuario_id = ?");
    params.push(usuarioId);
  }

  if (formaId !== undefined) {
    filters.push("v.forma_pagamento_id = ?");
    params.push(formaId);
  }

  if (status) {
    filters.push("v.status = ?");
    params.push(status);
  }

  if (status_pagamento) {
    filters.push("v.status_pagamento = ?");
    params.push(status_pagamento);
  }

  if (data_de) {
    filters.push("v.created_at >= ?");
    params.push(data_de);
  }

  if (data_ate) {
    filters.push("v.created_at <= ?");
    params.push(data_ate);
  }

  return {
    whereSql: filters.length ? `WHERE ${filters.join(" AND ")}` : "",
    params,
  };
};

const resolveUsuarioId = (req, fallbackId) =>
  req.user?.id ?? req.body.usuario_id ?? fallbackId;

export const listVendas = async (req, res) => {
  try {
    const filterResult = buildVendaFilters(req.query);
    if (filterResult.error) {
      return res.status(400).json({ status: "error", message: filterResult.error });
    }

    const { whereSql, params } = filterResult;

    const [rows] = await db.query(
      `SELECT
        v.id,
        v.cliente_id,
        c.nome AS cliente_nome,
        v.usuario_id,
        u.nome AS usuario_nome,
        v.forma_pagamento_id,
        f.nome AS forma_pagamento_nome,
        v.valor_total,
        v.status,
        v.status_pagamento,
        v.data_vencimento,
        v.created_at,
        v.updated_at
      FROM vendas v
      JOIN clientes c ON c.id = v.cliente_id
      JOIN usuarios u ON u.id = v.usuario_id
      JOIN formas_pagamento f ON f.id = v.forma_pagamento_id
      ${whereSql}
      ORDER BY v.id DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao listar vendas");
  }
};

export const getVenda = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        v.id,
        v.cliente_id,
        c.nome AS cliente_nome,
        v.usuario_id,
        u.nome AS usuario_nome,
        v.forma_pagamento_id,
        f.nome AS forma_pagamento_nome,
        v.valor_total,
        v.status,
        v.status_pagamento,
        v.data_vencimento,
        v.created_at,
        v.updated_at
      FROM vendas v
      JOIN clientes c ON c.id = v.cliente_id
      JOIN usuarios u ON u.id = v.usuario_id
      JOIN formas_pagamento f ON f.id = v.forma_pagamento_id
      WHERE v.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Venda nao encontrada" });
    }

    const [itens] = await db.query(
      `SELECT
        iv.id,
        iv.venda_id,
        iv.produto_id,
        p.nome AS produto_nome,
        iv.quantidade,
        iv.preco_venda_epoca,
        iv.preco_custo_epoca,
        iv.created_at
      FROM itens_vendidos iv
      JOIN produtos p ON p.id = iv.produto_id
      WHERE iv.venda_id = ?
      ORDER BY iv.id ASC`,
      [req.params.id]
    );

    return res.json({
      status: "success",
      data: {
        venda: rows[0],
        itens,
      },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao buscar venda");
  }
};

export const createVenda = async (req, res) => {
  let connection;
  try {
    const { cliente_id, forma_pagamento_id, status, data, data_vencimento } = req.body;
    const usuario_id = resolveUsuarioId(req);
    const itens = Array.isArray(req.body.itens) ? req.body.itens : [];

    if (!cliente_id || !usuario_id || !forma_pagamento_id) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    if (itens.length === 0) {
      return res.status(400).json({ status: "error", message: "Itens da venda obrigatorios" });
    }

    if (status && !VALID_STATUS.includes(status)) {
      return res.status(400).json({ status: "error", message: "Status invalido" });
    }

    if (data && !isValidDateTime(data)) {
      return res.status(400).json({ status: "error", message: "Data invalida" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const { error: clienteError } = await getCliente(connection, cliente_id);
    if (clienteError) {
      await connection.rollback();
      return res.status(400).json({ status: "error", message: clienteError });
    }

    const { forma, error: formaError } = await getFormaPagamento(
      connection,
      forma_pagamento_id
    );
    if (formaError) {
      await connection.rollback();
      return res.status(400).json({ status: "error", message: formaError });
    }

    const isFiado = forma.nome?.toLowerCase().includes("fiado");
    const status_pagamento = isFiado
      ? "pendente"
      : req.body.status_pagamento ?? "pago";

    if (!VALID_STATUS_PAGAMENTO.includes(status_pagamento)) {
      await connection.rollback();
      return res
        .status(400)
        .json({ status: "error", message: "Status de pagamento invalido" });
    }

    const itensPreparados = [];
    let valorTotal = 0;

    for (const item of itens) {
      const produtoId = parseNumber(item.produto_id);
      const quantidade = Number(item.quantidade);

      if (!produtoId || Number.isNaN(quantidade) || quantidade <= 0) {
        await connection.rollback();
        return res
          .status(400)
          .json({ status: "error", message: "Item de venda invalido" });
      }

      const { produto, error: produtoError } = await getProduto(connection, produtoId);
      if (produtoError) {
        await connection.rollback();
        return res.status(400).json({ status: "error", message: produtoError });
      }

      const precoVenda =
        item.preco_venda_epoca !== undefined
          ? Number(item.preco_venda_epoca)
          : Number(produto.preco_venda_atual);
      const precoCusto =
        item.preco_custo_epoca !== undefined
          ? Number(item.preco_custo_epoca)
          : Number(produto.preco_custo_atual);

      if (Number.isNaN(precoVenda) || Number.isNaN(precoCusto)) {
        await connection.rollback();
        return res
          .status(400)
          .json({ status: "error", message: "Preco do item invalido" });
      }

      if (isCategoria1(req) && precoVenda < Number(produto.preco_venda_atual)) {
        await connection.rollback();
        return res.status(403).json({
          status: "error",
          message: "Desconto requer autorizacao gerencial",
        });
      }

      valorTotal += precoVenda * quantidade;
      itensPreparados.push({
        produto_id: produtoId,
        quantidade,
        preco_venda_epoca: precoVenda,
        preco_custo_epoca: precoCusto,
      });
    }

    for (const item of itensPreparados) {
      const saidaResult = await applySaidaEstoque(connection, {
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        usuario_id,
        motivo: "venda",
        data_movimentacao: data ?? new Date(),
      });

      if (saidaResult.error) {
        await connection.rollback();
        return res.status(400).json({ status: "error", message: saidaResult.error });
      }
    }

    const columns = [
      "cliente_id",
      "usuario_id",
      "forma_pagamento_id",
      "valor_total",
      "status",
      "status_pagamento",
      "data_vencimento",
    ];
    const values = [
      cliente_id,
      usuario_id,
      forma_pagamento_id,
      valorTotal,
      status ?? "aberta",
      status_pagamento,
      data_vencimento ?? null,
    ];

    if (data) {
      columns.push("created_at");
      values.push(data);
    }

    const placeholders = columns.map(() => "?").join(", ");

    const [result] = await connection.query(
      `INSERT INTO vendas (${columns.join(", ")}) VALUES (${placeholders})`,
      values
    );

    for (const item of itensPreparados) {
      await connection.query(
        "INSERT INTO itens_vendidos (venda_id, produto_id, quantidade, preco_venda_epoca, preco_custo_epoca) VALUES (?, ?, ?, ?, ?)",
        [
          result.insertId,
          item.produto_id,
          item.quantidade,
          item.preco_venda_epoca,
          item.preco_custo_epoca,
        ]
      );
    }

    await connection.commit();

    return res.status(201).json({
      status: "success",
      message: "Venda criada",
      data: { id: result.insertId, valor_total: valorTotal },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    return handleError(res, error, "Erro ao criar venda");
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const updateVenda = async (req, res) => {
  try {
    const [currentRows] = await db.query("SELECT * FROM vendas WHERE id = ?", [
      req.params.id,
    ]);

    if (currentRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Venda nao encontrada" });
    }

    const current = currentRows[0];

    const payload = {
      cliente_id: req.body.cliente_id ?? current.cliente_id,
      usuario_id: current.usuario_id,
      forma_pagamento_id: req.body.forma_pagamento_id ?? current.forma_pagamento_id,
      status: req.body.status ?? current.status,
      status_pagamento: req.body.status_pagamento ?? current.status_pagamento,
      data_vencimento:
        req.body.data_vencimento !== undefined
          ? req.body.data_vencimento
          : current.data_vencimento,
    };

    if (!VALID_STATUS.includes(payload.status)) {
      return res.status(400).json({ status: "error", message: "Status invalido" });
    }

    if (!VALID_STATUS_PAGAMENTO.includes(payload.status_pagamento)) {
      return res
        .status(400)
        .json({ status: "error", message: "Status de pagamento invalido" });
    }

    if (!payload.cliente_id || !payload.forma_pagamento_id) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    const { error: clienteError } = await getCliente(db, payload.cliente_id);
    if (clienteError) {
      return res.status(400).json({ status: "error", message: clienteError });
    }

    const { forma, error: formaError } = await getFormaPagamento(
      db,
      payload.forma_pagamento_id
    );
    if (formaError) {
      return res.status(400).json({ status: "error", message: formaError });
    }

    const isFiado = forma.nome?.toLowerCase().includes("fiado");
    if (isFiado) {
      payload.status_pagamento = "pendente";
    }

    const [result] = await db.query(
      "UPDATE vendas SET cliente_id = ?, forma_pagamento_id = ?, status = ?, status_pagamento = ?, data_vencimento = ? WHERE id = ?",
      [
        payload.cliente_id,
        payload.forma_pagamento_id,
        payload.status,
        payload.status_pagamento,
        payload.data_vencimento,
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Venda nao encontrada" });
    }

    return res.json({ status: "success", message: "Venda atualizada" });
  } catch (error) {
    return handleError(res, error, "Erro ao atualizar venda");
  }
};

export const deleteVenda = async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [vendaRows] = await connection.query("SELECT * FROM vendas WHERE id = ?", [
      req.params.id,
    ]);

    if (vendaRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ status: "error", message: "Venda nao encontrada" });
    }

    const venda = vendaRows[0];

    if (venda.status === "cancelada") {
      await connection.rollback();
      return res
        .status(400)
        .json({ status: "error", message: "Venda ja cancelada" });
    }

    const [itens] = await connection.query(
      "SELECT id, produto_id, quantidade, preco_venda_epoca FROM itens_vendidos WHERE venda_id = ?",
      [req.params.id]
    );

    const usuario_id = resolveUsuarioId(req, venda.usuario_id);

    for (const item of itens) {
      const entradaResult = await applyEntradaEstoque(connection, {
        produto_id: item.produto_id,
        quantidade: Number(item.quantidade),
        usuario_id,
        motivo: "ajuste",
      });

      if (entradaResult.error) {
        await connection.rollback();
        return res
          .status(400)
          .json({ status: "error", message: entradaResult.error });
      }
    }

    await connection.query(
      "UPDATE vendas SET status = 'cancelada', status_pagamento = 'pendente' WHERE id = ?",
      [req.params.id]
    );

    await connection.commit();

    return res.json({ status: "success", message: "Venda cancelada" });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    return handleError(res, error, "Erro ao cancelar venda");
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
