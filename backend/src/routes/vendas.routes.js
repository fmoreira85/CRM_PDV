import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  canReadVendas,
  canCreateVendas,
  canManageVendas,
} from "../middleware/permissions.js";
import {
  listVendas,
  getVenda,
  createVenda,
  updateVenda,
  deleteVenda,
} from "../controllers/vendasController.js";

const router = Router();

router.use(authenticate);

router.get("/", canReadVendas, listVendas);
router.get("/:id", canReadVendas, getVenda);
router.post("/", canCreateVendas, createVenda);
router.put("/:id", canManageVendas, updateVenda);
router.delete("/:id", canManageVendas, deleteVenda);

export default router;
