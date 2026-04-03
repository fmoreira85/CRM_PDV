import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { canManageProdutos } from "../middleware/permissions.js";
import {
  listSubcategorias,
  getSubcategoria,
  createSubcategoria,
  updateSubcategoria,
  deleteSubcategoria,
} from "../controllers/subcategoriasController.js";

const router = Router();

router.use(authenticate, canManageProdutos);

router.get("/", listSubcategorias);
router.get("/:id", getSubcategoria);
router.post("/", createSubcategoria);
router.put("/:id", updateSubcategoria);
router.delete("/:id", deleteSubcategoria);

export default router;
