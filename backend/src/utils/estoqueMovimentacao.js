const orderByLotes =
  "ORDER BY CASE WHEN validade IS NULL THEN 1 ELSE 0 END, validade ASC, id ASC";

export const getProduto = async (connection, produto_id) => {
  const [rows] = await connection.query(
    "SELECT id, nome, preco_custo_atual, preco_venda_atual FROM produtos WHERE id = ?",
    [produto_id]
  );

  if (rows.length === 0) {
    return { error: "Produto nao encontrado" };
  }

  return { produto: rows[0] };
};

export const getCliente = async (connection, cliente_id) => {
  const [rows] = await connection.query("SELECT id FROM clientes WHERE id = ?", [
    cliente_id,
  ]);

  if (rows.length === 0) {
    return { error: "Cliente nao encontrado" };
  }

  return { cliente: rows[0] };
};

export const getFormaPagamento = async (connection, forma_pagamento_id) => {
  const [rows] = await connection.query(
    "SELECT id, nome FROM formas_pagamento WHERE id = ?",
    [forma_pagamento_id]
  );

  if (rows.length === 0) {
    return { error: "Forma de pagamento nao encontrada" };
  }

  return { forma: rows[0] };
};

export const applySaidaEstoque = async (
  connection,
  { produto_id, quantidade, usuario_id, motivo, data_movimentacao }
) => {
  const [lotes] = await connection.query(
    `SELECT id, quantidade_atual FROM estoque WHERE produto_id = ? ${orderByLotes} FOR UPDATE`,
    [produto_id]
  );

  if (lotes.length === 0) {
    return { error: "Nao ha lotes cadastrados para este produto" };
  }

  const totalDisponivel = lotes.reduce(
    (acc, lote) => acc + Number(lote.quantidade_atual || 0),
    0
  );

  if (totalDisponivel < quantidade) {
    return { error: "Estoque insuficiente" };
  }

  let restante = quantidade;
  for (const lote of lotes) {
    if (restante <= 0) break;

    const disponivel = Number(lote.quantidade_atual || 0);
    if (disponivel <= 0) continue;

    const saida = restante > disponivel ? disponivel : restante;
    restante -= saida;

    await connection.query(
      "UPDATE estoque SET quantidade_atual = quantidade_atual - ? WHERE id = ?",
      [saida, lote.id]
    );

    await connection.query(
      "INSERT INTO movimentacoes_estoque (produto_id, estoque_id, usuario_id, tipo_movimento, motivo, quantidade, data_movimentacao) VALUES (?, ?, ?, 'saida', ?, ?, ?)",
      [
        produto_id,
        lote.id,
        usuario_id,
        motivo,
        saida,
        data_movimentacao ?? new Date(),
      ]
    );
  }

  return { ok: true };
};

export const applyEntradaEstoque = async (
  connection,
  { produto_id, quantidade, usuario_id, motivo, data_movimentacao }
) => {
  const [lotes] = await connection.query(
    `SELECT id FROM estoque WHERE produto_id = ? ${orderByLotes} FOR UPDATE`,
    [produto_id]
  );

  if (lotes.length === 0) {
    return { error: "Nao ha lotes cadastrados para este produto" };
  }

  const loteId = lotes[0].id;

  await connection.query(
    "UPDATE estoque SET quantidade_atual = quantidade_atual + ? WHERE id = ?",
    [quantidade, loteId]
  );

  await connection.query(
    "INSERT INTO movimentacoes_estoque (produto_id, estoque_id, usuario_id, tipo_movimento, motivo, quantidade, data_movimentacao) VALUES (?, ?, ?, 'entrada', ?, ?, ?)",
    [
      produto_id,
      loteId,
      usuario_id,
      motivo,
      quantidade,
      data_movimentacao ?? new Date(),
    ]
  );

  return { ok: true };
};
