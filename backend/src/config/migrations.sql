-- migrations.sql
-- Schema inicial do CRM PDV (revisado)

CREATE DATABASE IF NOT EXISTS crm_pdv
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE crm_pdv;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS autorizacoes_gerenciais;
DROP TABLE IF EXISTS movimentacoes_estoque;
DROP TABLE IF EXISTS itens_vendidos;
DROP TABLE IF EXISTS vendas;
DROP TABLE IF EXISTS estoque;
DROP TABLE IF EXISTS encomendas;
DROP TABLE IF EXISTS despesas;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS subcategorias;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS caixa;
DROP TABLE IF EXISTS fornecedores;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS formas_pagamento;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS formas_pagamento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  tipo_usuario ENUM('admin', 'funcionario') NOT NULL,
  categoria_funcionario TINYINT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (
    (tipo_usuario = 'admin' AND categoria_funcionario IS NULL)
    OR (tipo_usuario = 'funcionario' AND categoria_funcionario IN (1, 2, 3))
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  cpf VARCHAR(14) NULL,
  cnpj VARCHAR(18) NULL,
  telefone VARCHAR(30) NULL,
  email VARCHAR(160) NULL,
  endereco VARCHAR(255) NULL,
  tipo_pessoa ENUM('fisica', 'juridica') NOT NULL,
  tipo_cliente ENUM('cliente', 'nao_cliente') NOT NULL,
  status_pagamento ENUM('ok', 'pendente', 'inadimplente') NOT NULL DEFAULT 'ok',
  data_vencimento DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_clientes_cpf (cpf),
  UNIQUE KEY uk_clientes_cnpj (cnpj)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fornecedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  razao_social VARCHAR(180) NULL,
  cpf VARCHAR(14) NULL,
  cnpj VARCHAR(18) NULL,
  telefone VARCHAR(30) NULL,
  email VARCHAR(160) NULL,
  endereco VARCHAR(255) NULL,
  contato_nome VARCHAR(160) NULL,
  contato_telefone VARCHAR(30) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_fornecedores_cpf (cpf),
  UNIQUE KEY uk_fornecedores_cnpj (cnpj)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  descricao VARCHAR(255) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subcategorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  categoria_id INT NOT NULL,
  nome VARCHAR(120) NOT NULL,
  descricao VARCHAR(255) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_subcategorias_categoria
    FOREIGN KEY (categoria_id)
    REFERENCES categorias (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  descricao TEXT NULL,
  marca VARCHAR(120) NULL,
  categoria_id INT NOT NULL,
  subcategoria_id INT NULL,
  preco_custo_atual DECIMAL(10, 2) NOT NULL,
  preco_venda_atual DECIMAL(10, 2) NOT NULL,
  unidade VARCHAR(20) NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_produtos_categoria
    FOREIGN KEY (categoria_id)
    REFERENCES categorias (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_produtos_subcategoria
    FOREIGN KEY (subcategoria_id)
    REFERENCES subcategorias (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS estoque (
  id INT AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  lote VARCHAR(60) NOT NULL,
  validade DATE NULL,
  quantidade_atual DECIMAL(10, 3) NOT NULL DEFAULT 0,
  nivel_ideal DECIMAL(10, 3) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_estoque_produto
    FOREIGN KEY (produto_id)
    REFERENCES produtos (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  UNIQUE KEY uk_estoque_produto_lote (produto_id, lote)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vendas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NULL,
  usuario_id INT NOT NULL,
  forma_pagamento_id INT NOT NULL,
  valor_total DECIMAL(10, 2) NOT NULL,
  status ENUM('aberta', 'concluida', 'cancelada') NOT NULL DEFAULT 'aberta',
  status_pagamento ENUM('pago', 'pendente', 'inadimplente') NOT NULL DEFAULT 'pendente',
  data_vencimento DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vendas_cliente
    FOREIGN KEY (cliente_id)
    REFERENCES clientes (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_vendas_usuario
    FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_vendas_forma_pagamento
    FOREIGN KEY (forma_pagamento_id)
    REFERENCES formas_pagamento (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS itens_vendidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venda_id INT NOT NULL,
  produto_id INT NOT NULL,
  quantidade DECIMAL(10, 3) NOT NULL,
  preco_venda_epoca DECIMAL(10, 2) NOT NULL,
  preco_custo_epoca DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_itens_vendidos_venda
    FOREIGN KEY (venda_id)
    REFERENCES vendas (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_itens_vendidos_produto
    FOREIGN KEY (produto_id)
    REFERENCES produtos (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS autorizacoes_gerenciais (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venda_id INT NOT NULL,
  item_vendido_id INT NOT NULL,
  tipo ENUM('desconto', 'cancelamento') NOT NULL,
  solicitado_por INT NOT NULL,
  autorizado_por INT NULL,
  motivo VARCHAR(255) NOT NULL,
  valor_anterior DECIMAL(10, 2) NOT NULL,
  valor_novo DECIMAL(10, 2) NULL,
  valor_alterado DECIMAL(10, 2) NOT NULL,
  status ENUM('pendente', 'aprovado', 'negado') NOT NULL DEFAULT 'pendente',
  autorizado_em DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_autorizacoes_venda
    FOREIGN KEY (venda_id)
    REFERENCES vendas (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_autorizacoes_item
    FOREIGN KEY (item_vendido_id)
    REFERENCES itens_vendidos (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_autorizacoes_solicitado
    FOREIGN KEY (solicitado_por)
    REFERENCES usuarios (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_autorizacoes_autorizado
    FOREIGN KEY (autorizado_por)
    REFERENCES usuarios (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id INT AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  estoque_id INT NOT NULL,
  usuario_id INT NOT NULL,
  tipo_movimento ENUM('entrada', 'saida') NOT NULL,
  motivo ENUM(
    'venda',
    'perda_avaria',
    'consumo_proprio',
    'devolucao_fornecedor',
    'entrada_compra',
    'ajuste'
  ) NOT NULL,
  quantidade DECIMAL(10, 3) NOT NULL,
  data_movimentacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_mov_estoque_produto
    FOREIGN KEY (produto_id)
    REFERENCES produtos (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_mov_estoque_estoque
    FOREIGN KEY (estoque_id)
    REFERENCES estoque (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_mov_estoque_usuario
    FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS despesas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  valor DECIMAL(10, 2) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  categoria VARCHAR(120) NOT NULL,
  data DATE NOT NULL,
  usuario_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_despesas_usuario
    FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS encomendas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fornecedor_id INT NOT NULL,
  produto_id INT NOT NULL,
  quantidade DECIMAL(10, 3) NOT NULL,
  data_pedido DATE NOT NULL,
  prazo DATE NULL,
  observacoes VARCHAR(255) NULL,
  status ENUM('aberta', 'confirmada', 'recebida', 'cancelada') NOT NULL DEFAULT 'aberta',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_encomendas_fornecedor
    FOREIGN KEY (fornecedor_id)
    REFERENCES fornecedores (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_encomendas_produto
    FOREIGN KEY (produto_id)
    REFERENCES produtos (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS caixa (
  id INT AUTO_INCREMENT PRIMARY KEY,
  valor DECIMAL(10, 2) NOT NULL,
  origem VARCHAR(120) NOT NULL,
  referencia VARCHAR(120) NULL,
  data_movimento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tipo_movimento ENUM('entrada', 'saida') NOT NULL,
  observacao VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
