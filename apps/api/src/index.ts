import "./env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import { prisma } from "@ecopet/database";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import petRoutes from "./routes/pets.js";
import postRoutes from "./routes/posts.js";
import productRoutes from "./routes/products.js";
import serviceRoutes from "./routes/services.js";
import aiRoutes from "./routes/ai.js";
import adoptionRoutes from "./routes/adoption.js";
import translationRoutes from "./routes/translation.js";
import notificationRoutes from "./routes/notifications.js";
import gestorRoutes from "./routes/gestor.js";
import conversationRoutes from "./routes/conversations.js";
import ticketRoutes from "./routes/tickets.js";
import integrationRoutes from "./routes/integrations.js";
import walletRoutes from "./routes/wallet.js";
import orderRoutes from "./routes/orders.js";
import logisticsRoutes from "./routes/logistics.js";
import advisoryRoutes from "./routes/advisory.js";
import platformRoutes from "./routes/platform.js";
import moderationRoutes from "./routes/moderation.js";
import { authMiddleware } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error.js";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.API_PORT || 4000;

const io = new Server(httpServer, {
  cors: { origin: process.env.WEB_URL || "http://localhost:3000", credentials: true },
});

app.use(helmet());
app.use(cors({ origin: process.env.WEB_URL || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ecopet-api", version: "1.0.0" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/pets", authMiddleware, petRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/products", productRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/ai", authMiddleware, aiRoutes);
app.use("/api/adoption", adoptionRoutes);
app.use("/api/translate", translationRoutes);
app.use("/api/notifications", authMiddleware, notificationRoutes);
app.use("/api/gestor", authMiddleware, gestorRoutes);
app.use("/api/conversations", authMiddleware, conversationRoutes);
app.use("/api/tickets", authMiddleware, ticketRoutes);
app.use("/api/integrations", authMiddleware, integrationRoutes);
app.use("/api/wallet", authMiddleware, walletRoutes);
app.use("/api/orders", authMiddleware, orderRoutes);
app.use("/api/logistics", logisticsRoutes);
app.use("/api/advisory", authMiddleware, advisoryRoutes);
app.use("/api/platform", platformRoutes);
app.use("/api/moderation", authMiddleware, moderationRoutes);

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

httpServer.listen(PORT, () => {
  console.log(`🐾 ECOPET API running on http://localhost:${PORT}`);
});

export { io };
