import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { canManageUsuarios } from "../middleware/permissions.js";
import {
  listUsuarios,
  getUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from "../controllers/usuariosController.js";

const router = Router();

router.use(authenticate, canManageUsuarios);

router.get("/", listUsuarios);
router.get("/:id", getUsuario);
router.post("/", createUsuario);
router.put("/:id", updateUsuario);
router.delete("/:id", deleteUsuario);

export default router;
