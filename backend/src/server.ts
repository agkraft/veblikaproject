import "dotenv/config"; // ← Sabse pehle — .env file padho
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import connectDatabase from "./config/database";
import deploymentRoutes from "./routes/deploymentRoutes";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────────────

app.use("/api", deploymentRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    message: "Veblika backend is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ── 404 Handler ──────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", error.message);
  res.status(500).json({
    success: false,
    message: "Something went wrong",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

// ── Start Application ─────────────────────────────────────────
const startServer = async () => {
  // Step 1: MongoDB se connect karo
  await connectDatabase();

  app.listen(PORT, () => {
    console.log("");
    console.log("╔══════════════════════════════════════════╗");
    console.log("║      🚀 Veblika Backend Server           ║");
    console.log("╠══════════════════════════════════════════╣");
    console.log(`║  URL     : http://localhost:${PORT}          ║`);
    console.log(`║  Health  : http://localhost:${PORT}/health   ║`);
    console.log("╠══════════════════════════════════════════╣");
    console.log("║  API Endpoints:                          ║");
    console.log(`║  POST /api/deploy                        ║`);
    console.log(`║  GET  /api/status/:id                    ║`);
    console.log(`║  GET  /api/deployments                   ║`);
    console.log("╠══════════════════════════════════════════╣");
    console.log("║  ⚠️  Start worker in a new terminal:     ║");
    console.log("║  npm run dev:worker                      ║");
    console.log("╚══════════════════════════════════════════╝");
    console.log("");
  });
};

if (process.env.NODE_ENV === "production") {
  import("./queue/deploymentWorker")
    .then(() => console.log("✅ Worker started alongside server"))
    .catch((err) => console.error("Worker failed to start:", err));
}

startServer();
