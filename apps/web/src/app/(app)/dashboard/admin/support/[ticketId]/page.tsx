"use client";

import { useEffect, useState } from "react";
import { SupportTicketView } from "@/components/features/messages/support-hub";

export default function AdminSupportTicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const [id, setId] = useState("");
  useEffect(() => { void params.then((p) => setId(p.ticketId)); }, [params]);
  if (!id) return null;
  return <SupportTicketView ticketId={id} admin />;
}
