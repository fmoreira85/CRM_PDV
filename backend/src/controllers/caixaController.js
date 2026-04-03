import { getConnection } from "../../connections.js";

const db = getConnection();
const VALID_TIPOS = ["entrada", "saida"];

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

const isValidValor = (value) => {
  const numberValue = Number(value);
  return !Number.isNaN(numberValue) && numberValue > 0;
};

export const listCaixa = async (req, res) => {
  try {
    const { tipo, origem, referencia, data_de, data_ate } = req.query;

    const filters = [];
    const params = [];

    if (tipo) {
      if (!VALID_TIPOS.includes(tipo)) {
        return res.status(400).json({ status: "error", message: "Tipo invalido" });
      }
      filters.push("c.tipo_movimento = ?");
      params.push(tipo);
    }

    if (origem) {
      filters.push("c.origem LIKE ?");
      params.push(`%${origem}%`);
    }

    if (referencia) {
      filters.push("c.referencia LIKE ?");
      params.push(`%${referencia}%`);
    }

    if (data_de) {
      if (!isValidDateTime(data_de)) {
        return res.status(400).json({ status: "error", message: "Data inicial invalida" });
      }
      filters.push("c.data_movimento >= ?");
      params.push(data_de);
    }

    if (data_ate) {
      if (!isValidDateTime(data_ate)) {
        return res.status(400).json({ status: "error", message: "Data final invalida" });
      }
      filters.push("c.data_movimento <= ?");
      params.push(data_ate);
    }

    const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT id, valor, origem, referencia, data_movimento, tipo_movimento, observacao, created_at, updated_at
       FROM caixa c
       ${whereSql}
       ORDER BY c.data_movimento DESC, c.id DESC`,
      params
    );
    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao listar caixa");
  }
};

export const getResumoCaixa = async (req, res) => {
  try {
    const { data_de, data_ate } = req.query;
    const filters = [];
    const params = [];

    if (data_de) {
      if (!isValidDateTime(data_de)) {
        return res.status(400).json({ status: "error", message: "Data inicial invalida" });
      }
      filters.push("data_movimento >= ?");
      params.push(data_de);
    }

    if (data_ate) {
      if (!isValidDateTime(data_ate)) {
        return res.status(400).json({ status: "error", message: "Data final invalida" });
      }
      filters.push("data_movimento <= ?");
      params.push(data_ate);
    }

    const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "WHERE 1=1";

    const [[entradas]] = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS total_entradas FROM caixa ${whereSql} AND tipo_movimento = 'entrada'`,
      params
    );

    const [[saidas]] = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS total_saidas FROM caixa ${whereSql} AND tipo_movimento = 'saida'`,
      params
    );

    return res.json({
      status: "success",
      data: {
        total_entradas: entradas.total_entradas,
        total_saidas: saidas.total_saidas,
        saldo: Number(entradas.total_entradas) - Number(saidas.total_saidas),
      },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar resumo do caixa");
  }
};

export const getComparativo = async (req, res) => {
  try {
    const { data_de, data_ate } = req.query;
    const filters = [];
    const params = [];

    if (data_de) {
      if (!isValidDateTime(data_de)) {
        return res.status(400).json({ status: "error", message: "Data inicial invalida" });
      }
      filters.push("created_at >= ?");
      params.push(data_de);
    }

    if (data_ate) {
      if (!isValidDateTime(data_ate)) {
        return res.status(400).json({ status: "error", message: "Data final invalida" });
      }
      filters.push("created_at <= ?");
      params.push(data_ate);
    }

    const whereVendas = filters.length ? `WHERE ${filters.join(" AND ")}` : "WHERE 1=1";
    const whereCaixa = whereVendas.replace(/created_at/g, "data_movimento");
    const whereMov = whereVendas.replace(/created_at/g, "data_movimentacao");

    const [[vendasTotais]] = await db.query(
      `SELECT COALESCE(SUM(valor_total), 0) AS total_vendas FROM vendas ${whereVendas}`,
      params
    );

    const [[itensTotais]] = await db.query(
      `SELECT COALESCE(SUM(quantidade * preco_venda_epoca), 0) AS total_itens_vendidos,
              COALESCE(SUM(quantidade), 0) AS quantidade_itens
       FROM itens_vendidos iv
       JOIN vendas v ON v.id = iv.venda_id
       ${whereVendas}`,
      params
    );

    const [[caixaEntradas]] = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS total_caixa_entradas FROM caixa ${whereCaixa} AND tipo_movimento = 'entrada'`,
      params
    );

    const [[caixaSaidas]] = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS total_caixa_saidas FROM caixa ${whereCaixa} AND tipo_movimento = 'saida'`,
      params
    );

    const [[caixaEntradasVenda]] = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS total_caixa_vendas FROM caixa ${whereCaixa} AND tipo_movimento = 'entrada' AND origem LIKE '%Venda%'`,
      params
    );

    const [[estoqueVenda]] = await db.query(
      `SELECT COALESCE(SUM(quantidade), 0) AS quantidade_saida_venda
       FROM movimentacoes_estoque ${whereMov} AND tipo_movimento = 'saida' AND motivo = 'venda'`,
      params
    );

    return res.json({
      status: "success",
      data: {
        periodo: { data_de: data_de ?? null, data_ate: data_ate ?? null },
        vendas: {
          total_vendas: vendasTotais.total_vendas,
          total_itens_vendidos: itensTotais.total_itens_vendidos,
          quantidade_itens: itensTotais.quantidade_itens,
        },
        caixa: {
          total_entradas: caixaEntradas.total_caixa_entradas,
          total_saidas: caixaSaidas.total_caixa_saidas,
          saldo:
            Number(caixaEntradas.total_caixa_entradas) -
            Number(caixaSaidas.total_caixa_saidas),
          total_entradas_venda: caixaEntradasVenda.total_caixa_vendas,
          divergencia_vendas_caixa:
            Number(vendasTotais.total_vendas) - Number(caixaEntradasVenda.total_caixa_vendas),
        },
        estoque: {
          quantidade_saida_venda: estoqueVenda.quantidade_saida_venda,
        },
      },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar comparativo");
  }
};

export const getCaixa = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, valor, origem, referencia, data_movimento, tipo_movimento, observacao, created_at, updated_at FROM caixa WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Registro de caixa nao encontrado" });
    }

    return res.json({ status: "success", data: rows[0] });
  } catch (error) {
    return handleError(res, error, "Erro ao buscar caixa");
  }
};

export const createCaixa = async (req, res) => {
  try {
    const { valor, origem, tipo_movimento } = req.body;
    if (valor === undefined || !origem || !tipo_movimento) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    if (!isValidValor(valor)) {
      return res.status(400).json({ status: "error", message: "Valor invalido" });
    }

    if (!VALID_TIPOS.includes(tipo_movimento)) {
      return res.status(400).json({ status: "error", message: "Tipo invalido" });
    }

    const referencia = req.body.referencia ?? null;
    const observacao = req.body.observacao ?? null;
    const data_movimento = req.body.data_movimento ?? new Date();

    if (data_movimento && !isValidDateTime(data_movimento)) {
      return res.status(400).json({ status: "error", message: "Data invalida" });
    }

    const [result] = await db.query(
      "INSERT INTO caixa (valor, origem, referencia, data_movimento, tipo_movimento, observacao) VALUES (?, ?, ?, ?, ?, ?)",
      [valor, origem, referencia, data_movimento, tipo_movimento, observacao]
    );

    return res.status(201).json({
      status: "success",
      message: "Movimento de caixa criado",
      data: { id: result.insertId },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao criar movimento de caixa");
  }
};

export const updateCaixa = async (req, res) => {
  try {
    const [currentRows] = await db.query("SELECT * FROM caixa WHERE id = ?", [
      req.params.id,
    ]);

    if (currentRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Registro de caixa nao encontrado" });
    }

    const current = currentRows[0];

    const payload = {
      valor: req.body.valor ?? current.valor,
      origem: req.body.origem ?? current.origem,
      referencia: req.body.referencia ?? current.referencia,
      data_movimento: req.body.data_movimento ?? current.data_movimento,
      tipo_movimento: req.body.tipo_movimento ?? current.tipo_movimento,
      observacao: req.body.observacao ?? current.observacao,
    };

    if (payload.valor === undefined || !payload.origem || !payload.tipo_movimento) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    if (!isValidValor(payload.valor)) {
      return res.status(400).json({ status: "error", message: "Valor invalido" });
    }

    if (!VALID_TIPOS.includes(payload.tipo_movimento)) {
      return res.status(400).json({ status: "error", message: "Tipo invalido" });
    }

    if (payload.data_movimento && !isValidDateTime(payload.data_movimento)) {
      return res.status(400).json({ status: "error", message: "Data invalida" });
    }

    const [result] = await db.query(
      "UPDATE caixa SET valor = ?, origem = ?, referencia = ?, data_movimento = ?, tipo_movimento = ?, observacao = ? WHERE id = ?",
      [
        payload.valor,
        payload.origem,
        payload.referencia,
        payload.data_movimento,
        payload.tipo_movimento,
        payload.observacao,
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Registro de caixa nao encontrado" });
    }

    return res.json({ status: "success", message: "Movimento de caixa atualizado" });
  } catch (error) {
    return handleError(res, error, "Erro ao atualizar movimento de caixa");
  }
};

export const deleteCaixa = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM caixa WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Registro de caixa nao encontrado" });
    }

    return res.json({ status: "success", message: "Movimento de caixa removido" });
  } catch (error) {
    return handleError(res, error, "Erro ao remover movimento de caixa");
  }
};
