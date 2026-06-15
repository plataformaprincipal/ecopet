"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layouts/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchMyProfile, updateMyProfile } from "@/lib/social/client-api";
import { useFoundationSession } from "@/hooks/use-foundation-session";

export default function MyProfilePage() {
  const { user } = useFoundationSession();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMyProfile().then((d) => {
      setDisplayName(d.profile.displayName);
      setBio(d.profile.bio ?? "");
    });
  }, []);

  async function save() {
    setSaving(true);
    try {
      await updateMyProfile({ displayName, bio });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppHeader title="Meu perfil público" />
      <main className="mx-auto max-w-lg flex-1 space-y-4 p-4">
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nome público" />
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" rows={4} />
        <Button onClick={save} disabled={saving}>
          Salvar
        </Button>
        {user && (
          <p className="text-xs text-muted-foreground">
            Seu perfil público não exibe e-mail, CPF, telefone ou endereço.
          </p>
        )}
      </main>
    </>
  );
}
