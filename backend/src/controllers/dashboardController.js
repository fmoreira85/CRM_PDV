import { getConnection } from "../../connections.js";

const db = getConnection();

const handleError = (res, error, message) => {
  console.error(error);
  return res.status(500).json({ status: "error", message });
};

const isValidDateTime = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(value);

const parsePositiveInt = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const numberValue = Number(value);
  if (Number.isNaN(numberValue) || numberValue <= 0) {
    return null;
  }
  return Math.trunc(numberValue);
};

const applyDateRange = (filters, params, field, data_de, data_ate) => {
  if (data_de) {
    if (!isValidDateTime(data_de)) {
      return "Data inicial invalida";
    }
    filters.push(`${field} >= ?`);
    params.push(data_de);
  }

  if (data_ate) {
    if (!isValidDateTime(data_ate)) {
      return "Data final invalida";
    }
    filters.push(`${field} <= ?`);
    params.push(data_ate);
  }

  return null;
};

const resolvePeriodo = (query, alias = "v") => {
  const periodo = (query.periodo ?? "total").toString().toLowerCase();
  if (!["total", "month", "year"].includes(periodo)) {
    return { error: "Periodo invalido" };
  }

  if (periodo === "total") {
    return { periodo, ano: null, mes: null, sql: "", params: [] };
  }

  const now = new Date();
  const ano = query.ano ? Number(query.ano) : now.getFullYear();
  const mes = query.mes ? Number(query.mes) : now.getMonth() + 1;

  if (!Number.isInteger(ano) || ano < 2000 || ano > 2200) {
    return { error: "Ano invalido" };
  }

  if (periodo === "month") {
    if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
      return { error: "Mes invalido" };
    }
    return {
      periodo,
      ano,
      mes,
      sql: ` AND YEAR(${alias}.created_at) = ? AND MONTH(${alias}.created_at) = ?`,
      params: [ano, mes],
    };
  }

  return {
    periodo,
    ano,
    mes: null,
    sql: ` AND YEAR(${alias}.created_at) = ?`,
    params: [ano],
  };
};

const toFixedArray = (rows, size, keyField, valueField) => {
  const result = Array.from({ length: size }, (_, index) => ({
    key: index + 1,
    value: 0,
  }));

  rows.forEach((row) => {
    const key = Number(row[keyField]);
    const value = Number(row[valueField] ?? 0);
    if (!Number.isNaN(key) && key >= 1 && key <= size) {
      result[key - 1].value = value;
    }
  });

  return result;
};

const buildPeriodWhere = (period) => {
  if (period === "month") {
    return "AND YEAR(v.created_at) = YEAR(CURDATE()) AND MONTH(v.created_at) = MONTH(CURDATE())";
  }
  if (period === "year") {
    return "AND YEAR(v.created_at) = YEAR(CURDATE())";
  }
  return "";
};

const getTopBottom = async (queryBase, period) => {
  const wherePeriod = buildPeriodWhere(period);
  const [topRows] = await db.query(
    `${queryBase} ${wherePeriod} GROUP BY id ORDER BY quantidade DESC LIMIT 1`
  );
  const [bottomRows] = await db.query(
    `${queryBase} ${wherePeriod} GROUP BY id ORDER BY quantidade ASC LIMIT 1`
  );

  return {
    top: topRows.length ? topRows[0] : null,
    bottom: bottomRows.length ? bottomRows[0] : null,
  };
};

export const getDashboardSummary = async (req, res) => {
  try {
    const [[lucroMes]] = await db.query(
      `SELECT COALESCE(SUM((iv.preco_venda_epoca - iv.preco_custo_epoca) * iv.quantidade), 0) AS lucro
       FROM itens_vendidos iv
       JOIN vendas v ON v.id = iv.venda_id
       WHERE v.status <> 'cancelada'
         AND YEAR(v.created_at) = YEAR(CURDATE())
         AND MONTH(v.created_at) = MONTH(CURDATE())`
    );

    const [[lucroAno]] = await db.query(
      `SELECT COALESCE(SUM((iv.preco_venda_epoca - iv.preco_custo_epoca) * iv.quantidade), 0) AS lucro
       FROM itens_vendidos iv
       JOIN vendas v ON v.id = iv.venda_id
       WHERE v.status <> 'cancelada'
         AND YEAR(v.created_at) = YEAR(CURDATE())`
    );

    const [[lucroTotal]] = await db.query(
      `SELECT COALESCE(SUM((iv.preco_venda_epoca - iv.preco_custo_epoca) * iv.quantidade), 0) AS lucro
       FROM itens_vendidos iv
       JOIN vendas v ON v.id = iv.venda_id
       WHERE v.status <> 'cancelada'`
    );

    const [lucroMesesRows] = await db.query(
      `SELECT MONTH(v.created_at) AS mes,
              COALESCE(SUM((iv.preco_venda_epoca - iv.preco_custo_epoca) * iv.quantidade), 0) AS lucro
       FROM itens_vendidos iv
       JOIN vendas v ON v.id = iv.venda_id
       WHERE v.status <> 'cancelada'
         AND YEAR(v.created_at) = YEAR(CURDATE())
       GROUP BY MONTH(v.created_at)
       ORDER BY mes ASC`
    );

    const lucroMeses = toFixedArray(lucroMesesRows, 12, "mes", "lucro");

    const [lucroAnosRows] = await db.query(
      `SELECT YEAR(v.created_at) AS ano,
              COALESCE(SUM((iv.preco_venda_epoca - iv.preco_custo_epoca) * iv.quantidade), 0) AS lucro
       FROM itens_vendidos iv
       JOIN vendas v ON v.id = iv.venda_id
       WHERE v.status <> 'cancelada'
       GROUP BY YEAR(v.created_at)
       ORDER BY ano DESC
       LIMIT 6`
    );

    const lucroAnos = lucroAnosRows
      .map((row) => ({ ano: Number(row.ano), valor: Number(row.lucro) }))
      .sort((a, b) => a.ano - b.ano);

    const produtoQueryBase = `
      SELECT p.id AS id, p.nome AS nome, SUM(iv.quantidade) AS quantidade
      FROM itens_vendidos iv
      JOIN vendas v ON v.id = iv.venda_id
      JOIN produtos p ON p.id = iv.produto_id
      WHERE v.status <> 'cancelada'`;

    const categoriaQueryBase = `
      SELECT c.id AS id, c.nome AS nome, SUM(iv.quantidade) AS quantidade
      FROM itens_vendidos iv
      JOIN vendas v ON v.id = iv.venda_id
      JOIN produtos p ON p.id = iv.produto_id
      JOIN categorias c ON c.id = p.categoria_id
      WHERE v.status <> 'cancelada'`;

    const produtosMes = await getTopBottom(produtoQueryBase, "month");
    const produtosAno = await getTopBottom(produtoQueryBase, "year");
    const produtosTotal = await getTopBottom(produtoQueryBase, "total");

    const categoriasMes = await getTopBottom(categoriaQueryBase, "month");
    const categoriasAno = await getTopBottom(categoriaQueryBase, "year");
    const categoriasTotal = await getTopBottom(categoriaQueryBase, "total");

    const [[inadimplentes]] = await db.query(
      `SELECT COALESCE(SUM(valor_total), 0) AS total
       FROM vendas
       WHERE status_pagamento = 'inadimplente'
         AND status <> 'cancelada'`
    );

    const [encomendasProximas] = await db.query(
      `SELECT
        e.id,
        f.nome AS fornecedor,
        p.nome AS produto,
        e.quantidade,
        e.prazo,
        e.status,
        DATEDIFF(e.prazo, CURDATE()) AS dias_para_prazo
       FROM encomendas e
       JOIN fornecedores f ON f.id = e.fornecedor_id
       JOIN produtos p ON p.id = e.produto_id
       WHERE e.prazo IS NOT NULL
         AND e.status IN ('aberta', 'confirmada')
         AND e.prazo BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
       ORDER BY e.prazo ASC
       LIMIT 8`
    );

    const [produtosBaixoEstoque] = await db.query(
      `SELECT
        p.id AS produto_id,
        p.nome AS produto_nome,
        SUM(e.quantidade_atual) AS quantidade_total,
        SUM(e.nivel_ideal) AS nivel_ideal_total
       FROM estoque e
       JOIN produtos p ON p.id = e.produto_id
       GROUP BY p.id
       HAVING SUM(e.quantidade_atual) <= SUM(e.nivel_ideal)
       ORDER BY (SUM(e.nivel_ideal) - SUM(e.quantidade_atual)) DESC
       LIMIT 8`
    );

    const [lotesProximos] = await db.query(
      `SELECT
        e.id,
        p.nome AS produto_nome,
        e.lote,
        e.validade,
        e.quantidade_atual,
        DATEDIFF(e.validade, CURDATE()) AS dias_para_vencimento
       FROM estoque e
       JOIN produtos p ON p.id = e.produto_id
       WHERE e.validade IS NOT NULL
         AND e.validade BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
       ORDER BY e.validade ASC
       LIMIT 8`
    );

    const [[descartesTotal]] = await db.query(
      `SELECT COALESCE(SUM(quantidade), 0) AS total
       FROM movimentacoes_estoque
       WHERE tipo_movimento = 'saida' AND motivo = 'perda_avaria'`
    );

    const [descartesCategoria] = await db.query(
      `SELECT c.nome AS categoria, COALESCE(SUM(me.quantidade), 0) AS quantidade
       FROM movimentacoes_estoque me
       JOIN produtos p ON p.id = me.produto_id
       JOIN categorias c ON c.id = p.categoria_id
       WHERE me.tipo_movimento = 'saida' AND me.motivo = 'perda_avaria'
       GROUP BY c.id
       ORDER BY quantidade DESC`
    );

    const [descartesMarca] = await db.query(
      `SELECT COALESCE(p.marca, 'Sem marca') AS marca, COALESCE(SUM(me.quantidade), 0) AS quantidade
       FROM movimentacoes_estoque me
       JOIN produtos p ON p.id = me.produto_id
       WHERE me.tipo_movimento = 'saida' AND me.motivo = 'perda_avaria'
       GROUP BY p.marca
       ORDER BY quantidade DESC`
    );

    const [descartesTipo] = await db.query(
      `SELECT p.nome AS tipo, COALESCE(SUM(me.quantidade), 0) AS quantidade
       FROM movimentacoes_estoque me
       JOIN produtos p ON p.id = me.produto_id
       WHERE me.tipo_movimento = 'saida' AND me.motivo = 'perda_avaria'
       GROUP BY p.id
       ORDER BY quantidade DESC
       LIMIT 10`
    );

    const [[vendasMes]] = await db.query(
      `SELECT COALESCE(SUM(valor_total), 0) AS total
       FROM vendas
       WHERE status <> 'cancelada'
         AND YEAR(created_at) = YEAR(CURDATE())
         AND MONTH(created_at) = MONTH(CURDATE())`
    );

    const [[caixaEntradasMes]] = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS total
       FROM caixa
       WHERE tipo_movimento = 'entrada'
         AND YEAR(data_movimento) = YEAR(CURDATE())
         AND MONTH(data_movimento) = MONTH(CURDATE())`
    );

    const [[caixaVendasMes]] = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS total
       FROM caixa
       WHERE tipo_movimento = 'entrada'
         AND origem LIKE '%Venda%'
         AND YEAR(data_movimento) = YEAR(CURDATE())
         AND MONTH(data_movimento) = MONTH(CURDATE())`
    );

    const [[estoqueVendasMes]] = await db.query(
      `SELECT COALESCE(SUM(quantidade), 0) AS total
       FROM movimentacoes_estoque
       WHERE tipo_movimento = 'saida'
         AND motivo = 'venda'
         AND YEAR(data_movimentacao) = YEAR(CURDATE())
         AND MONTH(data_movimentacao) = MONTH(CURDATE())`
    );

    return res.json({
      status: "success",
      data: {
        lucro: {
          mes: Number(lucroMes.lucro),
          ano: Number(lucroAno.lucro),
          total: Number(lucroTotal.lucro),
          por_mes: lucroMeses.map((item, index) => ({
            mes: index + 1,
            valor: Number(item.value),
          })),
          por_ano: lucroAnos,
        },
        produtos: {
          mes: produtosMes,
          ano: produtosAno,
          total: produtosTotal,
        },
        categorias: {
          mes: categoriasMes,
          ano: categoriasAno,
          total: categoriasTotal,
        },
        inadimplentes: {
          total_receber: Number(inadimplentes.total),
        },
        encomendas_proximas: encomendasProximas,
        estoque_baixo: produtosBaixoEstoque,
        lotes_proximos: lotesProximos,
        descartes: {
          total_quantidade: Number(descartesTotal.total),
          por_categoria: descartesCategoria,
          por_marca: descartesMarca,
          por_tipo: descartesTipo,
        },
        comparativo: {
          vendas_mes: Number(vendasMes.total),
          caixa_entradas_mes: Number(caixaEntradasMes.total),
          caixa_entradas_vendas_mes: Number(caixaVendasMes.total),
          estoque_saida_venda_mes: Number(estoqueVendasMes.total),
          divergencia_caixa_vendas:
            Number(vendasMes.total) - Number(caixaVendasMes.total),
        },
      },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar dashboard");
  }
};

export const getLucroMensal = async (req, res) => {
  try {
    const now = new Date();
    const ano = req.query.ano ? Number(req.query.ano) : now.getFullYear();
    const mes = req.query.mes ? Number(req.query.mes) : now.getMonth() + 1;

    if (!Number.isInteger(ano) || ano < 2000 || ano > 2200) {
      return res.status(400).json({ status: "error", message: "Ano invalido" });
    }

    if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
      return res.status(400).json({ status: "error", message: "Mes invalido" });
    }

    const [[row]] = await db.query(
      `SELECT COALESCE(SUM((iv.preco_venda_epoca - iv.preco_custo_epoca) * iv.quantidade), 0) AS lucro
       FROM itens_vendidos iv
       JOIN vendas v ON v.id = iv.venda_id
       WHERE v.status <> 'cancelada'
         AND YEAR(v.created_at) = ?
         AND MONTH(v.created_at) = ?`,
      [ano, mes]
    );

    return res.json({
      status: "success",
      data: { ano, mes, lucro: Number(row.lucro) },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar lucro mensal");
  }
};

export const getLucroAnual = async (req, res) => {
  try {
    const now = new Date();
    const ano = req.query.ano ? Number(req.query.ano) : now.getFullYear();

    if (!Number.isInteger(ano) || ano < 2000 || ano > 2200) {
      return res.status(400).json({ status: "error", message: "Ano invalido" });
    }

    const [[row]] = await db.query(
      `SELECT COALESCE(SUM((iv.preco_venda_epoca - iv.preco_custo_epoca) * iv.quantidade), 0) AS lucro
       FROM itens_vendidos iv
       JOIN vendas v ON v.id = iv.venda_id
       WHERE v.status <> 'cancelada'
         AND YEAR(v.created_at) = ?`,
      [ano]
    );

    return res.json({
      status: "success",
      data: { ano, lucro: Number(row.lucro) },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar lucro anual");
  }
};

export const getLucroTotal = async (req, res) => {
  try {
    const [[row]] = await db.query(
      `SELECT COALESCE(SUM((iv.preco_venda_epoca - iv.preco_custo_epoca) * iv.quantidade), 0) AS lucro
       FROM itens_vendidos iv
       JOIN vendas v ON v.id = iv.venda_id
       WHERE v.status <> 'cancelada'`
    );

    return res.json({ status: "success", data: { lucro: Number(row.lucro) } });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar lucro total");
  }
};

const fetchRanking = async (queryBase, order, periodoInfo) => {
  const [rows] = await db.query(
    `${queryBase} ${periodoInfo.sql} GROUP BY id, nome ORDER BY quantidade ${order} LIMIT 1`,
    periodoInfo.params
  );
  return rows.length ? rows[0] : null;
};

export const getProdutoMaisVendido = async (req, res) => {
  try {
    const periodoInfo = resolvePeriodo(req.query, "v");
    if (periodoInfo.error) {
      return res.status(400).json({ status: "error", message: periodoInfo.error });
    }

    const queryBase = `
      SELECT p.id AS id, p.nome AS nome, SUM(iv.quantidade) AS quantidade
      FROM itens_vendidos iv
      JOIN vendas v ON v.id = iv.venda_id
      JOIN produtos p ON p.id = iv.produto_id
      WHERE v.status <> 'cancelada'`;

    const item = await fetchRanking(queryBase, "DESC", periodoInfo);

    return res.json({
      status: "success",
      data: {
        periodo: { tipo: periodoInfo.periodo, ano: periodoInfo.ano, mes: periodoInfo.mes },
        item,
      },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar produto mais vendido");
  }
};

export const getProdutoMenosVendido = async (req, res) => {
  try {
    const periodoInfo = resolvePeriodo(req.query, "v");
    if (periodoInfo.error) {
      return res.status(400).json({ status: "error", message: periodoInfo.error });
    }

    const queryBase = `
      SELECT p.id AS id, p.nome AS nome, SUM(iv.quantidade) AS quantidade
      FROM itens_vendidos iv
      JOIN vendas v ON v.id = iv.venda_id
      JOIN produtos p ON p.id = iv.produto_id
      WHERE v.status <> 'cancelada'`;

    const item = await fetchRanking(queryBase, "ASC", periodoInfo);

    return res.json({
      status: "success",
      data: {
        periodo: { tipo: periodoInfo.periodo, ano: periodoInfo.ano, mes: periodoInfo.mes },
        item,
      },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar produto menos vendido");
  }
};

export const getCategoriaMaisVendida = async (req, res) => {
  try {
    const periodoInfo = resolvePeriodo(req.query, "v");
    if (periodoInfo.error) {
      return res.status(400).json({ status: "error", message: periodoInfo.error });
    }

    const queryBase = `
      SELECT c.id AS id, c.nome AS nome, SUM(iv.quantidade) AS quantidade
      FROM itens_vendidos iv
      JOIN vendas v ON v.id = iv.venda_id
      JOIN produtos p ON p.id = iv.produto_id
      JOIN categorias c ON c.id = p.categoria_id
      WHERE v.status <> 'cancelada'`;

    const item = await fetchRanking(queryBase, "DESC", periodoInfo);

    return res.json({
      status: "success",
      data: {
        periodo: { tipo: periodoInfo.periodo, ano: periodoInfo.ano, mes: periodoInfo.mes },
        item,
      },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar categoria mais vendida");
  }
};

export const getCategoriaMenosVendida = async (req, res) => {
  try {
    const periodoInfo = resolvePeriodo(req.query, "v");
    if (periodoInfo.error) {
      return res.status(400).json({ status: "error", message: periodoInfo.error });
    }

    const queryBase = `
      SELECT c.id AS id, c.nome AS nome, SUM(iv.quantidade) AS quantidade
      FROM itens_vendidos iv
      JOIN vendas v ON v.id = iv.venda_id
      JOIN produtos p ON p.id = iv.produto_id
      JOIN categorias c ON c.id = p.categoria_id
      WHERE v.status <> 'cancelada'`;

    const item = await fetchRanking(queryBase, "ASC", periodoInfo);

    return res.json({
      status: "success",
      data: {
        periodo: { tipo: periodoInfo.periodo, ano: periodoInfo.ano, mes: periodoInfo.mes },
        item,
      },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar categoria menos vendida");
  }
};

export const getClientesInadimplentes = async (req, res) => {
  try {
    const { data_de, data_ate } = req.query;
    const filters = [
      "v.status_pagamento = 'inadimplente'",
      "v.status <> 'cancelada'",
      "v.cliente_id IS NOT NULL",
    ];
    const params = [];
    const error = applyDateRange(filters, params, "v.created_at", data_de, data_ate);
    if (error) {
      return res.status(400).json({ status: "error", message: error });
    }

    const whereSql = `WHERE ${filters.join(" AND ")}`;

    const [rows] = await db.query(
      `SELECT c.id, c.nome, c.cpf, c.cnpj, c.telefone, c.email,
              COUNT(v.id) AS total_vendas,
              COALESCE(SUM(v.valor_total), 0) AS total_devido
       FROM vendas v
       JOIN clientes c ON c.id = v.cliente_id
       ${whereSql}
       GROUP BY c.id
       ORDER BY total_devido DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar clientes inadimplentes");
  }
};

export const getClientesProximosVencimento = async (req, res) => {
  try {
    const diasRaw = parsePositiveInt(req.query.dias);
    if (diasRaw === null) {
      return res.status(400).json({ status: "error", message: "Dias invalido" });
    }
    const dias = diasRaw ?? 7;

    const [rows] = await db.query(
      `SELECT c.id, c.nome, c.cpf, c.cnpj, c.telefone, c.email,
              v.id AS venda_id, v.valor_total, v.data_vencimento,
              DATEDIFF(v.data_vencimento, CURDATE()) AS dias_para_vencimento
       FROM vendas v
       JOIN clientes c ON c.id = v.cliente_id
       WHERE v.status_pagamento = 'pendente'
         AND v.status <> 'cancelada'
         AND v.data_vencimento IS NOT NULL
         AND v.data_vencimento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY v.data_vencimento ASC`,
      [dias]
    );

    return res.json({
      status: "success",
      data: { dias, registros: rows },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar clientes proximos do vencimento");
  }
};

export const getTotalReceber = async (req, res) => {
  try {
    const { data_de, data_ate } = req.query;
    const filters = [
      "status <> 'cancelada'",
      "status_pagamento IN ('pendente', 'inadimplente')",
    ];
    const params = [];
    const error = applyDateRange(filters, params, "created_at", data_de, data_ate);
    if (error) {
      return res.status(400).json({ status: "error", message: error });
    }

    const whereSql = `WHERE ${filters.join(" AND ")}`;

    const [[row]] = await db.query(
      `SELECT COALESCE(SUM(valor_total), 0) AS total
       FROM vendas
       ${whereSql}`,
      params
    );

    return res.json({ status: "success", data: { total: Number(row.total) } });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar total a receber");
  }
};

export const getEncomendasProximasPrazo = async (req, res) => {
  try {
    const diasRaw = parsePositiveInt(req.query.dias);
    if (diasRaw === null) {
      return res.status(400).json({ status: "error", message: "Dias invalido" });
    }
    const dias = diasRaw ?? 7;
    const limiteRaw = parsePositiveInt(req.query.limite);
    if (limiteRaw === null) {
      return res.status(400).json({ status: "error", message: "Limite invalido" });
    }
    const limite = limiteRaw ?? 20;

    const [rows] = await db.query(
      `SELECT e.id, f.nome AS fornecedor, p.nome AS produto,
              e.quantidade, e.prazo, e.status,
              DATEDIFF(e.prazo, CURDATE()) AS dias_para_prazo
       FROM encomendas e
       JOIN fornecedores f ON f.id = e.fornecedor_id
       JOIN produtos p ON p.id = e.produto_id
       WHERE e.prazo IS NOT NULL
         AND e.status IN ('aberta', 'confirmada')
         AND e.prazo BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY e.prazo ASC
       LIMIT ${limite}`,
      [dias]
    );

    return res.json({ status: "success", data: { dias, registros: rows } });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar encomendas proximas do prazo");
  }
};

export const getProdutosAbaixoEstoqueIdeal = async (req, res) => {
  try {
    const limiteRaw = parsePositiveInt(req.query.limite);
    if (limiteRaw === null) {
      return res.status(400).json({ status: "error", message: "Limite invalido" });
    }
    const limite = limiteRaw ?? 20;

    const [rows] = await db.query(
      `SELECT p.id AS produto_id, p.nome AS produto_nome,
              SUM(e.quantidade_atual) AS quantidade_total,
              SUM(e.nivel_ideal) AS nivel_ideal_total
       FROM estoque e
       JOIN produtos p ON p.id = e.produto_id
       GROUP BY p.id
       HAVING SUM(e.quantidade_atual) <= SUM(e.nivel_ideal)
       ORDER BY (SUM(e.nivel_ideal) - SUM(e.quantidade_atual)) DESC
       LIMIT ${limite}`
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar produtos abaixo do estoque ideal");
  }
};

export const getLotesProximosVencimento = async (req, res) => {
  try {
    const diasRaw = parsePositiveInt(req.query.dias);
    if (diasRaw === null) {
      return res.status(400).json({ status: "error", message: "Dias invalido" });
    }
    const dias = diasRaw ?? 7;
    const limiteRaw = parsePositiveInt(req.query.limite);
    if (limiteRaw === null) {
      return res.status(400).json({ status: "error", message: "Limite invalido" });
    }
    const limite = limiteRaw ?? 20;

    const [rows] = await db.query(
      `SELECT e.id, p.nome AS produto_nome, e.lote, e.validade, e.quantidade_atual,
              DATEDIFF(e.validade, CURDATE()) AS dias_para_vencimento
       FROM estoque e
       JOIN produtos p ON p.id = e.produto_id
       WHERE e.validade IS NOT NULL
         AND e.validade BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY e.validade ASC
       LIMIT ${limite}`,
      [dias]
    );

    return res.json({ status: "success", data: { dias, registros: rows } });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar lotes proximos do vencimento");
  }
};

export const getDescartesPorTipo = async (req, res) => {
  try {
    const { data_de, data_ate } = req.query;
    const filters = ["me.tipo_movimento = 'saida'", "me.motivo = 'perda_avaria'"];
    const params = [];
    const error = applyDateRange(filters, params, "me.data_movimentacao", data_de, data_ate);
    if (error) {
      return res.status(400).json({ status: "error", message: error });
    }
    const whereSql = `WHERE ${filters.join(" AND ")}`;

    const [rows] = await db.query(
      `SELECT p.id, p.nome AS tipo, COALESCE(SUM(me.quantidade), 0) AS quantidade
       FROM movimentacoes_estoque me
       JOIN produtos p ON p.id = me.produto_id
       ${whereSql}
       GROUP BY p.id
       ORDER BY quantidade DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar descartes por tipo");
  }
};

export const getDescartesPorCategoria = async (req, res) => {
  try {
    const { data_de, data_ate } = req.query;
    const filters = ["me.tipo_movimento = 'saida'", "me.motivo = 'perda_avaria'"];
    const params = [];
    const error = applyDateRange(filters, params, "me.data_movimentacao", data_de, data_ate);
    if (error) {
      return res.status(400).json({ status: "error", message: error });
    }
    const whereSql = `WHERE ${filters.join(" AND ")}`;

    const [rows] = await db.query(
      `SELECT c.id, c.nome AS categoria, COALESCE(SUM(me.quantidade), 0) AS quantidade
       FROM movimentacoes_estoque me
       JOIN produtos p ON p.id = me.produto_id
       JOIN categorias c ON c.id = p.categoria_id
       ${whereSql}
       GROUP BY c.id
       ORDER BY quantidade DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar descartes por categoria");
  }
};

export const getDescartesPorMarca = async (req, res) => {
  try {
    const { data_de, data_ate } = req.query;
    const filters = ["me.tipo_movimento = 'saida'", "me.motivo = 'perda_avaria'"];
    const params = [];
    const error = applyDateRange(filters, params, "me.data_movimentacao", data_de, data_ate);
    if (error) {
      return res.status(400).json({ status: "error", message: error });
    }
    const whereSql = `WHERE ${filters.join(" AND ")}`;

    const [rows] = await db.query(
      `SELECT COALESCE(p.marca, 'Sem marca') AS marca, COALESCE(SUM(me.quantidade), 0) AS quantidade
       FROM movimentacoes_estoque me
       JOIN produtos p ON p.id = me.produto_id
       ${whereSql}
       GROUP BY p.marca
       ORDER BY quantidade DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar descartes por marca");
  }
};

const buildVendasFuncionarioFilters = (query) => {
  const { data_de, data_ate, usuario_id } = query;
  const filters = ["v.status <> 'cancelada'"];
  const params = [];

  const usuarioId = parsePositiveInt(usuario_id);
  if (usuario_id !== undefined && usuarioId === null) {
    return { error: "Usuario invalido" };
  }
  if (usuarioId) {
    filters.push("v.usuario_id = ?");
    params.push(usuarioId);
  }

  const dateError = applyDateRange(filters, params, "v.created_at", data_de, data_ate);
  if (dateError) {
    return { error: dateError };
  }

  return { filters, params };
};

export const getVendasPorFuncionarioDia = async (req, res) => {
  try {
    const filterInfo = buildVendasFuncionarioFilters(req.query);
    if (filterInfo.error) {
      return res.status(400).json({ status: "error", message: filterInfo.error });
    }
    const whereSql = filterInfo.filters.length
      ? `WHERE ${filterInfo.filters.join(" AND ")}`
      : "";

    const [rows] = await db.query(
      `SELECT u.id AS usuario_id, u.nome AS usuario_nome,
              DATE(v.created_at) AS dia,
              COUNT(v.id) AS total_vendas,
              COALESCE(SUM(v.valor_total), 0) AS valor_total
       FROM vendas v
       JOIN usuarios u ON u.id = v.usuario_id
       ${whereSql}
       GROUP BY u.id, DATE(v.created_at)
       ORDER BY dia DESC, valor_total DESC`,
      filterInfo.params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar vendas por funcionario (dia)");
  }
};

export const getVendasPorFuncionarioSemana = async (req, res) => {
  try {
    const filterInfo = buildVendasFuncionarioFilters(req.query);
    if (filterInfo.error) {
      return res.status(400).json({ status: "error", message: filterInfo.error });
    }
    const whereSql = filterInfo.filters.length
      ? `WHERE ${filterInfo.filters.join(" AND ")}`
      : "";

    const [rows] = await db.query(
      `SELECT u.id AS usuario_id, u.nome AS usuario_nome,
              YEAR(v.created_at) AS ano,
              WEEK(v.created_at, 1) AS semana,
              COUNT(v.id) AS total_vendas,
              COALESCE(SUM(v.valor_total), 0) AS valor_total
       FROM vendas v
       JOIN usuarios u ON u.id = v.usuario_id
       ${whereSql}
       GROUP BY u.id, YEAR(v.created_at), WEEK(v.created_at, 1)
       ORDER BY ano DESC, semana DESC, valor_total DESC`,
      filterInfo.params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar vendas por funcionario (semana)");
  }
};

export const getVendasPorFuncionarioMes = async (req, res) => {
  try {
    const filterInfo = buildVendasFuncionarioFilters(req.query);
    if (filterInfo.error) {
      return res.status(400).json({ status: "error", message: filterInfo.error });
    }
    const whereSql = filterInfo.filters.length
      ? `WHERE ${filterInfo.filters.join(" AND ")}`
      : "";

    const [rows] = await db.query(
      `SELECT u.id AS usuario_id, u.nome AS usuario_nome,
              YEAR(v.created_at) AS ano,
              MONTH(v.created_at) AS mes,
              COUNT(v.id) AS total_vendas,
              COALESCE(SUM(v.valor_total), 0) AS valor_total
       FROM vendas v
       JOIN usuarios u ON u.id = v.usuario_id
       ${whereSql}
       GROUP BY u.id, YEAR(v.created_at), MONTH(v.created_at)
       ORDER BY ano DESC, mes DESC, valor_total DESC`,
      filterInfo.params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar vendas por funcionario (mes)");
  }
};

export const getVendasPorFuncionarioAno = async (req, res) => {
  try {
    const filterInfo = buildVendasFuncionarioFilters(req.query);
    if (filterInfo.error) {
      return res.status(400).json({ status: "error", message: filterInfo.error });
    }
    const whereSql = filterInfo.filters.length
      ? `WHERE ${filterInfo.filters.join(" AND ")}`
      : "";

    const [rows] = await db.query(
      `SELECT u.id AS usuario_id, u.nome AS usuario_nome,
              YEAR(v.created_at) AS ano,
              COUNT(v.id) AS total_vendas,
              COALESCE(SUM(v.valor_total), 0) AS valor_total
       FROM vendas v
       JOIN usuarios u ON u.id = v.usuario_id
       ${whereSql}
       GROUP BY u.id, YEAR(v.created_at)
       ORDER BY ano DESC, valor_total DESC`,
      filterInfo.params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar vendas por funcionario (ano)");
  }
};

export const getComparativoCaixaVendas = async (req, res) => {
  try {
    const { data_de, data_ate } = req.query;
    if (data_de && !isValidDateTime(data_de)) {
      return res.status(400).json({ status: "error", message: "Data inicial invalida" });
    }
    if (data_ate && !isValidDateTime(data_ate)) {
      return res.status(400).json({ status: "error", message: "Data final invalida" });
    }

    const vendaFilters = ["status <> 'cancelada'"];
    const vendaParams = [];
    if (data_de) {
      vendaFilters.push("created_at >= ?");
      vendaParams.push(data_de);
    }
    if (data_ate) {
      vendaFilters.push("created_at <= ?");
      vendaParams.push(data_ate);
    }
    const whereVendas = vendaFilters.length ? `WHERE ${vendaFilters.join(" AND ")}` : "";

    const caixaFilters = [];
    const caixaParams = [];
    if (data_de) {
      caixaFilters.push("data_movimento >= ?");
      caixaParams.push(data_de);
    }
    if (data_ate) {
      caixaFilters.push("data_movimento <= ?");
      caixaParams.push(data_ate);
    }
    const whereCaixa = caixaFilters.length ? `WHERE ${caixaFilters.join(" AND ")}` : "";

    const [[vendasTotais]] = await db.query(
      `SELECT COALESCE(SUM(valor_total), 0) AS total_vendas FROM vendas ${whereVendas}`,
      vendaParams
    );

    const [[caixaEntradas]] = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS total_caixa_entradas
       FROM caixa ${whereCaixa} ${whereCaixa ? "AND" : "WHERE"} tipo_movimento = 'entrada'`,
      caixaParams
    );

    const [[caixaEntradasVenda]] = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS total_caixa_vendas
       FROM caixa ${whereCaixa} ${whereCaixa ? "AND" : "WHERE"} tipo_movimento = 'entrada' AND origem LIKE '%Venda%'`,
      caixaParams
    );

    return res.json({
      status: "success",
      data: {
        periodo: { data_de: data_de ?? null, data_ate: data_ate ?? null },
        vendas: { total_vendas: vendasTotais.total_vendas },
        caixa: {
          total_entradas: caixaEntradas.total_caixa_entradas,
          total_entradas_venda: caixaEntradasVenda.total_caixa_vendas,
          divergencia_vendas_caixa:
            Number(vendasTotais.total_vendas) - Number(caixaEntradasVenda.total_caixa_vendas),
        },
      },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar comparativo caixa x vendas");
  }
};

export const getComparativoVendasEstoque = async (req, res) => {
  try {
    const { data_de, data_ate } = req.query;
    if (data_de && !isValidDateTime(data_de)) {
      return res.status(400).json({ status: "error", message: "Data inicial invalida" });
    }
    if (data_ate && !isValidDateTime(data_ate)) {
      return res.status(400).json({ status: "error", message: "Data final invalida" });
    }

    const vendaFilters = ["v.status <> 'cancelada'"];
    const vendaParams = [];
    if (data_de) {
      vendaFilters.push("v.created_at >= ?");
      vendaParams.push(data_de);
    }
    if (data_ate) {
      vendaFilters.push("v.created_at <= ?");
      vendaParams.push(data_ate);
    }
    const whereVendas = vendaFilters.length ? `WHERE ${vendaFilters.join(" AND ")}` : "";

    const movFilters = ["tipo_movimento = 'saida'", "motivo = 'venda'"];
    const movParams = [];
    if (data_de) {
      movFilters.push("data_movimentacao >= ?");
      movParams.push(data_de);
    }
    if (data_ate) {
      movFilters.push("data_movimentacao <= ?");
      movParams.push(data_ate);
    }
    const whereMov = movFilters.length ? `WHERE ${movFilters.join(" AND ")}` : "";

    const [[itensTotais]] = await db.query(
      `SELECT COALESCE(SUM(iv.quantidade), 0) AS quantidade_itens,
              COALESCE(SUM(iv.quantidade * iv.preco_venda_epoca), 0) AS total_vendido
       FROM itens_vendidos iv
       JOIN vendas v ON v.id = iv.venda_id
       ${whereVendas}`,
      vendaParams
    );

    const [[estoqueSaida]] = await db.query(
      `SELECT COALESCE(SUM(quantidade), 0) AS quantidade_saida
       FROM movimentacoes_estoque
       ${whereMov}`,
      movParams
    );

    return res.json({
      status: "success",
      data: {
        periodo: { data_de: data_de ?? null, data_ate: data_ate ?? null },
        vendas: {
          quantidade_itens: itensTotais.quantidade_itens,
          total_vendido: itensTotais.total_vendido,
        },
        estoque: {
          quantidade_saida_venda: estoqueSaida.quantidade_saida,
          divergencia_itens_saida:
            Number(itensTotais.quantidade_itens) - Number(estoqueSaida.quantidade_saida),
        },
      },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar comparativo vendas x estoque");
  }
};

export const getComparativoVendasEstoqueCaixa = async (req, res) => {
  try {
    const { data_de, data_ate } = req.query;
    if (data_de && !isValidDateTime(data_de)) {
      return res.status(400).json({ status: "error", message: "Data inicial invalida" });
    }
    if (data_ate && !isValidDateTime(data_ate)) {
      return res.status(400).json({ status: "error", message: "Data final invalida" });
    }

    const vendaFilters = ["status <> 'cancelada'"];
    const vendaParams = [];
    if (data_de) {
      vendaFilters.push("created_at >= ?");
      vendaParams.push(data_de);
    }
    if (data_ate) {
      vendaFilters.push("created_at <= ?");
      vendaParams.push(data_ate);
    }
    const whereVendas = vendaFilters.length ? `WHERE ${vendaFilters.join(" AND ")}` : "";

    const vendaJoinFilters = ["v.status <> 'cancelada'"];
    const vendaJoinParams = [];
    if (data_de) {
      vendaJoinFilters.push("v.created_at >= ?");
      vendaJoinParams.push(data_de);
    }
    if (data_ate) {
      vendaJoinFilters.push("v.created_at <= ?");
      vendaJoinParams.push(data_ate);
    }
    const whereVendasJoin = vendaJoinFilters.length
      ? `WHERE ${vendaJoinFilters.join(" AND ")}`
      : "";

    const caixaFilters = [];
    const caixaParams = [];
    if (data_de) {
      caixaFilters.push("data_movimento >= ?");
      caixaParams.push(data_de);
    }
    if (data_ate) {
      caixaFilters.push("data_movimento <= ?");
      caixaParams.push(data_ate);
    }
    const whereCaixa = caixaFilters.length ? `WHERE ${caixaFilters.join(" AND ")}` : "";

    const movFilters = ["tipo_movimento = 'saida'", "motivo = 'venda'"];
    const movParams = [];
    if (data_de) {
      movFilters.push("data_movimentacao >= ?");
      movParams.push(data_de);
    }
    if (data_ate) {
      movFilters.push("data_movimentacao <= ?");
      movParams.push(data_ate);
    }
    const whereMov = movFilters.length ? `WHERE ${movFilters.join(" AND ")}` : "";

    const [[vendasTotais]] = await db.query(
      `SELECT COALESCE(SUM(valor_total), 0) AS total_vendas FROM vendas ${whereVendas}`,
      vendaParams
    );

    const [[itensTotais]] = await db.query(
      `SELECT COALESCE(SUM(iv.quantidade), 0) AS quantidade_itens,
              COALESCE(SUM(iv.quantidade * iv.preco_venda_epoca), 0) AS total_itens_vendidos
       FROM itens_vendidos iv
       JOIN vendas v ON v.id = iv.venda_id
       ${whereVendasJoin}`,
      vendaJoinParams
    );

    const [[estoqueSaida]] = await db.query(
      `SELECT COALESCE(SUM(quantidade), 0) AS quantidade_saida
       FROM movimentacoes_estoque
       ${whereMov}`,
      movParams
    );

    const [[caixaEntradas]] = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS total_caixa_entradas
       FROM caixa ${whereCaixa} ${whereCaixa ? "AND" : "WHERE"} tipo_movimento = 'entrada'`,
      caixaParams
    );

    const [[caixaEntradasVenda]] = await db.query(
      `SELECT COALESCE(SUM(valor), 0) AS total_caixa_vendas
       FROM caixa ${whereCaixa} ${whereCaixa ? "AND" : "WHERE"} tipo_movimento = 'entrada' AND origem LIKE '%Venda%'`,
      caixaParams
    );

    return res.json({
      status: "success",
      data: {
        periodo: { data_de: data_de ?? null, data_ate: data_ate ?? null },
        vendas: {
          total_vendas: vendasTotais.total_vendas,
          quantidade_itens: itensTotais.quantidade_itens,
          total_itens_vendidos: itensTotais.total_itens_vendidos,
        },
        estoque: {
          quantidade_saida_venda: estoqueSaida.quantidade_saida,
          divergencia_itens_saida:
            Number(itensTotais.quantidade_itens) - Number(estoqueSaida.quantidade_saida),
        },
        caixa: {
          total_entradas: caixaEntradas.total_caixa_entradas,
          total_entradas_venda: caixaEntradasVenda.total_caixa_vendas,
          divergencia_vendas_caixa:
            Number(vendasTotais.total_vendas) - Number(caixaEntradasVenda.total_caixa_vendas),
        },
      },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao carregar comparativo vendas x estoque x caixa");
  }
};
