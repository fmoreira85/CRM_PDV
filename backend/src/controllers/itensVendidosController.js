import { getConnection } from "../../connections.js";
import {
  applyEntradaEstoque,
  applySaidaEstoque,
  getProduto,
} from "../utils/estoqueMovimentacao.js";

const db = getConnection();

const handleError = (res, error, message) => {
  console.error(error);
  return res.status(500).json({ status: "error", message });
};

const isAdmin = (req) => req.user?.tipo_usuario === "admin";
const isCategoria1 = (req) =>
  req.user?.tipo_usuario === "funcionario" && Number(req.user?.categoria_funcionario) === 1;

const createAutorizacaoRegistro = async (
  connection,
  {
    venda_id,
    item_vendido_id,
    tipo,
    solicitado_por,
    autorizado_por,
    motivo,
    valor_anterior,
    valor_novo,
  }
) => {
  const valorAlterado = Number(valor_anterior) - Number(valor_novo);
  await connection.query(
    "INSERT INTO autorizacoes_gerenciais (venda_id, item_vendido_id, tipo, solicitado_por, autorizado_por, motivo, valor_anterior, valor_novo, valor_alterado, status, autorizado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'aprovado', NOW())",
    [
      venda_id,
      item_vendido_id,
      tipo,
      solicitado_por,
      autorizado_por,
      motivo,
      valor_anterior,
      valor_novo,
      valorAlterado,
    ]
  );
};

const getAutorizacaoAprovada = async (
  connection,
  { autorizacao_id, item_vendido_id, tipo }
) => {
  const [rows] = await connection.query(
    "SELECT id, valor_novo FROM autorizacoes_gerenciais WHERE id = ? AND item_vendido_id = ? AND tipo = ? AND status = 'aprovado'",
    [autorizacao_id, item_vendido_id, tipo]
  );

  if (rows.length === 0) {
    return { error: "Autorizacao nao encontrada ou nao aprovada" };
  }

  return { autorizacao: rows[0] };
};

const parseNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? undefined : numberValue;
};

const resolveUsuarioId = (req, fallbackId) =>
  req.user?.id ?? req.body.usuario_id ?? fallbackId;

const fetchVenda = async (connection, venda_id) => {
  const [rows] = await connection.query("SELECT * FROM vendas WHERE id = ?", [
    venda_id,
  ]);

  if (rows.length === 0) {
    return { error: "Venda nao encontrada" };
  }

  return { venda: rows[0] };
};

const updateVendaTotal = async (connection, venda_id, novoTotal) => {
  const totalFinal = Math.max(0, Number(novoTotal) || 0);
  await connection.query("UPDATE vendas SET valor_total = ? WHERE id = ?", [
    totalFinal,
    venda_id,
  ]);
};

export const listItensVendidos = async (req, res) => {
  try {
    const { venda_id, produto_id } = req.query;
    const filters = [];
    const params = [];

    const vendaId = parseNumber(venda_id);
    if (venda_id !== undefined && vendaId === undefined) {
      return res.status(400).json({ status: "error", message: "Venda invalida" });
    }

    const produtoId = parseNumber(produto_id);
    if (produto_id !== undefined && produtoId === undefined) {
      return res.status(400).json({ status: "error", message: "Produto invalido" });
    }

    if (vendaId !== undefined) {
      filters.push("iv.venda_id = ?");
      params.push(vendaId);
    }

    if (produtoId !== undefined) {
      filters.push("iv.produto_id = ?");
      params.push(produtoId);
    }

    const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [rows] = await db.query(
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
      ${whereSql}
      ORDER BY iv.id DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao listar itens vendidos");
  }
};

export const getItemVendido = async (req, res) => {
  try {
    const [rows] = await db.query(
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
      WHERE iv.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Item vendido nao encontrado" });
    }

    return res.json({ status: "success", data: rows[0] });
  } catch (error) {
    return handleError(res, error, "Erro ao buscar item vendido");
  }
};

export const createItemVendido = async (req, res) => {
  let connection;
  try {
    const { venda_id, produto_id, quantidade } = req.body;

    if (!venda_id || !produto_id || !quantidade) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    const quantidadeNumber = Number(quantidade);
    const produtoId = Number(produto_id);
    if (Number.isNaN(produtoId) || Number.isNaN(quantidadeNumber) || quantidadeNumber <= 0) {
      return res.status(400).json({ status: "error", message: "Item invalido" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const { venda, error: vendaError } = await fetchVenda(connection, venda_id);
    if (vendaError) {
      await connection.rollback();
      return res.status(400).json({ status: "error", message: vendaError });
    }

    if (venda.status === "cancelada") {
      await connection.rollback();
      return res
        .status(400)
        .json({ status: "error", message: "Venda cancelada" });
    }

    const { produto, error: produtoError } = await getProduto(connection, produtoId);
    if (produtoError) {
      await connection.rollback();
      return res.status(400).json({ status: "error", message: produtoError });
    }

    const precoVenda =
      req.body.preco_venda_epoca !== undefined
        ? Number(req.body.preco_venda_epoca)
        : Number(produto.preco_venda_atual);
    const precoCusto =
      req.body.preco_custo_epoca !== undefined
        ? Number(req.body.preco_custo_epoca)
        : Number(produto.preco_custo_atual);

    if (Number.isNaN(precoVenda) || Number.isNaN(precoCusto)) {
      await connection.rollback();
      return res.status(400).json({ status: "error", message: "Preco invalido" });
    }

    if (isCategoria1(req) && precoVenda < Number(produto.preco_venda_atual)) {
      await connection.rollback();
      return res.status(403).json({
        status: "error",
        message: "Desconto requer autorizacao gerencial",
      });
    }

    const usuario_id = resolveUsuarioId(req, venda.usuario_id);

    const saidaResult = await applySaidaEstoque(connection, {
      produto_id: produtoId,
      quantidade: quantidadeNumber,
      usuario_id,
      motivo: "venda",
    });

    if (saidaResult.error) {
      await connection.rollback();
      return res.status(400).json({ status: "error", message: saidaResult.error });
    }

    const [result] = await connection.query(
      "INSERT INTO itens_vendidos (venda_id, produto_id, quantidade, preco_venda_epoca, preco_custo_epoca) VALUES (?, ?, ?, ?, ?)",
      [venda_id, produtoId, quantidadeNumber, precoVenda, precoCusto]
    );

    const novoTotal = Number(venda.valor_total || 0) + quantidadeNumber * precoVenda;
    await updateVendaTotal(connection, venda_id, novoTotal);

    await connection.commit();

    return res.status(201).json({
      status: "success",
      message: "Item vendido criado",
      data: { id: result.insertId },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    return handleError(res, error, "Erro ao criar item vendido");
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const updateItemVendido = async (req, res) => {
  let connection;
  try {
    const [itemRows] = await db.query("SELECT * FROM itens_vendidos WHERE id = ?", [
      req.params.id,
    ]);

    if (itemRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Item vendido nao encontrado" });
    }

    const itemAtual = itemRows[0];

    if (
      req.body.venda_id !== undefined &&
      Number(req.body.venda_id) !== Number(itemAtual.venda_id)
    ) {
      return res.status(400).json({ status: "error", message: "Nao alterar venda" });
    }

    if (
      req.body.produto_id !== undefined &&
      Number(req.body.produto_id) !== Number(itemAtual.produto_id)
    ) {
      return res.status(400).json({ status: "error", message: "Nao alterar produto" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const { venda, error: vendaError } = await fetchVenda(connection, itemAtual.venda_id);
    if (vendaError) {
      await connection.rollback();
      return res.status(400).json({ status: "error", message: vendaError });
    }

    if (venda.status === "cancelada") {
      await connection.rollback();
      return res
        .status(400)
        .json({ status: "error", message: "Venda cancelada" });
    }

    const quantidadeNova =
      req.body.quantidade !== undefined ? Number(req.body.quantidade) : Number(itemAtual.quantidade);
    if (Number.isNaN(quantidadeNova) || quantidadeNova <= 0) {
      await connection.rollback();
      return res.status(400).json({ status: "error", message: "Quantidade invalida" });
    }

    const precoVendaNovo =
      req.body.preco_venda_epoca !== undefined
        ? Number(req.body.preco_venda_epoca)
        : Number(itemAtual.preco_venda_epoca);
    const precoCustoNovo =
      req.body.preco_custo_epoca !== undefined
        ? Number(req.body.preco_custo_epoca)
        : Number(itemAtual.preco_custo_epoca);

    if (Number.isNaN(precoVendaNovo) || Number.isNaN(precoCustoNovo)) {
      await connection.rollback();
      return res.status(400).json({ status: "error", message: "Preco invalido" });
    }

    const admin = isAdmin(req);
    const categoria1 = isCategoria1(req);
    const desconto = precoVendaNovo < Number(itemAtual.preco_venda_epoca);

    if (categoria1 && quantidadeNova !== Number(itemAtual.quantidade)) {
      await connection.rollback();
      return res.status(403).json({
        status: "error",
        message: "Somente gerente pode alterar quantidade do item",
      });
    }

    if (categoria1 && desconto) {
      const autorizacaoId = req.body.autorizacao_id;
      if (!autorizacaoId) {
        await connection.rollback();
        return res.status(403).json({
          status: "error",
          message: "Autorizacao gerencial obrigatoria para desconto",
        });
      }

      const { autorizacao, error: authError } = await getAutorizacaoAprovada(
        connection,
        {
          autorizacao_id: autorizacaoId,
          item_vendido_id: itemAtual.id,
          tipo: "desconto",
        }
      );

      if (authError) {
        await connection.rollback();
        return res.status(403).json({ status: "error", message: authError });
      }

      const valorAutorizadoTotal = Number(autorizacao.valor_novo);
      const precoAutorizado = valorAutorizadoTotal / Number(itemAtual.quantidade);
      if (
        Number.isNaN(valorAutorizadoTotal) ||
        valorAutorizadoTotal <= 0 ||
        Number.isNaN(precoAutorizado) ||
        precoAutorizado <= 0
      ) {
        await connection.rollback();
        return res.status(400).json({
          status: "error",
          message: "Valor autorizado invalido",
        });
      }

      precoVendaNovo = precoAutorizado;
    }

    const deltaQuantidade = quantidadeNova - Number(itemAtual.quantidade);
    const usuario_id = resolveUsuarioId(req, venda.usuario_id);

    if (deltaQuantidade > 0) {
      const saidaResult = await applySaidaEstoque(connection, {
        produto_id: itemAtual.produto_id,
        quantidade: deltaQuantidade,
        usuario_id,
        motivo: "venda",
      });

      if (saidaResult.error) {
        await connection.rollback();
        return res.status(400).json({ status: "error", message: saidaResult.error });
      }
    }

    if (deltaQuantidade < 0) {
      const entradaResult = await applyEntradaEstoque(connection, {
        produto_id: itemAtual.produto_id,
        quantidade: Math.abs(deltaQuantidade),
        usuario_id,
        motivo: "ajuste",
      });

      if (entradaResult.error) {
        await connection.rollback();
        return res.status(400).json({ status: "error", message: entradaResult.error });
      }
    }

    await connection.query(
      "UPDATE itens_vendidos SET quantidade = ?, preco_venda_epoca = ?, preco_custo_epoca = ? WHERE id = ?",
      [quantidadeNova, precoVendaNovo, precoCustoNovo, req.params.id]
    );

    const valorAtual = Number(itemAtual.preco_venda_epoca) * Number(itemAtual.quantidade);
    const valorNovo = precoVendaNovo * quantidadeNova;
    const novoTotal = Number(venda.valor_total || 0) - valorAtual + valorNovo;
    await updateVendaTotal(connection, venda.id, novoTotal);

    if (admin && desconto) {
      await createAutorizacaoRegistro(connection, {
        venda_id: venda.id,
        item_vendido_id: itemAtual.id,
        tipo: "desconto",
        solicitado_por: req.user.id,
        autorizado_por: req.user.id,
        motivo: req.body.motivo ?? "Desconto autorizado",
        valor_anterior: valorAtual,
        valor_novo: valorNovo,
      });
    }

    await connection.commit();

    return res.json({ status: "success", message: "Item vendido atualizado" });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    return handleError(res, error, "Erro ao atualizar item vendido");
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const deleteItemVendido = async (req, res) => {
  let connection;
  try {
    const [itemRows] = await db.query("SELECT * FROM itens_vendidos WHERE id = ?", [
      req.params.id,
    ]);

    if (itemRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Item vendido nao encontrado" });
    }

    const itemAtual = itemRows[0];

    connection = await db.getConnection();
    await connection.beginTransaction();

    const { venda, error: vendaError } = await fetchVenda(connection, itemAtual.venda_id);
    if (vendaError) {
      await connection.rollback();
      return res.status(400).json({ status: "error", message: vendaError });
    }

    if (venda.status === "cancelada") {
      await connection.rollback();
      return res
        .status(400)
        .json({ status: "error", message: "Venda cancelada" });
    }

    const admin = isAdmin(req);
    const categoria1 = isCategoria1(req);
    const autorizacaoId = req.body.autorizacao_id ?? req.query.autorizacao_id;

    if (categoria1) {
      if (!autorizacaoId) {
        await connection.rollback();
        return res.status(403).json({
          status: "error",
          message: "Autorizacao gerencial obrigatoria para cancelamento",
        });
      }

      const { error: authError } = await getAutorizacaoAprovada(connection, {
        autorizacao_id: autorizacaoId,
        item_vendido_id: itemAtual.id,
        tipo: "cancelamento",
      });

      if (authError) {
        await connection.rollback();
        return res.status(403).json({ status: "error", message: authError });
      }
    }

    const usuario_id = resolveUsuarioId(req, venda.usuario_id);
    const entradaResult = await applyEntradaEstoque(connection, {
      produto_id: itemAtual.produto_id,
      quantidade: Number(itemAtual.quantidade),
      usuario_id,
      motivo: "ajuste",
    });

    if (entradaResult.error) {
      await connection.rollback();
      return res.status(400).json({ status: "error", message: entradaResult.error });
    }

    await connection.query("DELETE FROM itens_vendidos WHERE id = ?", [req.params.id]);

    const valorAtual =
      Number(itemAtual.preco_venda_epoca) * Number(itemAtual.quantidade);
    const novoTotal = Number(venda.valor_total || 0) - valorAtual;
    await updateVendaTotal(connection, venda.id, novoTotal);

    if (admin) {
      await createAutorizacaoRegistro(connection, {
        venda_id: venda.id,
        item_vendido_id: itemAtual.id,
        tipo: "cancelamento",
        solicitado_por: req.user.id,
        autorizado_por: req.user.id,
        motivo: req.body.motivo ?? "Cancelamento autorizado",
        valor_anterior: valorAtual,
        valor_novo: 0,
      });
    }

    await connection.commit();

    return res.json({ status: "success", message: "Item vendido removido" });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    return handleError(res, error, "Erro ao remover item vendido");
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
