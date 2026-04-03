# 📘 Prompts para Construção do CRM / Sistema de Gestão

## 1. Visão Geral

Este documento reúne uma sequência organizada de prompts para construir um sistema de gestão no estilo CRM/Admin Panel, seguindo exatamente a stack e a estrutura definidas.

O objetivo é permitir a criação do sistema por etapas, com foco em:

- organização do projeto
- construção do banco de dados
- criação de migrations e seeders
- separação entre frontend e backend
- regras de negócio por perfil de usuário
- dashboards, filtros, relatórios e gráficos
- interface administrativa com visual limpo e minimalista

---

## 2. Stack obrigatória

O projeto deve usar obrigatoriamente:

- Node.js
- JavaScript Vanilla
- Bootstrap
- Bootstrap Icons
- Express
- MySQL
- mysql2
- Cors

---

## 3. Estrutura geral do projeto

O projeto será dividido em duas partes:

- Frontend
- Backend

---

## 4. Estrutura de pastas do frontend

```txt
frontend/
    src/
        utils/
        middlewares/
        api/
        pages/
        assets/
        styles/
    index.html
    main.js
```

### Responsabilidade das pastas do frontend

- `utils/`  
  Funções auxiliares reutilizáveis, como formatação de moeda, datas, máscaras e helpers em geral.

- `middlewares/`  
  Regras intermediárias do frontend, como validação de autenticação, proteção de páginas e verificações de acesso.

- `api/`  
  Arquivos responsáveis pela comunicação com o backend, separados por módulo.

- `pages/`  
  Telas do sistema, como login, dashboard, clientes, produtos, vendas e outras.

- `assets/`  
  Imagens, logos, ícones locais e arquivos estáticos.

- `styles/`  
  Arquivos de estilo customizados para complementar o Bootstrap.

- `index.html`  
  Estrutura principal do frontend.

- `main.js`  
  Arquivo principal de inicialização da aplicação.

---

## 5. Estrutura de pastas do backend

```txt
backend/
    src/
        routes/
        controllers/
        middleware/
        utils/
        config/
            migrations.sql
            seeders.sql
    app.js
    connections.js
    server.js
```

### Responsabilidade das pastas do backend

- `routes/`  
  Arquivos de rotas separados por módulo.

- `controllers/`  
  Funções que recebem a requisição, processam a lógica principal e retornam a resposta.

- `middleware/`  
  Middlewares de autenticação, autorização e outras regras de proteção.

- `utils/`  
  Funções auxiliares reutilizáveis no backend.

- `config/`  
  Arquivos de configuração do banco, incluindo `migrations.sql` e `seeders.sql`.

- `app.js`  
  Configuração principal do Express.

- `connections.js`  
  Conexão com o banco MySQL usando mysql2.

- `server.js`  
  Arquivo que sobe o servidor.

---

## 6. Características obrigatórias de UI

A interface deve seguir um padrão de CRM/Admin Panel, com:

- Sidebar
- Ícones
- Design minimalista

### Direção visual

- Sidebar fixa
- Uso de Bootstrap Icons sempre que possível
- Layout limpo, profissional e administrativo
- Estrutura com cards, tabelas, filtros, formulários e gráficos
- Estilo objetivo e funcional

---

## 7. Entidades / tabelas do sistema

O banco deve conter pelo menos as seguintes entidades:

- Produtos
- Estoque
- Vendas
- Itens vendidos
- Despesas
- Usuários
- Fornecedor
- Encomenda
- Caixa
- Clientes
- Categorias
- Subcategorias
- Formas de pagamento
- Movimentações de estoque

---

## 8. Perfis e regras de negócio

### 8.1 Perfis do sistema

- Admin (gestor)
- Funcionário
- Cliente e não cliente

### 8.2 Regras gerais sobre usuários

O sistema deve suportar:

- usuário admin
- funcionário categoria 1
- funcionário categoria 2
- funcionário categoria 3

É obrigatório já existir pelo menos **1 usuário por padrão no seeder**, especialmente um **admin pronto para uso**.

---

## 9. Regras de negócio do admin

O admin deve poder:

1. Cadastrar despesa  
2. Visualizar lucro por mês  
3. Visualizar lucro por ano  
4. Visualizar lucro total  
5. Visualizar o produto mais vendido do mês, do ano e ao todo  
6. Visualizar a categoria de produto mais vendida do mês, do ano e ao todo  
7. Visualizar o produto menos vendido do mês, do ano e ao todo  
8. Visualizar a categoria de produto menos vendida do mês, do ano e ao todo  
9. Visualizar gráficos que representem todas as consultas acima  
10. Filtrar clientes por status financeiro:
    - inadimplentes
    - no prazo
    - próximos da data de pagamento
    - localizar cliente por nome, cpf, cnpj, id e outros campos
11. Exibir o total de dinheiro a receber de vendas inadimplentes  
12. Exibir encomendas próximas do prazo  
13. Exibir produtos abaixo do nível ideal de estoque  
14. Exibir lotes de produtos próximos da validade  
15. Cadastrar funcionário  
16. Buscar e filtrar quantas vendas um funcionário fez por:
    - mês
    - ano
    - semana
    - dia
17. Comparar entrada do caixa x venda  
18. Comparar venda x estoque | venda x estoque x caixa  
19. Exibir todos os produtos descartados e suas quantidades, por diferentes agrupamentos:
    - categoria
    - marca
    - tipo
20. Exibir a movimentação de estoque, registrando o motivo de saída:
    - venda
    - perda/avaria
    - consumo próprio
    - devolução ao fornecedor
21. Exibir formas de pagamento separadas por:
    - dinheiro
    - pix
    - cartão
    - fiado
22. Trabalhar com categorias e subcategorias para organizar os produtos e gerar os relatórios

### Regra crítica sobre lucro

Para os cálculos de lucro por mês, ano e total, o sistema deve obrigatoriamente gravar no item vendido:

- preço de venda da época
- preço de custo da época

Isso é essencial para que o lucro histórico continue correto mesmo se o preço do produto mudar futuramente.

---

## 10. Regras de negócio dos funcionários

### 10.1 Funcionário categoria 1

Pode:

1. Cadastrar uma venda
2. Cadastrar itens vendidos

Não pode fazer livremente:

- cancelamento de itens
- descontos sem autorização

#### Regra obrigatória
Deve existir **autorização de gerente** para cancelamento de item ou aplicação de desconto.

---

### 10.2 Funcionário categoria 2

Pode:

1. Cadastrar produto
2. Cadastrar cliente
3. Excluir produto e cliente
4. Alterar produto e cliente
5. Gerenciar estoque

---

### 10.3 Funcionário categoria 3

Pode:

1. Cadastrar fornecedor
2. Excluir fornecedor
3. Alterar fornecedor
4. Cadastrar encomenda
5. Excluir encomenda
6. Alterar encomenda
7. Usar filtros de busca para fornecedor e encomenda

---

## 11. Observações fundamentais sobre banco de dados

É muito importante construir:

- `migrations.sql`
- `seeders.sql`

Esses dois arquivos devem existir por padrão no projeto.

### O que precisa acontecer

- O `migrations.sql` deve criar manualmente o banco e as tabelas
- O `seeders.sql` deve popular manualmente o banco com dados fictícios
- O seeder precisa trazer pelo menos:
  - 1 admin
  - 1 funcionário categoria 1
  - 1 funcionário categoria 2
  - 1 funcionário categoria 3

Além disso, deve popular dados mínimos para testes de:

- clientes
- produtos
- categorias
- subcategorias
- estoque
- vendas
- itens vendidos
- despesas
- fornecedores
- encomendas
- caixa
- movimentações de estoque
- formas de pagamento

---

# 12. Sequência de prompts para o Codex

## Prompt 01 — criar a estrutura inicial completa do projeto

Crie a estrutura inicial completa do projeto separando frontend e backend.

### Regras obrigatórias

- Não usar React, Vue, Angular ou qualquer framework de frontend
- O frontend deve ser em JavaScript Vanilla
- O frontend deve usar Bootstrap e Bootstrap Icons
- O backend deve ser em Node.js com Express
- O banco de dados deve ser MySQL com mysql2
- Configurar Cors no backend
- O projeto deve ser dividido em:
  - frontend
  - backend
- Não fugir dessa stack
- Criar uma base limpa, organizada e escalável

### Estrutura obrigatória do frontend

```txt
frontend/
    src/
        utils/
        middlewares/
        api/
        pages/
        assets/
        styles/
    index.html
    main.js
```

### Estrutura obrigatória do backend

```txt
backend/
    src/
        routes/
        controllers/
        middleware/
        utils/
        config/
            migrations.sql
            seeders.sql
    app.js
    connections.js
    server.js
```

### O que fazer

- Criar todas as pastas e arquivos base
- Inicializar o backend com Express
- Configurar Cors
- Criar `connections.js` com a conexão inicial usando mysql2
- Criar `app.js`
- Criar `server.js`
- Deixar o projeto pronto para crescer por módulos
- Criar um frontend inicial com layout administrativo simples
- Criar uma sidebar fixa, visual minimalista e uso de ícones do Bootstrap Icons

---

## Prompt 02 — criar o documento de arquitetura e responsabilidades das pastas

Crie um documento explicando a arquitetura do projeto.

### O documento deve explicar

- O papel do frontend
- O papel do backend
- O motivo de separar a aplicação em duas partes
- A responsabilidade de cada pasta do frontend
- A responsabilidade de cada pasta do backend
- O fluxo básico entre tela → requisição → rota → controller → banco
- Como essa estrutura facilita manutenção

### Importante

Escreva em linguagem simples, organizada e objetiva, como documentação técnica para o próprio projeto.

---

## Prompt 03 — criar o banco de dados com migrations.sql

Crie o arquivo `migrations.sql` completo para o sistema.

### Regras obrigatórias

Criar tabelas para:

- produtos
- categorias
- subcategorias
- estoque
- movimentacoes_estoque
- vendas
- itens_vendidos
- despesas
- usuarios
- fornecedores
- encomendas
- clientes
- caixa
- formas_pagamento

### Regras de modelagem

#### usuários
- armazenar admin e funcionários
- funcionário deve possuir categoria 1, 2 ou 3
- deve existir controle de tipo de usuário
- campos básicos:
  - id
  - nome
  - email
  - senha
  - tipo_usuario
  - categoria_funcionario
  - ativo
  - created_at
  - updated_at

#### clientes
- permitir cliente e não cliente
- cliente pode ser pessoa física ou jurídica
- campos importantes:
  - id
  - nome
  - cpf
  - cnpj
  - telefone
  - email
  - endereco
  - tipo_pessoa
  - status_pagamento
  - data_vencimento
  - created_at
  - updated_at

#### produtos
- campos importantes:
  - id
  - nome
  - descricao
  - marca
  - categoria_id
  - subcategoria_id
  - preco_custo_atual
  - preco_venda_atual
  - unidade
  - ativo
  - created_at
  - updated_at

#### estoque
- controlar lote
- controlar validade
- controlar quantidade atual
- controlar nível ideal de estoque
- relacionar com produto

#### movimentacoes_estoque
- registrar entradas e saídas
- a saída deve poder ser:
  - venda
  - perda/avaria
  - consumo próprio
  - devolução ao fornecedor
- guardar motivo
- guardar quantidade
- guardar data
- relacionar com produto, lote e usuário responsável

#### vendas
- relacionar com cliente
- relacionar com usuário
- relacionar com forma de pagamento
- guardar valor total
- guardar status
- guardar se está pago, pendente ou inadimplente
- guardar data de vencimento quando necessário

#### itens_vendidos
- relacionar com venda e produto
- gravar:
  - quantidade
  - preço de venda da época
  - preço de custo da época
- isso é obrigatório para cálculo correto do lucro histórico

#### despesas
- valor
- descrição
- categoria
- data
- usuário responsável

#### fornecedores
- dados completos do fornecedor

#### encomendas
- fornecedor
- produto
- quantidade
- data do pedido
- prazo
- status

#### caixa
- registrar entradas e saídas
- valor
- origem
- referência
- data
- tipo_movimento

#### formas_pagamento
- exemplos:
  - dinheiro
  - pix
  - cartão
  - fiado

### Importante

- Definir chaves primárias
- Definir chaves estrangeiras
- Usar `AUTO_INCREMENT`
- Usar `created_at` e `updated_at` sempre que fizer sentido
- Colocar `NOT NULL` quando fizer sentido
- Organizar o SQL de forma legível

---

## Prompt 04 — criar o seeders.sql com dados fictícios

Crie o arquivo `seeders.sql` completo com dados fictícios para popular o banco.

### Regras obrigatórias

Inserir dados iniciais para:

- pelo menos 1 usuário admin
- pelo menos 1 funcionário categoria 1
- pelo menos 1 funcionário categoria 2
- pelo menos 1 funcionário categoria 3
- categorias
- subcategorias
- formas de pagamento
- alguns clientes
- alguns fornecedores
- alguns produtos
- alguns registros de estoque
- algumas vendas
- alguns itens_vendidos
- algumas despesas
- algumas encomendas
- alguns registros no caixa
- algumas movimentações de estoque

### Regras importantes

- Os dados devem fazer sentido entre si
- Não quebrar foreign keys
- Criar exemplos realistas
- Já deixar pelo menos 1 usuário admin pronto para login
- O admin precisa vir por padrão no seeder
- Os produtos precisam ter categorias e subcategorias válidas
- As vendas precisam ter itens vendidos válidos
- Os itens vendidos devem gravar preço de custo e venda da época

---

## Prompt 05 — criar as rotas iniciais do backend por módulo

Crie as rotas iniciais do backend separadas por módulo.

### Criar rotas para

- usuários
- clientes
- produtos
- estoque
- movimentações de estoque
- vendas
- itens vendidos
- despesas
- fornecedores
- encomendas
- caixa
- dashboard

### Regras

- Organizar cada módulo em seu arquivo de rota
- Registrar tudo no `app.js`
- Usar padrão REST sempre que possível
- Preparar a base para CRUD
- Manter o código simples e organizado

---

## Prompt 06 — criar os controllers base de todos os módulos

Crie os controllers base de todos os módulos do sistema.

### Módulos

- usuariosController.js
- clientesController.js
- produtosController.js
- estoqueController.js
- movimentacoesEstoqueController.js
- vendasController.js
- despesasController.js
- fornecedoresController.js
- encomendasController.js
- caixaController.js
- dashboardController.js

### Regras

- Criar funções básicas de CRUD
- Separar bem a responsabilidade de cada controller
- Usar `connections.js` para acessar o MySQL
- Retornar JSON padronizado
- Tratar erros com try/catch
- Não complicar com arquitetura excessiva agora

---

## Prompt 07 — criar autenticação e controle de acesso

Implemente autenticação simples para o sistema.

### Regras obrigatórias

- Login com email e senha
- Verificar o usuário no banco
- Criar middleware de autenticação
- Criar middleware de autorização por perfil
- Diferenciar:
  - admin
  - funcionário categoria 1
  - funcionário categoria 2
  - funcionário categoria 3

### Regras de permissão

#### admin
Acesso total ao sistema

#### funcionário categoria 1
- cadastrar venda
- cadastrar itens vendidos
- solicitar autorização de gerente para desconto ou cancelamento

#### funcionário categoria 2
- cadastrar produto
- cadastrar cliente
- editar produto
- editar cliente
- excluir produto
- excluir cliente
- gerenciar estoque

#### funcionário categoria 3
- cadastrar fornecedor
- editar fornecedor
- excluir fornecedor
- cadastrar encomenda
- editar encomenda
- excluir encomenda
- buscar fornecedor e encomenda

### Importante

- Criar middlewares por permissão
- Proteger rotas sensíveis
- Escrever o código de forma simples

---

## Prompt 08 — criar o CRUD completo de usuários

Crie o CRUD completo de usuários.

### Regras obrigatórias

- Apenas admin pode cadastrar usuários
- Deve permitir cadastrar:
  - admin
  - funcionário categoria 1
  - funcionário categoria 2
  - funcionário categoria 3
- Validar campos obrigatórios
- Não permitir email duplicado
- Permitir ativar e desativar usuários
- Criar listagem com filtros

---

## Prompt 09 — criar o CRUD completo de clientes

Crie o CRUD completo de clientes.

### Regras obrigatórias

- Permitir cadastrar cliente pessoa física ou jurídica
- Permitir cliente e não cliente
- Campos de busca:
  - nome
  - cpf
  - cnpj
  - id
  - telefone
- Criar filtros para:
  - inadimplentes
  - no prazo
  - próximos da data de pagamento

### Importante

- Deixar preparado para relatórios financeiros futuros

---

## Prompt 10 — criar o CRUD completo de produtos, categorias e subcategorias

Crie o CRUD completo de produtos, categorias e subcategorias.

### Regras obrigatórias

- Produto deve pertencer a uma categoria
- Produto pode pertencer a uma subcategoria
- Permitir cadastrar marca
- Permitir editar preço de custo atual e preço de venda atual
- Não apagar fisicamente do banco se não for necessário, preferir inativação
- Criar buscas por:
  - nome
  - marca
  - categoria
  - subcategoria

---

## Prompt 11 — criar o módulo de estoque

Crie o módulo de estoque do sistema.

### Regras obrigatórias

- Controlar quantidade atual
- Controlar lote
- Controlar data de validade
- Controlar nível ideal de estoque
- Mostrar produtos abaixo do nível ideal
- Mostrar lotes próximos do vencimento

### Importante

- Relacionar estoque com produto
- Permitir múltiplos lotes do mesmo produto
- Preparar para movimentação de estoque

---

## Prompt 12 — criar o módulo de movimentação de estoque

Crie o módulo de movimentação de estoque.

### Regras obrigatórias

Toda saída de produto deve registrar o motivo:

- venda
- perda/avaria
- consumo próprio
- devolução ao fornecedor

Também permitir entrada de estoque.

### O sistema deve

- registrar produto
- lote
- quantidade
- tipo de movimentação
- motivo
- usuário responsável
- data

### Importante

Esse módulo deve alimentar os relatórios de descarte e conferência de estoque.

---

## Prompt 13 — criar o módulo de vendas e itens vendidos

Crie o módulo de vendas e itens vendidos.

### Regras obrigatórias

- Uma venda deve ter:
  - cliente
  - funcionário responsável
  - forma de pagamento
  - status
  - valor total
  - data
- Cada item vendido deve gravar:
  - produto
  - quantidade
  - preço de venda da época
  - preço de custo da época

### Muito importante

Gravar o preço de custo histórico no item vendido para que o lucro retroativo continue correto mesmo se o preço de custo mudar depois.

### Regras adicionais

- Ao vender, atualizar o estoque
- Se não houver estoque suficiente, impedir a venda
- Se a forma de pagamento for fiado, marcar como conta a receber

---

## Prompt 14 — criar regra de autorização para desconto e cancelamento

Crie a lógica de autorização de gerente para desconto ou cancelamento de item.

### Regras obrigatórias

- Funcionário categoria 1 não pode cancelar item diretamente
- Funcionário categoria 1 não pode dar desconto diretamente
- Para desconto ou cancelamento, precisa existir autorização gerencial
- Registrar:
  - quem solicitou
  - quem autorizou
  - motivo
  - data
  - valor alterado

### Importante

Essa regra pode ser feita inicialmente com uma tabela de autorizações ou com registro direto na venda, desde que fique auditável.

---

## Prompt 15 — criar o módulo de despesas

Crie o módulo de despesas.

### Regras obrigatórias

- Apenas admin pode cadastrar despesa
- Campos:
  - descrição
  - categoria
  - valor
  - data
  - usuário responsável
- Criar listagem
- Criar filtros por mês, ano e período

---

## Prompt 16 — criar o módulo de fornecedores

Crie o CRUD completo de fornecedores.

### Regras obrigatórias

- Apenas funcionário categoria 3 e admin podem gerenciar fornecedores
- Buscar fornecedor por:
  - nome
  - cnpj
  - telefone
  - email
  - id

---

## Prompt 17 — criar o módulo de encomendas

Crie o CRUD completo de encomendas.

### Regras obrigatórias

- Relacionar encomenda com fornecedor
- Relacionar encomenda com produto
- Guardar:
  - quantidade
  - data do pedido
  - prazo
  - status
  - observações
- Criar filtro para encomendas próximas do prazo
- Criar busca por fornecedor e produto

---

## Prompt 18 — criar o módulo de caixa

Crie o módulo de caixa.

### Regras obrigatórias

- Registrar entradas e saídas
- Permitir comparar entrada de caixa com vendas
- Cada lançamento deve guardar:
  - tipo
  - valor
  - origem
  - referência
  - data
  - observação

### Importante

Preparar o módulo para:
- comparar caixa x vendas
- comparar vendas x estoque
- comparar vendas x estoque x caixa

---

## Prompt 19 — criar o dashboard administrativo

Crie o dashboard administrativo com cards, tabelas e gráficos.

### O dashboard do admin deve mostrar

1. lucro por mês  
2. lucro por ano  
3. lucro total  
4. produto mais vendido do mês, ano e geral  
5. categoria mais vendida do mês, ano e geral  
6. produto menos vendido do mês, ano e geral  
7. categoria menos vendida do mês, ano e geral  
8. total a receber das vendas inadimplentes  
9. encomendas próximas do prazo  
10. produtos abaixo do nível ideal de estoque  
11. lotes próximos da validade  
12. quantidade de produtos descartados  
13. agrupamento de descartes por categoria, marca e tipo  
14. comparação entre caixa e vendas  

### Importante

- Usar gráficos simples
- Usar Bootstrap
- Layout minimalista
- Sidebar administrativa
- Ícones sempre que fizer sentido

---

## Prompt 20 — criar as consultas SQL e endpoints do dashboard

Crie as consultas SQL e endpoints necessários para alimentar o dashboard administrativo.

### Deve existir endpoint para

- lucro mensal
- lucro anual
- lucro total
- produto mais vendido
- categoria mais vendida
- produto menos vendido
- categoria menos vendida
- clientes inadimplentes
- clientes próximos do vencimento
- total a receber
- encomendas próximas do prazo
- produtos abaixo do estoque ideal
- lotes próximos do vencimento
- descartes por tipo
- descartes por categoria
- descartes por marca
- vendas por funcionário por dia
- vendas por funcionário por semana
- vendas por funcionário por mês
- vendas por funcionário por ano
- comparação caixa x vendas
- comparação vendas x estoque
- comparação vendas x estoque x caixa

---

## Prompt 21 — criar o frontend base com layout de CRM

Crie o frontend base no estilo CRM/admin panel.

### Características obrigatórias de UI

- Sidebar fixa
- Ícones com Bootstrap Icons
- Visual minimalista
- Bootstrap para layout
- Visual limpo, profissional e administrativo

### Estrutura visual sugerida

- Sidebar à esquerda
- Topbar no conteúdo
- Área principal com:
  - cards
  - tabelas
  - filtros
  - formulários
  - gráficos

### Páginas iniciais

- login
- dashboard
- clientes
- produtos
- estoque
- vendas
- despesas
- fornecedores
- encomendas
- caixa
- usuários

---

## Prompt 22 — criar a API do frontend para comunicação com backend

Crie a camada de API do frontend em `src/api/`.

### Regras obrigatórias

- Separar arquivos por módulo
- Criar funções para:
  - login
  - usuários
  - clientes
  - produtos
  - estoque
  - vendas
  - despesas
  - fornecedores
  - encomendas
  - caixa
  - dashboard
- Centralizar URL base da API
- Organizar bem para manutenção

---

## Prompt 23 — criar as telas de CRUD do frontend

Crie as telas de CRUD do frontend para os módulos principais.

### Regras obrigatórias

Cada tela deve ter:

- formulário de cadastro
- listagem
- busca
- filtros
- botão editar
- botão excluir quando permitido
- validações básicas
- feedback visual de sucesso e erro

### Módulos

- clientes
- produtos
- estoque
- vendas
- despesas
- fornecedores
- encomendas
- usuários

---

## Prompt 24 — criar controle visual por tipo de usuário

Crie a lógica do frontend para mostrar ou esconder menus, botões e páginas conforme o tipo de usuário.

### Regras obrigatórias

#### admin
vê tudo

#### funcionário categoria 1
vê apenas vendas e itens vendidos, conforme sua permissão

#### funcionário categoria 2
vê clientes, produtos e estoque

#### funcionário categoria 3
vê fornecedores e encomendas

### Importante

- Não depender só do frontend
- Também proteger no backend
- Mas organizar a experiência visual conforme o perfil

---

## Prompt 25 — revisar e melhorar migrations e seeders

Revise completamente os arquivos `migrations.sql` e `seeders.sql`.

### Regras obrigatórias

- Corrigir problemas de integridade
- Conferir foreign keys
- Conferir ordem correta das criações
- Conferir ordem correta dos inserts
- Garantir que o banco possa ser criado manualmente
- Garantir que o banco possa ser populado manualmente
- Garantir que exista pelo menos:
  - 1 admin
  - 1 funcionário categoria 1
  - 1 funcionário categoria 2
  - 1 funcionário categoria 3

### Importante

No final, explicar exatamente:

1. como criar o banco  
2. como rodar o migrations.sql manualmente  
3. como rodar o seeders.sql manualmente  
4. em que ordem executar os arquivos  

---

## 13. Resumo das regras críticas do projeto

Estas regras não podem ser esquecidas:

- gravar o preço de custo histórico no item vendido
- já deixar um admin criado no seeder
- separar permissões por categoria de funcionário
- registrar movimentação de estoque com motivo
- controlar clientes inadimplentes
- controlar encomendas próximas do prazo
- controlar produtos abaixo do nível ideal de estoque
- controlar lotes próximos da validade
- permitir comparação entre caixa, vendas e estoque
- manter migrations e seeders funcionais para execução manual

---

## 14. Ordem sugerida de execução do projeto

Para evitar bagunça, a ordem ideal de construção é:

1. Estrutura inicial do projeto  
2. Banco de dados com migrations  
3. Seeders com dados fictícios  
4. Conexão com banco  
5. Rotas base  
6. Controllers base  
7. Autenticação e autorização  
8. CRUDs principais  
9. Estoque e movimentação  
10. Vendas e itens vendidos  
11. Despesas  
12. Fornecedores  
13. Encomendas  
14. Caixa  
15. Dashboard  
16. Frontend administrativo  
17. Integração final frontend + backend  

---

## 15. Observação final

Este material foi organizado para servir como base real de construção do sistema no Codex, de forma progressiva e coerente.

A ideia é evitar começar pelo visual sem ter a estrutura pronta, e também evitar criar backend sem já pensar nas regras de negócio, permissões, migrations e seeders.

Assim, você consegue construir um projeto mais sólido, testável e próximo de um sistema real de mercado.
