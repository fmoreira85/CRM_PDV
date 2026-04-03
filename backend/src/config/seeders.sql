-- seeders.sql
-- Dados ficticios iniciais para o CRM PDV (revisado)

USE crm_pdv;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE autorizacoes_gerenciais;
TRUNCATE TABLE movimentacoes_estoque;
TRUNCATE TABLE itens_vendidos;
TRUNCATE TABLE vendas;
TRUNCATE TABLE estoque;
TRUNCATE TABLE encomendas;
TRUNCATE TABLE despesas;
TRUNCATE TABLE produtos;
TRUNCATE TABLE subcategorias;
TRUNCATE TABLE categorias;
TRUNCATE TABLE caixa;
TRUNCATE TABLE fornecedores;
TRUNCATE TABLE clientes;
TRUNCATE TABLE usuarios;
TRUNCATE TABLE formas_pagamento;
SET FOREIGN_KEY_CHECKS = 1;

START TRANSACTION;

INSERT INTO formas_pagamento (id, nome, ativo) VALUES
  (1, 'Dinheiro', 1),
  (2, 'Pix', 1),
  (3, 'Cartao', 1),
  (4, 'Fiado', 1);

INSERT INTO usuarios (id, nome, email, senha, tipo_usuario, categoria_funcionario, ativo) VALUES
  (1, 'Admin Master', 'admin@crm.local', 'admin123', 'admin', NULL, 1),
  (2, 'Carla Souza', 'carla.souza@crm.local', 'func123', 'funcionario', 1, 1),
  (3, 'Bruno Alves', 'bruno.alves@crm.local', 'func123', 'funcionario', 2, 1),
  (4, 'Juliana Lima', 'juliana.lima@crm.local', 'func123', 'funcionario', 3, 1);

INSERT INTO clientes (
  id, nome, cpf, cnpj, telefone, email, endereco, tipo_pessoa, tipo_cliente,
  status_pagamento, data_vencimento
) VALUES
  (1, 'Mariana Costa', '123.456.789-10', NULL, '(65) 99999-1000', 'mariana@gmail.com', 'Rua das Flores, 100', 'fisica', 'cliente', 'ok', NULL),
  (2, 'Mercado Boa Compra LTDA', NULL, '12.345.678/0001-90', '(65) 3333-4455', 'contato@boacompra.com', 'Av. Central, 2500', 'juridica', 'cliente', 'pendente', '2026-04-15'),
  (3, 'Pedro Rocha', '987.654.321-00', NULL, '(65) 98888-2000', 'pedro.rocha@gmail.com', 'Rua Aurora, 55', 'fisica', 'nao_cliente', 'ok', NULL);

INSERT INTO fornecedores (
  id, nome, razao_social, cpf, cnpj, telefone, email, endereco,
  contato_nome, contato_telefone, ativo
) VALUES
  (1, 'Distribuidora Sol', 'Distribuidora Sol LTDA', NULL, '45.123.456/0001-11', '(65) 3000-1111', 'vendas@distsol.com', 'Rod. BR-070, Km 12', 'Rafael Mendes', '(65) 3000-1112', 1),
  (2, 'Higiene Norte', 'Higiene Norte Comercial LTDA', NULL, '33.222.111/0001-77', '(65) 3000-2222', 'contato@higienenorte.com', 'Av. Industrial, 999', 'Ana Paula', '(65) 3000-2223', 1);

INSERT INTO categorias (id, nome, descricao, ativo) VALUES
  (1, 'Alimentos', 'Itens de mercearia e basicos', 1),
  (2, 'Higiene', 'Produtos de limpeza e higiene', 1),
  (3, 'Bebidas', 'Bebidas em geral', 1);

INSERT INTO subcategorias (id, categoria_id, nome, descricao, ativo) VALUES
  (1, 1, 'Laticinios', 'Leite e derivados', 1),
  (2, 1, 'Padaria', 'Paes e massas', 1),
  (3, 2, 'Limpeza', 'Limpeza pesada e leve', 1),
  (4, 3, 'Refrigerantes', 'Refrigerantes e sodas', 1);

INSERT INTO produtos (
  id, nome, descricao, marca, categoria_id, subcategoria_id,
  preco_custo_atual, preco_venda_atual, unidade, ativo
) VALUES
  (1, 'Leite Integral 1L', 'Leite integral UHT', 'Fazenda Boa', 1, 1, 4.20, 6.50, 'un', 1),
  (2, 'Pao de Forma 500g', 'Pao de forma tradicional', 'PanShop', 1, 2, 4.00, 7.50, 'pct', 1),
  (3, 'Detergente Neutro 500ml', 'Detergente para uso domestico', 'Brilho', 2, 3, 3.20, 5.00, 'un', 1),
  (4, 'Refrigerante Cola 2L', 'Refrigerante sabor cola', 'Fresh', 3, 4, 6.00, 9.90, 'un', 1);

INSERT INTO estoque (
  id, produto_id, lote, validade, quantidade_atual, nivel_ideal
) VALUES
  (1, 1, 'L-LEI-001', '2026-07-15', 80.000, 120.000),
  (2, 2, 'L-PAO-010', '2026-05-20', 60.000, 90.000),
  (3, 3, 'L-DET-005', '2027-01-10', 40.000, 70.000),
  (4, 4, 'L-REF-002', '2026-09-30', 55.000, 80.000);

INSERT INTO vendas (
  id, cliente_id, usuario_id, forma_pagamento_id, valor_total,
  status, status_pagamento, data_vencimento
) VALUES
  (1, 1, 2, 2, 22.90, 'concluida', 'pago', NULL),
  (2, 2, 2, 4, 27.50, 'aberta', 'pendente', '2026-04-15');

INSERT INTO itens_vendidos (
  id, venda_id, produto_id, quantidade, preco_venda_epoca, preco_custo_epoca
) VALUES
  (1, 1, 1, 2.000, 6.50, 4.20),
  (2, 1, 4, 1.000, 9.90, 6.00),
  (3, 2, 2, 3.000, 7.50, 4.00),
  (4, 2, 3, 1.000, 5.00, 3.20);

INSERT INTO despesas (
  id, valor, descricao, categoria, data, usuario_id
) VALUES
  (1, 320.50, 'Conta de energia - marco', 'Utilidades', '2026-03-31', 1),
  (2, 150.00, 'Manutencao de equipamento', 'Manutencao', '2026-04-01', 1);

INSERT INTO encomendas (
  id, fornecedor_id, produto_id, quantidade, data_pedido, prazo, status
) VALUES
  (1, 1, 1, 120.000, '2026-03-28', '2026-04-05', 'confirmada'),
  (2, 2, 3, 90.000, '2026-03-29', '2026-04-06', 'aberta');

INSERT INTO caixa (
  id, valor, origem, referencia, data_movimento, tipo_movimento
) VALUES
  (1, 22.90, 'Venda', 'VENDA-1', '2026-04-01 10:15:00', 'entrada'),
  (2, 320.50, 'Despesa', 'DESP-1', '2026-04-01 18:30:00', 'saida'),
  (3, 150.00, 'Despesa', 'DESP-2', '2026-04-02 09:00:00', 'saida');

INSERT INTO movimentacoes_estoque (
  id, produto_id, estoque_id, usuario_id, tipo_movimento, motivo, quantidade, data_movimentacao
) VALUES
  (1, 1, 1, 3, 'entrada', 'entrada_compra', 100.000, '2026-03-27 08:00:00'),
  (2, 2, 2, 3, 'entrada', 'entrada_compra', 80.000, '2026-03-27 08:10:00'),
  (3, 3, 3, 3, 'entrada', 'entrada_compra', 60.000, '2026-03-27 08:20:00'),
  (4, 4, 4, 3, 'entrada', 'entrada_compra', 70.000, '2026-03-27 08:30:00'),
  (5, 1, 1, 2, 'saida', 'venda', 2.000, '2026-04-01 10:15:00'),
  (6, 4, 4, 2, 'saida', 'venda', 1.000, '2026-04-01 10:15:00'),
  (7, 2, 2, 2, 'saida', 'venda', 3.000, '2026-04-02 09:20:00'),
  (8, 3, 3, 2, 'saida', 'venda', 1.000, '2026-04-02 09:20:00');

COMMIT;
