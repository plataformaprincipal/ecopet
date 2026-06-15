"use client";

import { NewConversationModal } from "@/components/features/messages/new-conversation-modal";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NewMessagePage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  return (
    <div className="p-6">
      <Button variant="outline" onClick={() => router.push("/dashboard/messages")}>Voltar</Button>
      <NewConversationModal
        open={open}
        onClose={() => { setOpen(false); router.push("/dashboard/messages"); }}
        onCreated={(id) => router.push(`/dashboard/messages/${id}`)}
      />
    </div>
  );
}
