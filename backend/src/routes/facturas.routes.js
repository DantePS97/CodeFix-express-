import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { tenant } from "../middlewares/tenant.middleware.js";
import { role } from "../middlewares/role.middleware.js";
import { crear, listar, obtener } from "../controllers/facturas.controller.js";

const router = Router();

router.use(auth, tenant);

router.post("/", role("ADMIN", "VENDEDOR"), crear);
router.get("/", role("ADMIN", "VENDEDOR", "CONTADOR"), listar);
router.get("/:id", role("ADMIN", "VENDEDOR", "CONTADOR"), obtener);

export default router;
