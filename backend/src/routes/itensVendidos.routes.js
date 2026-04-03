import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  canReadItensVendidos,
  canCreateItensVendidos,
  canManageItensVendidos,
} from "../middleware/permissions.js";
import {
  listItensVendidos,
  getItemVendido,
  createItemVendido,
  updateItemVendido,
  deleteItemVendido,
} from "../controllers/itensVendidosController.js";

const router = Router();

router.use(authenticate);

router.get("/", canReadItensVendidos, listItensVendidos);
router.get("/:id", canReadItensVendidos, getItemVendido);
router.post("/", canCreateItensVendidos, createItemVendido);
router.put("/:id", canManageItensVendidos, updateItemVendido);
router.delete("/:id", canManageItensVendidos, deleteItemVendido);

export default router;
