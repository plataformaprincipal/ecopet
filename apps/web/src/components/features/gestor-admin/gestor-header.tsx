"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = { title: string; description?: string };

export function GestorHeader({ title, description }: Props) {
  return (
    <header className="border-b bg-white px-6 py-4 dark:bg-gray-950">
      <Link href="/dashboard/admin" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline">
        <ArrowLeft className="h-3 w-3" /> Admin
      </Link>
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </header>
  );
}
