
import { Router } from "express";
import * as facturasController from "../controllers/facturas.controller.js";
import { role } from "../middlewares/role.middleware.js";

const router = Router();

router.post(
  "/",
  role("ADMIN", "VENDEDOR"),
  facturasController.crear
);

router.get(
  "/",
  role("ADMIN", "VENDEDOR", "CONTADOR"),
  facturasController.listar
);

router.get(
  "/:id",
  role("ADMIN", "VENDEDOR", "CONTADOR"),
  facturasController.obtener
);

export default router;
