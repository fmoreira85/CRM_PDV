import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { canManageMovimentacoesEstoque } from "../middleware/permissions.js";
import {
  listMovimentacoesEstoque,
  listDescarte,
  listConferencia,
  getMovimentacaoEstoque,
  createMovimentacaoEstoque,
  updateMovimentacaoEstoque,
  deleteMovimentacaoEstoque,
} from "../controllers/movimentacoesEstoqueController.js";

const router = Router();

router.use(authenticate, canManageMovimentacoesEstoque);

router.get("/descarte", listDescarte);
router.get("/conferencia", listConferencia);
router.get("/", listMovimentacoesEstoque);
router.get("/:id", getMovimentacaoEstoque);
router.post("/", createMovimentacaoEstoque);
router.put("/:id", updateMovimentacaoEstoque);
router.delete("/:id", deleteMovimentacaoEstoque);

export default router;
