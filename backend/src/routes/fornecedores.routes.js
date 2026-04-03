import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { canManageFornecedores } from "../middleware/permissions.js";
import {
  listFornecedores,
  getFornecedor,
  createFornecedor,
  updateFornecedor,
  deleteFornecedor,
} from "../controllers/fornecedoresController.js";

const router = Router();

router.use(authenticate, canManageFornecedores);

router.get("/", listFornecedores);
router.get("/:id", getFornecedor);
router.post("/", createFornecedor);
router.put("/:id", updateFornecedor);
router.delete("/:id", deleteFornecedor);

export default router;
