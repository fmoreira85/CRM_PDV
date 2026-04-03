import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { canManageEstoque } from "../middleware/permissions.js";
import {
  listEstoque,
  listBaixoEstoque,
  listVencimentosProximos,
  getEstoque,
  createEstoque,
  updateEstoque,
  deleteEstoque,
} from "../controllers/estoqueController.js";

const router = Router();

router.use(authenticate, canManageEstoque);

router.get("/baixo-estoque", listBaixoEstoque);
router.get("/proximos-vencimento", listVencimentosProximos);
router.get("/", listEstoque);
router.get("/:id", getEstoque);
router.post("/", createEstoque);
router.put("/:id", updateEstoque);
router.delete("/:id", deleteEstoque);

export default router;
