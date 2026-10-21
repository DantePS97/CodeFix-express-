import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { tenant } from "../middlewares/tenant.middleware.js";
import { role } from "../middlewares/role.middleware.js";
import { registrar, obtenerActual } from "../controllers/negocios.controller.js";

const router = Router();

// El registro es público: auth y tenant van por ruta, no con router.use.
router.post("/", registrar);
router.get("/actual", auth, tenant, role("ADMIN", "VENDEDOR"), obtenerActual);

export default router;
