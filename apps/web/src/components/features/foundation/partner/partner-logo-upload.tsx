"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, RotateCcw, Trash2, Upload, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ASSETS } from "@/assets";
import { PARTNER_LOGO_ACCEPT, PARTNER_LOGO_MAX_BYTES, formatFileSize } from "@/lib/partner/document-types";
import { cn } from "@/lib/utils";

export type PartnerLogoValue = {
  previewUrl: string | null;
  file: File | null;
  alt: string;
};

type PartnerLogoUploadProps = {
  value: PartnerLogoValue;
  onChange: (value: PartnerLogoValue) => void;
  businessName?: string;
  fieldId?: string;
};

const OUTPUT_SIZE = 512;

function isSvgFile(file: File) {
  return file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
}

async function cropImageToSquare(
  imageSrc: string,
  zoom: number,
  offsetX: number,
  offsetY: number,
  mimeType: string
): Promise<File> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível.");

  const baseScale = Math.max(OUTPUT_SIZE / img.width, OUTPUT_SIZE / img.height);
  const scale = baseScale * zoom;
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const x = (OUTPUT_SIZE - drawW) / 2 + offsetX;
  const y = (OUTPUT_SIZE - drawH) / 2 + offsetY;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.drawImage(img, x, y, drawW, drawH);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao processar imagem."))),
      mimeType === "image/png" ? "image/png" : "image/jpeg",
      0.92
    );
  });

  const ext = mimeType === "image/png" ? "png" : "jpg";
  return new File([blob], `logo.${ext}`, { type: blob.type });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
    img.src = src;
  });
}

export function PartnerLogoUpload({ value, onChange, businessName, fieldId = "partner-logo" }: PartnerLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [processing, setProcessing] = useState(false);

  const defaultAlt = businessName?.trim()
    ? `Logotipo de ${businessName.trim()}`
    : "Logotipo do parceiro EcoPet";

  const preview = value.previewUrl ?? ASSETS.logo;
  const hasCustomLogo = Boolean(value.previewUrl);

  const validateFile = useCallback((file: File) => {
    if (file.size > PARTNER_LOGO_MAX_BYTES) {
      return `Arquivo excede ${formatFileSize(PARTNER_LOGO_MAX_BYTES)}.`;
    }
    const allowed = PARTNER_LOGO_ACCEPT.split(",").map((t) => t.trim());
    const ok =
      allowed.some((t) => file.type === t || (t.startsWith(".") && file.name.toLowerCase().endsWith(t))) ||
      file.type.startsWith("image/");
    if (!ok) return "Formato não permitido. Use JPG, PNG, WEBP ou SVG.";
    return null;
  }, []);

  const handleSelect = useCallback(
    (file: File | null) => {
      if (!file) return;
      const err = validateFile(file);
      if (err) {
        setError(err);
        return;
      }
      setError("");
      if (isSvgFile(file)) {
        const url = URL.createObjectURL(file);
        onChange({ previewUrl: url, file, alt: value.alt || defaultAlt });
        return;
      }
      const url = URL.createObjectURL(file);
      setPendingFile(file);
      setCropSrc(url);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setCropOpen(true);
    },
    [defaultAlt, onChange, validateFile, value.alt]
  );

  useEffect(() => {
    return () => {
      if (value.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(value.previewUrl);
    };
  }, [value.previewUrl]);

  async function applyCrop() {
    if (!cropSrc || !pendingFile) return;
    setProcessing(true);
    try {
      const cropped = await cropImageToSquare(
        cropSrc,
        zoom,
        offset.x,
        offset.y,
        pendingFile.type === "image/png" ? "image/png" : "image/jpeg"
      );
      const previewUrl = URL.createObjectURL(cropped);
      onChange({ previewUrl, file: cropped, alt: value.alt || defaultAlt });
      setCropOpen(false);
      if (cropSrc.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
      setPendingFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao recortar imagem.");
    } finally {
      setProcessing(false);
    }
  }

  function removeLogo() {
    if (value.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(value.previewUrl);
    onChange({ previewUrl: null, file: null, alt: value.alt || defaultAlt });
    setError("");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleSelect(file);
  }

  const altText = value.alt.trim() || defaultAlt;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={fieldId} className="text-sm font-medium">
          Logotipo da Marca ou Negócio
        </label>
        <p id={hintId} className="mt-1 text-xs text-muted-foreground">
          Opcional. JPG, PNG, WEBP ou SVG até {formatFileSize(PARTNER_LOGO_MAX_BYTES)}. Recorte quadrado com zoom.
        </p>
      </div>

      <div
        className={cn(
          "flex flex-col items-center gap-4 rounded-xl border-2 border-dashed p-4 transition-colors sm:flex-row sm:items-start",
          "border-emerald-200/80 bg-emerald-50/30 hover:border-emerald-400/60"
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        role="group"
        aria-label="Área de upload do logotipo"
      >
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border bg-white shadow-sm">
          <Image
            src={preview}
            alt={hasCustomLogo ? altText : "Avatar padrão EcoPet — nenhum logotipo enviado"}
            fill
            className="object-cover"
            unoptimized={hasCustomLogo}
          />
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            id={fieldId}
            type="file"
            className="hidden"
            accept={PARTNER_LOGO_ACCEPT}
            aria-describedby={`${hintId}${error ? ` ${errorId}` : ""}`}
            onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
              <Upload className="mr-1.5 h-4 w-4" aria-hidden />
              {hasCustomLogo ? "Substituir imagem" : "Enviar logotipo"}
            </Button>
            {hasCustomLogo && (
              <>
                <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
                  <Camera className="mr-1.5 h-4 w-4" aria-hidden />
                  Trocar
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={removeLogo}>
                  <Trash2 className="mr-1.5 h-4 w-4" aria-hidden />
                  Remover
                </Button>
              </>
            )}
          </div>
          <Input
            id={`${fieldId}-alt`}
            value={value.alt}
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
            placeholder="Texto alternativo para acessibilidade"
            aria-label="Texto alternativo do logotipo"
            className="text-sm"
          />
        </div>
      </div>

      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className="max-w-md" aria-describedby="crop-dialog-desc">
          <DialogHeader>
            <DialogTitle>Recortar logotipo</DialogTitle>
            <p id="crop-dialog-desc" className="text-sm text-muted-foreground">
              Ajuste zoom e posição. O resultado será quadrado ({OUTPUT_SIZE}×{OUTPUT_SIZE}px).
            </p>
          </DialogHeader>

          {cropSrc && (
            <div className="space-y-4">
              <div
                className="relative mx-auto h-64 w-64 overflow-hidden rounded-xl border bg-gray-100"
                onPointerDown={(e) => {
                  setDragging(true);
                  dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
                }}
                onPointerMove={(e) => {
                  if (!dragging) return;
                  setOffset({
                    x: dragStart.current.ox + (e.clientX - dragStart.current.x),
                    y: dragStart.current.oy + (e.clientY - dragStart.current.y),
                  });
                }}
                onPointerUp={() => setDragging(false)}
                onPointerLeave={() => setDragging(false)}
                role="img"
                aria-label="Pré-visualização do recorte quadrado"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cropSrc}
                  alt="Imagem para recorte"
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                    transformOrigin: "center center",
                  }}
                  draggable={false}
                />
                <div className="pointer-events-none absolute inset-0 ring-2 ring-emerald-500 ring-inset" aria-hidden />
              </div>

              <div className="flex items-center gap-3">
                <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  aria-label="Zoom da imagem"
                  className="w-full"
                />
                <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </div>

              <Button type="button" variant="ghost" size="sm" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}>
                <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden />
                Redefinir
              </Button>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setCropOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void applyCrop()} disabled={processing}>
              {processing ? "Processando..." : "Aplicar recorte"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
