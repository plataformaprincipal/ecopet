"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/providers/i18n-provider";

export type LoginRequiredModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  titleKey?: string;
  descriptionKey?: string;
  signInKey?: string;
  createAccountKey?: string;
};

export function LoginRequiredModal({
  open,
  onOpenChange,
  title,
  description,
  titleKey = "public.authModal.title",
  descriptionKey = "public.authModal.description",
  signInKey = "public.authModal.signIn",
  createAccountKey = "public.authModal.createAccount",
}: LoginRequiredModalProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const callback = encodeURIComponent(pathname);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="login-required-desc" className="rounded-[20px]">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-ecopet-green/10">
            <Lock className="h-6 w-6 text-ecopet-green" aria-hidden />
          </div>
          <DialogTitle>{title ?? t(titleKey as never)}</DialogTitle>
          <DialogDescription id="login-required-desc">
            {description ?? t(descriptionKey as never)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1 rounded-xl">
            <Link href={`/login?callbackUrl=${callback}`}>{t(signInKey as never)}</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 rounded-xl">
            <Link href="/cadastro">{t(createAccountKey as never)}</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
