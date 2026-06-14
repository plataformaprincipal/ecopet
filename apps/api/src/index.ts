import "./env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import { prisma } from "@ecopet/database";
import { resolveAvailablePort } from "./lib/resolve-port.js";
import { writeRuntimePort } from "./lib/runtime-port.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import petRoutes from "./routes/pets.js";
import publicPetRoutes from "./routes/public-pets.js";
import postRoutes from "./routes/posts.js";
import productRoutes from "./routes/products.js";
import serviceRoutes from "./routes/services.js";
import aiRoutes from "./routes/ai.js";
import adoptionRoutes from "./routes/adoption.js";
import translationRoutes from "./routes/translation.js";
import notificationRoutes from "./routes/notifications.js";
import gestorRoutes from "./routes/gestor.js";
import conversationRoutes from "./routes/conversations.js";
import chatRoutes from "./routes/chats.js";
import guestChatRoutes from "./routes/guest-chat.js";
import ticketRoutes from "./routes/tickets.js";
import integrationRoutes from "./routes/integrations.js";
import walletRoutes from "./routes/wallet.js";
import orderRoutes from "./routes/orders.js";
import logisticsRoutes from "./routes/logistics.js";
import advisoryRoutes from "./routes/advisory.js";
import platformRoutes from "./routes/platform.js";
import moderationRoutes from "./routes/moderation.js";
import appointmentRoutes from "./routes/appointments.js";
import iotRoutes from "./routes/iot.js";
import robotsRoutes from "./routes/robots.js";
import cartRoutes from "./routes/cart.js";
import marketplacePartnerRoutes from "./routes/marketplace-partner.js";
import { authMiddleware } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error.js";
import { logStructured } from "./lib/logger.js";

const app = express();
const httpServer = createServer(app);
const preferredPort = Number(process.env.API_PORT || process.env.PORT || 4000);

const webOrigins = (process.env.WEB_URL || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const io = new Server(httpServer, {
  cors: { origin: webOrigins, credentials: true },
});

app.use(helmet());
app.use(cors({ origin: webOrigins, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const isAuth = req.path.includes("/auth") || req.originalUrl.includes("/auth");
    const isHealth = req.path.includes("health");
    if (isAuth || isHealth) {
      logStructured(isAuth ? "auth" : "api", "request", {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        ms: Date.now() - start,
      });
    }
  });
  next();
});

async function healthPayload() {
  let database = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch (err) {
    logStructured("database", "health_check_failed", { message: (err as Error).message });
  }
  return {
    status: database ? "ok" : "degraded",
    database,
    service: "ecopet-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  };
}

app.get("/health", async (_req, res) => {
  res.json(await healthPayload());
});

app.get("/api/health", async (_req, res) => {
  res.json(await healthPayload());
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/pets", authMiddleware, petRoutes);
app.use("/api/public/pets", publicPetRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/products", productRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/ai", authMiddleware, aiRoutes);
app.use("/api/adoption", adoptionRoutes);
app.use("/api/translate", translationRoutes);
app.use("/api/notifications", authMiddleware, notificationRoutes);
app.use("/api/gestor", authMiddleware, gestorRoutes);
app.use("/api/chats/guest", guestChatRoutes);
app.use("/api/chats", authMiddleware, chatRoutes);
app.use("/api/conversations", authMiddleware, conversationRoutes);
app.use("/api/tickets", authMiddleware, ticketRoutes);
app.use("/api/integrations", authMiddleware, integrationRoutes);
app.use("/api/wallet", authMiddleware, walletRoutes);
app.use("/api/orders", authMiddleware, orderRoutes);
app.use("/api/logistics", logisticsRoutes);
app.use("/api/advisory", authMiddleware, advisoryRoutes);
app.use("/api/platform", platformRoutes);
app.use("/api/moderation", authMiddleware, moderationRoutes);
app.use("/api/appointments", authMiddleware, appointmentRoutes);
app.use("/api/iot", authMiddleware, iotRoutes);
app.use("/api/robots", authMiddleware, robotsRoutes);
app.use("/api/cart", authMiddleware, cartRoutes);
app.use("/api/marketplace/partner", authMiddleware, marketplacePartnerRoutes);

app.use(errorHandler);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token && process.env.NODE_ENV === "production") {
    return next(new Error("Unauthorized"));
  }
  next();
});

io.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId as string | undefined;
  if (userId) socket.join(`user:${userId}`);

  socket.on("join:conversation", (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on("message:send", async (data: { conversationId: string; senderId: string; content: string }) => {
    try {
      const message = await prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
        },
        include: { sender: { select: { id: true, name: true, avatar: true } } },
      });
      io.to(`conversation:${data.conversationId}`).emit("message:new", message);
    } catch {
      socket.emit("message:error", { error: "Failed to send message" });
    }
  });

  socket.on("disconnect", () => {});
});

async function startServer() {
  let port: number;
  try {
    port = await resolveAvailablePort(preferredPort);
  } catch (err) {
    console.error("[ECOPET API] Falha ao resolver porta:", (err as Error).message);
    process.exit(1);
  }

  if (port !== preferredPort) {
    console.warn(
      `[ECOPET API] Porta ${preferredPort} em uso — API iniciando em http://localhost:${port}`
    );
  }

  httpServer.listen(port, async () => {
    writeRuntimePort(port);
    console.log(`🐾 ECOPET API running on http://localhost:${port}`);
    console.log(`   Health: http://localhost:${port}/health`);
    console.log(`   Register: POST http://localhost:${port}/api/auth/register`);
    try {
      const { ensureInternalBotsSeeded } = await import("./services/internal-bots-service.js");
      await ensureInternalBotsSeeded();
    } catch (e) {
      console.warn("[ECOPET] Falha ao inicializar robôs internos:", (e as Error).message);
    }
  });

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `[ECOPET API] Porta ${port} ficou indisponível (EADDRINUSE). Use "npm run dev" na raiz ou defina API_PORT.`
      );
    } else {
      console.error("[ECOPET API] Erro ao iniciar servidor:", err.message);
    }
    process.exit(1);
  });
}

startServer();

export { io };
