import express from "express";
import cors from "cors";
import { errorHandler } from "./src/middleware/errorHandler.js";
import healthRoutes from "./src/routes/index.js";
import authRoutes from "./src/routes/auth.routes.js";
import usuariosRoutes from "./src/routes/usuarios.routes.js";
import clientesRoutes from "./src/routes/clientes.routes.js";
import produtosRoutes from "./src/routes/produtos.routes.js";
import categoriasRoutes from "./src/routes/categorias.routes.js";
import subcategoriasRoutes from "./src/routes/subcategorias.routes.js";
import estoqueRoutes from "./src/routes/estoque.routes.js";
import movimentacoesEstoqueRoutes from "./src/routes/movimentacoesEstoque.routes.js";
import vendasRoutes from "./src/routes/vendas.routes.js";
import itensVendidosRoutes from "./src/routes/itensVendidos.routes.js";
import despesasRoutes from "./src/routes/despesas.routes.js";
import fornecedoresRoutes from "./src/routes/fornecedores.routes.js";
import encomendasRoutes from "./src/routes/encomendas.routes.js";
import caixaRoutes from "./src/routes/caixa.routes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import autorizacoesRoutes from "./src/routes/autorizacoes.routes.js";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/produtos", produtosRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/subcategorias", subcategoriasRoutes);
app.use("/api/estoque", estoqueRoutes);
app.use("/api/movimentacoes-estoque", movimentacoesEstoqueRoutes);
app.use("/api/vendas", vendasRoutes);
app.use("/api/itens-vendidos", itensVendidosRoutes);
app.use("/api/despesas", despesasRoutes);
app.use("/api/fornecedores", fornecedoresRoutes);
app.use("/api/encomendas", encomendasRoutes);
app.use("/api/caixa", caixaRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/autorizacoes", autorizacoesRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "CRM PDV API",
  });
});

app.use(errorHandler);

export default app;
