import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { canManageDespesas } from "../middleware/permissions.js";
import {
  listDespesas,
  getDespesa,
  createDespesa,
  updateDespesa,
  deleteDespesa,
} from "../controllers/despesasController.js";

const router = Router();

router.use(authenticate, canManageDespesas);

router.get("/", listDespesas);
router.get("/:id", getDespesa);
router.post("/", createDespesa);
router.put("/:id", updateDespesa);
router.delete("/:id", deleteDespesa);

export default router;
