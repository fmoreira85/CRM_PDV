import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { canManageCaixa } from "../middleware/permissions.js";
import {
  listCaixa,
  getResumoCaixa,
  getComparativo,
  getCaixa,
  createCaixa,
  updateCaixa,
  deleteCaixa,
} from "../controllers/caixaController.js";

const router = Router();

router.use(authenticate, canManageCaixa);

router.get("/resumo", getResumoCaixa);
router.get("/comparativo", getComparativo);
router.get("/", listCaixa);
router.get("/:id", getCaixa);
router.post("/", createCaixa);
router.put("/:id", updateCaixa);
router.delete("/:id", deleteCaixa);

export default router;
