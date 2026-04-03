import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { canManageClientes } from "../middleware/permissions.js";
import {
  listClientes,
  getCliente,
  createCliente,
  updateCliente,
  deleteCliente,
} from "../controllers/clientesController.js";

const router = Router();

router.use(authenticate, canManageClientes);

router.get("/", listClientes);
router.get("/:id", getCliente);
router.post("/", createCliente);
router.put("/:id", updateCliente);
router.delete("/:id", deleteCliente);

export default router;
