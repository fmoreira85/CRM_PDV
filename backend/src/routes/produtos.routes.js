import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { canManageProdutos } from "../middleware/permissions.js";
import {
  listProdutos,
  getProduto,
  createProduto,
  updateProduto,
  deleteProduto,
} from "../controllers/produtosController.js";

const router = Router();

router.use(authenticate, canManageProdutos);

router.get("/", listProdutos);
router.get("/:id", getProduto);
router.post("/", createProduto);
router.put("/:id", updateProduto);
router.delete("/:id", deleteProduto);

export default router;
