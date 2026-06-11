"use client";

import { useEffect, useState } from "react";
import { BookOpen, Download, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAccessibilityStore } from "@/store/accessibility-store";
import { extractPageText, textToBraille } from "@/lib/accessibility/braille";
import { useAriaAnnounce } from "./aria-live-region";

export function BraillePanel() {
  const open = useAccessibilityStore((s) => s.braillePanelOpen);
  const setOpen = useAccessibilityStore((s) => s.setBraillePanelOpen);
  const toggle = useAccessibilityStore((s) => s.toggle);
  const screenReaderMode = useAccessibilityStore((s) => s.screenReaderMode);
  const announce = useAriaAnnounce();
  const [pageText, setPageText] = useState("");
  const [braille, setBraille] = useState("");

  useEffect(() => {
    if (!open) return;
    const text = extractPageText().slice(0, 2000);
    setPageText(text);
    setBraille(textToBraille(text.slice(0, 400)));
  }, [open]);

  function enableScreenReaderMode() {
    if (!screenReaderMode) toggle("screenReaderMode");
    announce("Modo leitor de tela ativado. Use Tab para navegar.", "polite");
  }

  async function copyText() {
    await navigator.clipboard.writeText(pageText);
    announce("Texto copiado para a área de transferência.", "polite");
  }

  function downloadText() {
    const blob = new Blob([pageText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ecopet-conteudo.txt";
    a.click();
    URL.revokeObjectURL(url);
    announce("Arquivo de texto exportado.", "polite");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg" aria-describedby="braille-panel-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-ecopet-green" aria-hidden />
            Braille e leitura assistida
          </DialogTitle>
          <DialogDescription id="braille-panel-desc">
            Compatível com NVDA, JAWS, VoiceOver e displays Braille. Exporte o conteúdo da página em texto plano.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button type="button" className="w-full" onClick={enableScreenReaderMode}>
            {screenReaderMode ? "Modo leitor de tela ativo" : "Ativar modo leitor de tela"}
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={copyText}>
              <Copy className="h-4 w-4" aria-hidden /> Copiar texto
            </Button>
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={downloadText}>
              <Download className="h-4 w-4" aria-hidden /> Exportar .txt
            </Button>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ecopet-gray">Texto da página</p>
            <div
              className="max-h-32 overflow-y-auto rounded-xl border border-ecopet-gray/15 bg-ecopet-cream/30 p-3 text-xs leading-relaxed dark:bg-white/5"
              role="region"
              aria-label="Conteúdo textual da página"
            >
              {pageText || "Carregando conteúdo..."}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ecopet-gray">
              Prévia Braille (Unicode)
            </p>
            <div
              className="max-h-24 overflow-y-auto rounded-xl border border-ecopet-gray/15 bg-ecopet-dark p-3 text-lg leading-loose text-ecopet-yellow"
              role="region"
              aria-label="Prévia em Braille"
            >
              {braille || "—"}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
