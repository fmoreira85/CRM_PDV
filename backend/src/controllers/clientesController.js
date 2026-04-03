import { getConnection } from "../../connections.js";

const db = getConnection();
const VALID_TIPO_PESSOA = ["fisica", "juridica"];
const VALID_TIPO_CLIENTE = ["cliente", "nao_cliente"];
const VALID_STATUS = ["ok", "pendente", "inadimplente"];

const handleError = (res, error, message) => {
  console.error(error);
  return res.status(500).json({ status: "error", message });
};

const normalize = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return value;
};

const isValidDate = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const validateClientePayload = ({
  nome,
  cpf,
  cnpj,
  tipo_pessoa,
  tipo_cliente,
  status_pagamento,
  data_vencimento,
}) => {
  if (!nome || !tipo_pessoa || !tipo_cliente) {
    return "Campos obrigatorios nao informados";
  }

  if (!VALID_TIPO_PESSOA.includes(tipo_pessoa)) {
    return "Tipo de pessoa invalido";
  }

  if (!VALID_TIPO_CLIENTE.includes(tipo_cliente)) {
    return "Tipo de cliente invalido";
  }

  if (status_pagamento && !VALID_STATUS.includes(status_pagamento)) {
    return "Status de pagamento invalido";
  }

  if (data_vencimento && !isValidDate(data_vencimento)) {
    return "Data de vencimento invalida";
  }

  if (tipo_pessoa === "fisica") {
    if (!cpf) {
      return "CPF e obrigatorio para pessoa fisica";
    }
    if (cnpj) {
      return "CNPJ nao deve ser informado para pessoa fisica";
    }
  }

  if (tipo_pessoa === "juridica") {
    if (!cnpj) {
      return "CNPJ e obrigatorio para pessoa juridica";
    }
    if (cpf) {
      return "CPF nao deve ser informado para pessoa juridica";
    }
  }

  return null;
};

export const listClientes = async (req, res) => {
  try {
    const {
      id,
      nome,
      cpf,
      cnpj,
      telefone,
      tipo_pessoa,
      tipo_cliente,
      status_pagamento,
      inadimplentes,
      no_prazo,
      proximos_vencimento,
      dias_proximos,
    } = req.query;

    if (tipo_pessoa && !VALID_TIPO_PESSOA.includes(tipo_pessoa)) {
      return res.status(400).json({ status: "error", message: "Tipo de pessoa invalido" });
    }

    if (tipo_cliente && !VALID_TIPO_CLIENTE.includes(tipo_cliente)) {
      return res.status(400).json({ status: "error", message: "Tipo de cliente invalido" });
    }

    if (status_pagamento && !VALID_STATUS.includes(status_pagamento)) {
      return res
        .status(400)
        .json({ status: "error", message: "Status de pagamento invalido" });
    }

    const filters = [];
    const params = [];

    if (id) {
      filters.push("c.id = ?");
      params.push(Number(id));
    }

    if (nome) {
      filters.push("c.nome LIKE ?");
      params.push(`%${nome}%`);
    }

    if (cpf) {
      filters.push("c.cpf LIKE ?");
      params.push(`%${cpf}%`);
    }

    if (cnpj) {
      filters.push("c.cnpj LIKE ?");
      params.push(`%${cnpj}%`);
    }

    if (telefone) {
      filters.push("c.telefone LIKE ?");
      params.push(`%${telefone}%`);
    }

    if (tipo_pessoa) {
      filters.push("c.tipo_pessoa = ?");
      params.push(tipo_pessoa);
    }

    if (tipo_cliente) {
      filters.push("c.tipo_cliente = ?");
      params.push(tipo_cliente);
    }

    if (status_pagamento) {
      filters.push("c.status_pagamento = ?");
      params.push(status_pagamento);
    }

    if (inadimplentes === "1" || inadimplentes === "true") {
      filters.push("c.status_pagamento = 'inadimplente'");
    }

    if (no_prazo === "1" || no_prazo === "true") {
      filters.push(
        "c.status_pagamento IN ('ok', 'pendente') AND (c.data_vencimento IS NULL OR c.data_vencimento >= CURDATE())"
      );
    }

    if (proximos_vencimento === "1" || proximos_vencimento === "true") {
      const dias = Number(dias_proximos) || 7;
      filters.push(
        "c.data_vencimento IS NOT NULL AND c.status_pagamento IN ('ok', 'pendente') AND c.data_vencimento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)"
      );
      params.push(dias);
    }

    const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT
        c.id,
        c.nome,
        c.cpf,
        c.cnpj,
        c.telefone,
        c.email,
        c.endereco,
        c.tipo_pessoa,
        c.tipo_cliente,
        c.status_pagamento,
        c.data_vencimento,
        CASE
          WHEN c.data_vencimento IS NULL THEN NULL
          ELSE DATEDIFF(c.data_vencimento, CURDATE())
        END AS dias_para_vencimento,
        c.created_at,
        c.updated_at
      FROM clientes c
      ${whereSql}
      ORDER BY c.id DESC`,
      params
    );

    return res.json({ status: "success", data: rows });
  } catch (error) {
    return handleError(res, error, "Erro ao listar clientes");
  }
};

export const getCliente = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        c.id,
        c.nome,
        c.cpf,
        c.cnpj,
        c.telefone,
        c.email,
        c.endereco,
        c.tipo_pessoa,
        c.tipo_cliente,
        c.status_pagamento,
        c.data_vencimento,
        CASE
          WHEN c.data_vencimento IS NULL THEN NULL
          ELSE DATEDIFF(c.data_vencimento, CURDATE())
        END AS dias_para_vencimento,
        c.created_at,
        c.updated_at
      FROM clientes c
      WHERE c.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Cliente nao encontrado" });
    }

    return res.json({ status: "success", data: rows[0] });
  } catch (error) {
    return handleError(res, error, "Erro ao buscar cliente");
  }
};

export const createCliente = async (req, res) => {
  try {
    const payload = {
      nome: req.body.nome,
      cpf: normalize(req.body.cpf),
      cnpj: normalize(req.body.cnpj),
      telefone: normalize(req.body.telefone),
      email: normalize(req.body.email),
      endereco: normalize(req.body.endereco),
      tipo_pessoa: req.body.tipo_pessoa,
      tipo_cliente: req.body.tipo_cliente,
      status_pagamento: req.body.status_pagamento ?? "ok",
      data_vencimento: normalize(req.body.data_vencimento),
    };

    const validationMessage = validateClientePayload(payload);
    if (validationMessage) {
      return res.status(400).json({ status: "error", message: validationMessage });
    }

    if (payload.cpf) {
      const [existingCpf] = await db.query(
        "SELECT id FROM clientes WHERE cpf = ?",
        [payload.cpf]
      );
      if (existingCpf.length > 0) {
        return res.status(409).json({ status: "error", message: "CPF ja cadastrado" });
      }
    }

    if (payload.cnpj) {
      const [existingCnpj] = await db.query(
        "SELECT id FROM clientes WHERE cnpj = ?",
        [payload.cnpj]
      );
      if (existingCnpj.length > 0) {
        return res.status(409).json({ status: "error", message: "CNPJ ja cadastrado" });
      }
    }

    const [result] = await db.query(
      "INSERT INTO clientes (nome, cpf, cnpj, telefone, email, endereco, tipo_pessoa, tipo_cliente, status_pagamento, data_vencimento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        payload.nome,
        payload.cpf,
        payload.cnpj,
        payload.telefone,
        payload.email,
        payload.endereco,
        payload.tipo_pessoa,
        payload.tipo_cliente,
        payload.status_pagamento,
        payload.data_vencimento,
      ]
    );

    return res.status(201).json({
      status: "success",
      message: "Cliente criado",
      data: { id: result.insertId },
    });
  } catch (error) {
    return handleError(res, error, "Erro ao criar cliente");
  }
};

export const updateCliente = async (req, res) => {
  try {
    const [currentRows] = await db.query(
      "SELECT * FROM clientes WHERE id = ?",
      [req.params.id]
    );

    if (currentRows.length === 0) {
      return res.status(404).json({ status: "error", message: "Cliente nao encontrado" });
    }

    const current = currentRows[0];

    const payload = {
      nome: req.body.nome ?? current.nome,
      cpf: normalize(req.body.cpf ?? current.cpf),
      cnpj: normalize(req.body.cnpj ?? current.cnpj),
      telefone: normalize(req.body.telefone ?? current.telefone),
      email: normalize(req.body.email ?? current.email),
      endereco: normalize(req.body.endereco ?? current.endereco),
      tipo_pessoa: req.body.tipo_pessoa ?? current.tipo_pessoa,
      tipo_cliente: req.body.tipo_cliente ?? current.tipo_cliente,
      status_pagamento: req.body.status_pagamento ?? current.status_pagamento,
      data_vencimento: normalize(
        req.body.data_vencimento !== undefined
          ? req.body.data_vencimento
          : current.data_vencimento
      ),
    };

    const validationMessage = validateClientePayload(payload);
    if (validationMessage) {
      return res.status(400).json({ status: "error", message: validationMessage });
    }

    if (payload.cpf && payload.cpf !== current.cpf) {
      const [existingCpf] = await db.query(
        "SELECT id FROM clientes WHERE cpf = ? AND id <> ?",
        [payload.cpf, req.params.id]
      );
      if (existingCpf.length > 0) {
        return res.status(409).json({ status: "error", message: "CPF ja cadastrado" });
      }
    }

    if (payload.cnpj && payload.cnpj !== current.cnpj) {
      const [existingCnpj] = await db.query(
        "SELECT id FROM clientes WHERE cnpj = ? AND id <> ?",
        [payload.cnpj, req.params.id]
      );
      if (existingCnpj.length > 0) {
        return res.status(409).json({ status: "error", message: "CNPJ ja cadastrado" });
      }
    }

    const [result] = await db.query(
      "UPDATE clientes SET nome = ?, cpf = ?, cnpj = ?, telefone = ?, email = ?, endereco = ?, tipo_pessoa = ?, tipo_cliente = ?, status_pagamento = ?, data_vencimento = ? WHERE id = ?",
      [
        payload.nome,
        payload.cpf,
        payload.cnpj,
        payload.telefone,
        payload.email,
        payload.endereco,
        payload.tipo_pessoa,
        payload.tipo_cliente,
        payload.status_pagamento,
        payload.data_vencimento,
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Cliente nao encontrado" });
    }

    return res.json({ status: "success", message: "Cliente atualizado" });
  } catch (error) {
    return handleError(res, error, "Erro ao atualizar cliente");
  }
};

export const deleteCliente = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM clientes WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Cliente nao encontrado" });
    }

    return res.json({ status: "success", message: "Cliente removido" });
  } catch (error) {
    return handleError(res, error, "Erro ao remover cliente");
  }
};
