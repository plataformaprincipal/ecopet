import { Router } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { paramString } from "../lib/request-utils.js";
import { createTicket, listTickets, updateTicket } from "../services/ticket-service.js";
import { createAuditLog } from "../services/audit-service.js";
import { isGestorRole } from "../services/rbac-service.js";
import type { SupportCategory, TicketPriority } from "@prisma/client";

const router = Router();

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const isGestor = isGestorRole(req.userRole);
    const tickets = await listTickets(
      isGestor ? { isGestor: true } : { requesterId: req.userId }
    );
    res.json(tickets);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const { subject, description, category, priority } = req.body as {
      subject: string;
      description: string;
      category: string;
      priority?: TicketPriority;
    };
    const ticket = await createTicket({
      subject,
      description,
      category: (category as SupportCategory) || "OTHER",
      priority,
      requesterId: req.userId!,
    });
    await createAuditLog({
      userId: req.userId,
      action: "CREATE",
      module: "support",
      resource: "ticket",
      resourceId: ticket.id,
    });
    res.status(201).json(ticket);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const ticketId = paramString(req.params.id);
    const ticket = await updateTicket(ticketId, req.body, req.userId);
    await createAuditLog({
      userId: req.userId,
      action: "UPDATE",
      module: "support",
      resource: "ticket",
      resourceId: ticketId,
      metadata: req.body,
    });
    res.json(ticket);
  } catch (e) {
    next(e);
  }
});

export default router;
