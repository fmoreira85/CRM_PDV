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

const isValidEmail = (value) =>
  !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).toLowerCase());

export const listFornecedores = async (req, res) => {
  try {
    const { id, nome, cnpj, telefone, email, ativo } = req.query;

    const filters = [];
    const params = [];

    if (id) {
      const idNumber = Number(id);
      if (Number.isNaN(idNumber)) {
        return res.status(400).json({ status: "error", message: "Id invalido" });
      }
      filters.push("id = ?");
      params.push(idNumber);
    }

    if (nome) {
      filters.push("nome LIKE ?");
      params.push(`%${nome}%`);
    }

    if (cnpj) {
      filters.push("cnpj LIKE ?");
      params.push(`%${cnpj}%`);
    }

    if (telefone) {
      filters.push("telefone LIKE ?");
      params.push(`%${telefone}%`);
    }

    if (email) {
      filters.push("email LIKE ?");
      params.push(`%${email}%`);
    }

    const ativoValue = parseAtivo(ativo);
    if (ativo !== undefined) {
      if (ativoValue !== 0 && ativoValue !== 1) {
        return res.status(400).json({ status: "error", message: "Filtro ativo invalido" });
      }
      filters.push("ativo = ?");
      params.push(ativoValue);
    }

    const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT id, nome, razao_social, cpf, cnpj, telefone, email, endereco, contato_nome, contato_telefone, ativo, created_at, updated_at
       FROM fornecedores
       ${whereSql}
       ORDER BY id DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao listar fornecedores");
  }
};

export const getFornecedor = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nome, razao_social, cpf, cnpj, telefone, email, endereco, contato_nome, contato_telefone, ativo, created_at, updated_at FROM fornecedores WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Fornecedor nao encontrado" });
    }

    return res.json({ status: "success", data: rows[0] });
  } catch (error) {
    return handleError(res, error, "Erro ao buscar fornecedor");
  }
};

export const createFornecedor = async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    const razao_social = req.body.razao_social ?? null;
    const cpf = req.body.cpf ?? null;
    const cnpj = req.body.cnpj ?? null;
    const telefone = req.body.telefone ?? null;
    const email = req.body.email ?? null;
    const endereco = req.body.endereco ?? null;
    const contato_nome = req.body.contato_nome ?? null;
    const contato_telefone = req.body.contato_telefone ?? null;
    const ativo = req.body.ativo ?? 1;

    if (!isValidEmail(email)) {
      return res.status(400).json({ status: "error", message: "Email invalido" });
    }

    if (cnpj) {
      const [existing] = await db.query("SELECT id FROM fornecedores WHERE cnpj = ?", [
        cnpj,
      ]);
      if (existing.length > 0) {
        return res.status(409).json({ status: "error", message: "CNPJ ja cadastrado" });
      }
    }

    const [result] = await db.query(
      "INSERT INTO fornecedores (nome, razao_social, cpf, cnpj, telefone, email, endereco, contato_nome, contato_telefone, ativo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        nome,
        razao_social,
        cpf,
        cnpj,
        telefone,
        email,
        endereco,
        contato_nome,
        contato_telefone,
        ativo,
      ]
    );

    return res.status(201).json({
      status: "success",
      message: "Fornecedor criado",
      data: { id: result.insertId },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao criar fornecedor");
  }
};

export const updateFornecedor = async (req, res) => {
  try {
    const [currentRows] = await db.query("SELECT * FROM fornecedores WHERE id = ?", [
      req.params.id,
    ]);

    if (currentRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Fornecedor nao encontrado" });
    }

    const current = currentRows[0];

    const payload = {
      nome: req.body.nome ?? current.nome,
      razao_social: req.body.razao_social ?? current.razao_social,
      cpf: req.body.cpf ?? current.cpf,
      cnpj: req.body.cnpj ?? current.cnpj,
      telefone: req.body.telefone ?? current.telefone,
      email: req.body.email ?? current.email,
      endereco: req.body.endereco ?? current.endereco,
      contato_nome: req.body.contato_nome ?? current.contato_nome,
      contato_telefone: req.body.contato_telefone ?? current.contato_telefone,
      ativo: req.body.ativo ?? current.ativo,
    };

    if (!payload.nome) {
      return res
        .status(400)
        .json({ status: "error", message: "Campos obrigatorios nao informados" });
    }

    if (!isValidEmail(payload.email)) {
      return res.status(400).json({ status: "error", message: "Email invalido" });
    }

    if (payload.cnpj && payload.cnpj !== current.cnpj) {
      const [existing] = await db.query(
        "SELECT id FROM fornecedores WHERE cnpj = ? AND id <> ?",
        [payload.cnpj, req.params.id]
      );
      if (existing.length > 0) {
        return res.status(409).json({ status: "error", message: "CNPJ ja cadastrado" });
      }
    }

    const [result] = await db.query(
      "UPDATE fornecedores SET nome = ?, razao_social = ?, cpf = ?, cnpj = ?, telefone = ?, email = ?, endereco = ?, contato_nome = ?, contato_telefone = ?, ativo = ? WHERE id = ?",
      [
        payload.nome,
        payload.razao_social,
        payload.cpf,
        payload.cnpj,
        payload.telefone,
        payload.email,
        payload.endereco,
        payload.contato_nome,
        payload.contato_telefone,
        payload.ativo,
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Fornecedor nao encontrado" });
    }

    return res.json({ status: "success", message: "Fornecedor atualizado" });
  } catch (error) {
    return handleError(res, error, "Erro ao atualizar fornecedor");
  }
};

export const deleteFornecedor = async (req, res) => {
  try {
    const [result] = await db.query("UPDATE fornecedores SET ativo = 0 WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Fornecedor nao encontrado" });
    }

    return res.json({ status: "success", message: "Fornecedor inativado" });
  } catch (error) {
    return handleError(res, error, "Erro ao inativar fornecedor");
  }
};
