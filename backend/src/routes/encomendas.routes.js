import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { canManageEncomendas } from "../middleware/permissions.js";
import {
  listEncomendas,
  getEncomenda,
  createEncomenda,
  updateEncomenda,
  deleteEncomenda,
} from "../controllers/encomendasController.js";

const router = Router();

router.use(authenticate, canManageEncomendas);

router.get("/", listEncomendas);
router.get("/:id", getEncomenda);
router.post("/", createEncomenda);
router.put("/:id", updateEncomenda);
router.delete("/:id", deleteEncomenda);

export default router;
