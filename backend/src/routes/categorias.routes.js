import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { canManageProdutos } from "../middleware/permissions.js";
import {
  listCategorias,
  getCategoria,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from "../controllers/categoriasController.js";

const router = Router();

router.use(authenticate, canManageProdutos);

router.get("/", listCategorias);
router.get("/:id", getCategoria);
router.post("/", createCategoria);
router.put("/:id", updateCategoria);
router.delete("/:id", deleteCategoria);

export default router;
