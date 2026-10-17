import express from "express";
import cors from "cors";
import negociosRoutes from "./routes/negocios.routes.js";
import authRoutes from "./routes/auth.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import clientesRoutes from "../../backend/src/routes/clientes.routes.js";
import facturasRoutes from "../../backend/src/routes/facturas.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api", (req, res) => {
	res.json({
		message: "API CodeFix Express funcionando",
	});
});

app.use("/api/negocios", negociosRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/facturas", facturasRoutes);
app.use("/api/clientes", clientesRoutes);

// Debe ir al final: captura los errores que `next(err)` propaga desde
// cualquier ruta o middleware anterior.
app.use(errorHandler);

export default app;
