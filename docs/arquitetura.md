# Arquitetura do Projeto

## Visao geral
Este projeto e dividido em duas partes principais: `frontend` e `backend`. Essa separacao organiza responsabilidades e deixa o sistema preparado para crescer por modulos.

## Papel do frontend
O frontend e responsavel pela interface administrativa. Ele entrega as telas, experiencia do usuario, navegacao e chamadas HTTP para a API. Aqui ficam o layout, estilos, icones e scripts em JavaScript Vanilla.

## Papel do backend
O backend concentra as regras de negocio, validacoes, acesso ao banco de dados e exposicao de rotas HTTP. Ele protege dados sensiveis e garante consistencia entre as operacoes do sistema.

## Por que separar frontend e backend
Separar as camadas facilita o desenvolvimento paralelo, melhora seguranca e permite evoluir cada parte com independencia. Tambem deixa a manutencao mais simples e permite escalar o backend sem alterar a interface.

## Estrutura do frontend
- `frontend/index.html`: ponto de entrada da interface.
- `frontend/main.js`: inicializacao do app, navegacao simples e controle das telas.
- `frontend/src/utils/`: funcoes utilitarias de uso geral.
- `frontend/src/middlewares/`: regras simples de controle no frontend, como validacoes ou protecoes basicas.
- `frontend/src/api/`: camada de comunicacao com o backend (fetch, headers, tratamento de erros).
- `frontend/src/pages/`: telas e componentes de paginas.
- `frontend/src/assets/`: imagens, icones e arquivos estaticos.
- `frontend/src/styles/`: estilos globais e temas visuais.

## Estrutura do backend
- `backend/server.js`: inicializa o servidor HTTP.
- `backend/app.js`: configura middlewares, CORS e rotas principais.
- `backend/connections.js`: conexao com o MySQL usando `mysql2`.
- `backend/src/routes/`: definicao de rotas por modulo.
- `backend/src/controllers/`: logica de negocio e resposta das rotas.
- `backend/src/middleware/`: middlewares de erro, autenticacao e validacoes.
- `backend/src/utils/`: helpers e utilitarios do backend.
- `backend/src/config/`: scripts de banco como `migrations.sql` e `seeders.sql`.

## Fluxo basico
Tela -> Requisicao HTTP -> Rota -> Controller -> Banco de dados -> Resposta -> Tela.

## Como essa estrutura facilita manutencao
Essa organizacao cria limites claros entre interface, regras de negocio e dados. Cada modulo pode ser alterado sem quebrar o restante, o que reduz riscos e acelera evolucoes futuras.
