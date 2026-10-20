import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { tenant } from "../middlewares/tenant.middleware.js";
import { role } from "../middlewares/role.middleware.js";
import { listar, crear, actualizar } from "../controllers/clientes.controller.js";

const router = Router();

router.use(auth, tenant);

router.get("/", role("ADMIN", "VENDEDOR"), listar);
router.post("/", role("ADMIN", "VENDEDOR"), crear);
router.patch("/:id", role("ADMIN", "VENDEDOR"), actualizar);

export default router;
