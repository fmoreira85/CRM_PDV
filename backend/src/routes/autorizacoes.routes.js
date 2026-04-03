import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  canRequestAutorizacao,
  canApproveAutorizacao,
} from "../middleware/permissions.js";
import {
  listAutorizacoes,
  getAutorizacao,
  createAutorizacao,
  approveAutorizacao,
} from "../controllers/autorizacoesController.js";

const router = Router();

router.use(authenticate);

router.get("/", canRequestAutorizacao, listAutorizacoes);
router.get("/:id", canRequestAutorizacao, getAutorizacao);
router.post("/", canRequestAutorizacao, createAutorizacao);
router.post("/:id/aprovar", canApproveAutorizacao, approveAutorizacao);

export default router;
