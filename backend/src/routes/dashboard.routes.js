import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { tenant } from "../middlewares/tenant.middleware.js";
import { role } from "../middlewares/role.middleware.js";
import { indicadores } from "../controllers/dashboard.controller.js";

const router = Router();

router.use(auth, tenant);

router.get("/indicadores", role("ADMIN"), indicadores);

export default router;
