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

type AuthRequiredModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleKey?: string;
  descriptionKey?: string;
  signInKey?: string;
  createAccountKey?: string;
};

export function AuthRequiredModal({
  open,
  onOpenChange,
  titleKey = "public.authModal.title",
  descriptionKey = "public.authModal.description",
  signInKey = "public.authModal.signIn",
  createAccountKey = "public.authModal.createAccount",
}: AuthRequiredModalProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const callback = encodeURIComponent(pathname);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="auth-required-desc">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-ecopet-green/10">
            <Lock className="h-6 w-6 text-ecopet-green" aria-hidden />
          </div>
          <DialogTitle>{t(titleKey as never)}</DialogTitle>
          <DialogDescription id="auth-required-desc">{t(descriptionKey as never)}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href={`/login?callbackUrl=${callback}`}>{t(signInKey as never)}</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/cadastro">{t(createAccountKey as never)}</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
