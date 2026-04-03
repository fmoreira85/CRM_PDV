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
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isValidValor = (value) => {
  const numberValue = Number(value);
  return !Number.isNaN(numberValue) && numberValue > 0;
};

const ensureUsuario = async (usuario_id) => {
  const [rows] = await db.query("SELECT id FROM usuarios WHERE id = ?", [usuario_id]);
  return rows.length > 0;
};

export const listDespesas = async (req, res) => {
  try {
    const { mes, ano, data_de, data_ate } = req.query;

    const filters = [];
    const params = [];

    if (mes !== undefined) {
      const mesNumber = parseNumber(mes);
      if (!mesNumber || mesNumber < 1 || mesNumber > 12) {
        return res.status(400).json({ status: "error", message: "Mes invalido" });
      }

      if (!ano) {
        return res
          .status(400)
          .json({ status: "error", message: "Ano obrigatorio para filtro por mes" });
      }

      filters.push("MONTH(d.data) = ?");
      params.push(mesNumber);
    }

    if (ano !== undefined) {
      const anoNumber = parseNumber(ano);
      if (!anoNumber || anoNumber < 1900) {
        return res.status(400).json({ status: "error", message: "Ano invalido" });
      }

      filters.push("YEAR(d.data) = ?");
      params.push(anoNumber);
    }

    if (data_de) {
      if (!isValidDate(data_de)) {
        return res.status(400).json({ status: "error", message: "Data inicial invalida" });
      }
      filters.push("d.data >= ?");
      params.push(data_de);
    }

    if (data_ate) {
      if (!isValidDate(data_ate)) {
        return res.status(400).json({ status: "error", message: "Data final invalida" });
      }
      filters.push("d.data <= ?");
      params.push(data_ate);
    }

    const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT
        d.id,
        d.valor,
        d.descricao,
        d.categoria,
        d.data,
        d.usuario_id,
        u.nome AS usuario_nome,
        d.created_at,
        d.updated_at
      FROM despesas d
      JOIN usuarios u ON u.id = d.usuario_id
      ${whereSql}
      ORDER BY d.data DESC, d.id DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao listar despesas");
  }
};

export const getDespesa = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        d.id,
        d.valor,
        d.descricao,
        d.categoria,
        d.data,
        d.usuario_id,
        u.nome AS usuario_nome,
        d.created_at,
        d.updated_at
      FROM despesas d
      JOIN usuarios u ON u.id = d.usuario_id
      WHERE d.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Despesa nao encontrada" });
    }

    return res.json({ status: "success", data: rows[0] });
  } catch (error) {
    return handleError(res, error, "Erro ao buscar despesa");
  }
};

export const createDespesa = async (req, res) => {
  try {
    const { valor, descricao, categoria, data } = req.body;
    const usuario_id = req.body.usuario_id ?? req.user?.id;

    if (!descricao || !categoria || !data || !usuario_id || valor === undefined) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    if (!isValidValor(valor)) {
      return res.status(400).json({ status: "error", message: "Valor invalido" });
    }

    if (!isValidDate(data)) {
      return res.status(400).json({ status: "error", message: "Data invalida" });
    }

    const usuarioExiste = await ensureUsuario(usuario_id);
    if (!usuarioExiste) {
      return res.status(400).json({ status: "error", message: "Usuario invalido" });
    }

    const [result] = await db.query(
      "INSERT INTO despesas (valor, descricao, categoria, data, usuario_id) VALUES (?, ?, ?, ?, ?)",
      [valor, descricao, categoria, data, usuario_id]
    );

    return res.status(201).json({
      status: "success",
      message: "Despesa criada",
      data: { id: result.insertId },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao criar despesa");
  }
};

export const updateDespesa = async (req, res) => {
  try {
    const [currentRows] = await db.query("SELECT * FROM despesas WHERE id = ?", [
      req.params.id,
    ]);

    if (currentRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Despesa nao encontrada" });
    }

    const current = currentRows[0];

    const payload = {
      valor: req.body.valor ?? current.valor,
      descricao: req.body.descricao ?? current.descricao,
      categoria: req.body.categoria ?? current.categoria,
      data: req.body.data ?? current.data,
      usuario_id: req.body.usuario_id ?? current.usuario_id,
    };

    if (!payload.descricao || !payload.categoria || !payload.data || !payload.usuario_id) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    if (!isValidValor(payload.valor)) {
      return res.status(400).json({ status: "error", message: "Valor invalido" });
    }

    if (!isValidDate(payload.data)) {
      return res.status(400).json({ status: "error", message: "Data invalida" });
    }

    const usuarioExiste = await ensureUsuario(payload.usuario_id);
    if (!usuarioExiste) {
      return res.status(400).json({ status: "error", message: "Usuario invalido" });
    }

    const [result] = await db.query(
      "UPDATE despesas SET valor = ?, descricao = ?, categoria = ?, data = ?, usuario_id = ? WHERE id = ?",
      [
        payload.valor,
        payload.descricao,
        payload.categoria,
        payload.data,
        payload.usuario_id,
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Despesa nao encontrada" });
    }

    return res.json({ status: "success", message: "Despesa atualizada" });
  } catch (error) {
    return handleError(res, error, "Erro ao atualizar despesa");
  }
};

export const deleteDespesa = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM despesas WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Despesa nao encontrada" });
    }

    return res.json({ status: "success", message: "Despesa removida" });
  } catch (error) {
    return handleError(res, error, "Erro ao remover despesa");
  }
};
