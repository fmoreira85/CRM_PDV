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

export const listProdutos = async (req, res) => {
  try {
    const {
      nome,
      marca,
      categoria,
      subcategoria,
      categoria_id,
      subcategoria_id,
      ativo,
    } = req.query;

    const ativoValue = parseAtivo(ativo);
    if (ativo !== undefined && ativoValue !== 0 && ativoValue !== 1) {
      return res.status(400).json({ status: "error", message: "Filtro ativo invalido" });
    }

    const categoriaId = parseNumber(categoria_id);
    if (categoria_id !== undefined && categoriaId === undefined) {
      return res.status(400).json({ status: "error", message: "Categoria invalida" });
    }

    const subcategoriaId = parseNumber(subcategoria_id);
    if (subcategoria_id !== undefined && subcategoriaId === undefined) {
      return res.status(400).json({ status: "error", message: "Subcategoria invalida" });
    }

    const filters = [];
    const params = [];

    if (nome) {
      filters.push("p.nome LIKE ?");
      params.push(`%${nome}%`);
    }

    if (marca) {
      filters.push("p.marca LIKE ?");
      params.push(`%${marca}%`);
    }

    if (categoria) {
      filters.push("c.nome LIKE ?");
      params.push(`%${categoria}%`);
    }

    if (subcategoria) {
      filters.push("s.nome LIKE ?");
      params.push(`%${subcategoria}%`);
    }

    if (categoriaId !== undefined) {
      filters.push("p.categoria_id = ?");
      params.push(categoriaId);
    }

    if (subcategoriaId !== undefined) {
      filters.push("p.subcategoria_id = ?");
      params.push(subcategoriaId);
    }

    if (ativoValue !== undefined) {
      filters.push("p.ativo = ?");
      params.push(ativoValue);
    }

    const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT
        p.id,
        p.nome,
        p.descricao,
        p.marca,
        p.categoria_id,
        c.nome AS categoria_nome,
        p.subcategoria_id,
        s.nome AS subcategoria_nome,
        p.preco_custo_atual,
        p.preco_venda_atual,
        p.unidade,
        p.ativo,
        p.created_at,
        p.updated_at
      FROM produtos p
      JOIN categorias c ON c.id = p.categoria_id
      LEFT JOIN subcategorias s ON s.id = p.subcategoria_id
      ${whereSql}
      ORDER BY p.id DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao listar produtos");
  }
};

export const getProduto = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        p.id,
        p.nome,
        p.descricao,
        p.marca,
        p.categoria_id,
        c.nome AS categoria_nome,
        p.subcategoria_id,
        s.nome AS subcategoria_nome,
        p.preco_custo_atual,
        p.preco_venda_atual,
        p.unidade,
        p.ativo,
        p.created_at,
        p.updated_at
      FROM produtos p
      JOIN categorias c ON c.id = p.categoria_id
      LEFT JOIN subcategorias s ON s.id = p.subcategoria_id
      WHERE p.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Produto nao encontrado" });
    }

    return res.json({ status: "success", data: rows[0] });
  } catch (error) {
    return handleError(res, error, "Erro ao buscar produto");
  }
};

export const createProduto = async (req, res) => {
  try {
    const { nome, categoria_id, preco_custo_atual, preco_venda_atual, unidade } =
      req.body;

    if (!nome || !categoria_id || !preco_custo_atual || !preco_venda_atual || !unidade) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    const categoriaId = Number(categoria_id);
    if (Number.isNaN(categoriaId)) {
      return res.status(400).json({ status: "error", message: "Categoria invalida" });
    }

    const subcategoriaId =
      req.body.subcategoria_id !== undefined && req.body.subcategoria_id !== null
        ? Number(req.body.subcategoria_id)
        : null;

    if (subcategoriaId !== null && Number.isNaN(subcategoriaId)) {
      return res.status(400).json({ status: "error", message: "Subcategoria invalida" });
    }

    const ativoValue = parseAtivo(req.body.ativo);
    if (ativoValue !== undefined && ativoValue !== 0 && ativoValue !== 1) {
      return res.status(400).json({ status: "error", message: "Campo ativo invalido" });
    }

    const descricao = req.body.descricao ?? null;
    const marca = req.body.marca ?? null;

    const [result] = await db.query(
      "INSERT INTO produtos (nome, descricao, marca, categoria_id, subcategoria_id, preco_custo_atual, preco_venda_atual, unidade, ativo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        nome,
        descricao,
        marca,
        categoriaId,
        subcategoriaId,
        preco_custo_atual,
        preco_venda_atual,
        unidade,
        ativoValue ?? 1,
      ]
    );

    return res.status(201).json({
      status: "success",
      message: "Produto criado",
      data: { id: result.insertId },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao criar produto");
  }
};

export const updateProduto = async (req, res) => {
  try {
    const [currentRows] = await db.query("SELECT * FROM produtos WHERE id = ?", [
      req.params.id,
    ]);

    if (currentRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Produto nao encontrado" });
    }

    const current = currentRows[0];

    const payload = {
      nome: req.body.nome ?? current.nome,
      descricao: req.body.descricao ?? current.descricao,
      marca: req.body.marca ?? current.marca,
      categoria_id: req.body.categoria_id ?? current.categoria_id,
      subcategoria_id:
        req.body.subcategoria_id !== undefined
          ? req.body.subcategoria_id
          : current.subcategoria_id,
      preco_custo_atual: req.body.preco_custo_atual ?? current.preco_custo_atual,
      preco_venda_atual: req.body.preco_venda_atual ?? current.preco_venda_atual,
      unidade: req.body.unidade ?? current.unidade,
      ativo: req.body.ativo !== undefined ? parseAtivo(req.body.ativo) : current.ativo,
    };

    if (!payload.nome || !payload.categoria_id || !payload.preco_custo_atual || !payload.preco_venda_atual || !payload.unidade) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    const categoriaId = Number(payload.categoria_id);
    if (Number.isNaN(categoriaId)) {
      return res.status(400).json({ status: "error", message: "Categoria invalida" });
    }

    const subcategoriaId =
      payload.subcategoria_id !== null && payload.subcategoria_id !== undefined
        ? Number(payload.subcategoria_id)
        : null;

    if (subcategoriaId !== null && Number.isNaN(subcategoriaId)) {
      return res.status(400).json({ status: "error", message: "Subcategoria invalida" });
    }

    if (payload.ativo !== 0 && payload.ativo !== 1) {
      return res.status(400).json({ status: "error", message: "Campo ativo invalido" });
    }

    const [result] = await db.query(
      "UPDATE produtos SET nome = ?, descricao = ?, marca = ?, categoria_id = ?, subcategoria_id = ?, preco_custo_atual = ?, preco_venda_atual = ?, unidade = ?, ativo = ? WHERE id = ?",
      [
        payload.nome,
        payload.descricao,
        payload.marca,
        categoriaId,
        subcategoriaId,
        payload.preco_custo_atual,
        payload.preco_venda_atual,
        payload.unidade,
        payload.ativo,
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Produto nao encontrado" });
    }

    return res.json({ status: "success", message: "Produto atualizado" });
  } catch (error) {
    return handleError(res, error, "Erro ao atualizar produto");
  }
};

export const deleteProduto = async (req, res) => {
  try {
    const [result] = await db.query(
      "UPDATE produtos SET ativo = 0 WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Produto nao encontrado" });
    }

    return res.json({ status: "success", message: "Produto inativado" });
  } catch (error) {
    return handleError(res, error, "Erro ao inativar produto");
  }
};
