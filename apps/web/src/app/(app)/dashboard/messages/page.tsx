"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessagesHub } from "@/components/features/messages/messages-hub";

export default function MessagesPage() {
  return <MessagesHub />;
}
