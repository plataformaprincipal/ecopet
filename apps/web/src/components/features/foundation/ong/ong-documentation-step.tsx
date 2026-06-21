"use client";

import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  FileText,
  ImageIcon,
  Trash2,
  Upload,
  Circle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatFileSize,
  getOngDocumentDefinitions,
  ONG_DOCUMENT_ACCEPT,
  ONG_DOCUMENT_MAX_BYTES,
  type DocumentUploadStatus,
  type OngDocumentDefinition,
} from "@/lib/ong/document-types";
import type { OngType } from "@/lib/ong/constants";
import { useOngRegisterCopy } from "@/lib/i18n/use-register-copy";
import { cn } from "@/lib/utils";

export type OngDocumentItem = {
  id: string;
  type: string;
  typeLabel: string;
  file: File;
  status: DocumentUploadStatus;
  errorMessage?: string;
};

type OngDocumentationStepProps = {
  ongType: OngType;
  documents: OngDocumentItem[];
  onChange: (documents: OngDocumentItem[]) => void;
  error?: string;
};

function newId() {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function StatusBadge({ status, label }: { status: DocumentUploadStatus; label: string }) {
  if (status === "uploaded") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
        <Circle className="h-3 w-3 fill-amber-400 text-amber-500" aria-hidden />
        {label}
      </span>
    );
  }
  if (status === "validated") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        {label}
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
        <XCircle className="h-3.5 w-3.5" aria-hidden />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <span className="inline-block h-3 w-3 rounded-sm border border-gray-300 bg-white" aria-hidden />
      {label}
    </span>
  );
}

function DocumentCard({
  definition,
  documents,
  onUpload,
  onRemove,
  requiredBadge,
  attachLabel,
  replaceLabel,
  removeLabel,
  statusLabel,
}: {
  definition: OngDocumentDefinition;
  documents: OngDocumentItem[];
  onUpload: (type: string, label: string, file: File) => void;
  onRemove: (type: string) => void;
  requiredBadge: string;
  attachLabel: string;
  replaceLabel: string;
  removeLabel: string;
  statusLabel: (status: DocumentUploadStatus) => string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = definition.icon;
  const uploaded = documents.find((d) => d.type === definition.id && d.status !== "rejected");
  const status: DocumentUploadStatus = uploaded?.status ?? "pending";

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-4 transition-all",
        definition.required && !uploaded
          ? "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
          : uploaded
            ? "border-emerald-300 bg-emerald-50/40 dark:border-emerald-800"
            : "border-gray-200 bg-white dark:border-white/10 dark:bg-[#0f1419]"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            definition.required ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700"
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{definition.label}</p>
            {definition.required && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                <AlertTriangle className="h-3 w-3" aria-hidden />
                {requiredBadge}
              </span>
            )}
          </div>
          {definition.hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">{definition.hint}</p>
          )}
          <div className="mt-2">
            <StatusBadge status={status} label={statusLabel(status)} />
          </div>
          {uploaded && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {uploaded.file.name} · {formatFileSize(uploaded.file.size)}
            </p>
          )}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={ONG_DOCUMENT_ACCEPT}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(definition.id, definition.label, file);
              e.target.value = "";
            }}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
              <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {uploaded ? replaceLabel : attachLabel}
            </Button>
            {uploaded && (
              <Button type="button" size="sm" variant="ghost" onClick={() => onRemove(definition.id)}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                {removeLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OngDocumentationStep({
  ongType,
  documents,
  onChange,
  error,
}: OngDocumentationStepProps) {
  const { t, tv } = useOngRegisterCopy();
  const docNs = "auth.register.ong.documentation";
  const [globalError, setGlobalError] = useState("");
  const { required, optional } = getOngDocumentDefinitions(ongType);
  const requiredDone = required.filter((d) =>
    documents.some((doc) => doc.type === d.id && doc.status === "uploaded")
  ).length;
  const progressPct = required.length ? Math.round((requiredDone / required.length) * 100) : 0;

  const statusLabel = (status: DocumentUploadStatus) =>
    t(`${docNs}.status.${status}` as "auth.register.ong.documentation.status.pending");

  const addDocument = useCallback(
    (type: string, typeLabel: string, file: File) => {
      if (file.size > ONG_DOCUMENT_MAX_BYTES) {
        setGlobalError(t(`${docNs}.fileTooLarge`, { size: formatFileSize(ONG_DOCUMENT_MAX_BYTES) }));
        return;
      }
      const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png|webp)$/i)) {
        setGlobalError(t(`${docNs}.formatNotAllowed`));
        return;
      }
      setGlobalError("");
      onChange([
        ...documents.filter((d) => d.type !== type),
        { id: newId(), type, typeLabel, file, status: "uploaded" },
      ]);
    },
    [documents, onChange, t, docNs]
  );

  const removeByType = (type: string) => {
    onChange(documents.filter((d) => d.type !== type));
  };

  const displayError = error ? tv(error) || error : globalError;

  return (
    <section className="space-y-6" aria-labelledby="ong-docs-step">
      <div>
        <h2 id="ong-docs-step" className="text-lg font-semibold">
          {t(`${docNs}.title`)}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t(`${docNs}.description`)}</p>
      </div>

      <div aria-label={t(`${docNs}.progressAria`)}>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>
            {t(`${docNs}.progressCount`, {
              done: String(requiredDone),
              total: String(required.length),
            })}
          </span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {displayError && (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          {displayError}
        </p>
      )}

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-900">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          {t(`${docNs}.requiredHeading`)}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {required.map((def) => (
            <DocumentCard
              key={def.id}
              definition={def}
              documents={documents}
              onUpload={addDocument}
              onRemove={removeByType}
              requiredBadge={t(`${docNs}.requiredBadge`)}
              attachLabel={t(`${docNs}.attach`)}
              replaceLabel={t(`${docNs}.replace`)}
              removeLabel={t(`${docNs}.remove`)}
              statusLabel={statusLabel}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">{t(`${docNs}.optionalHeading`)}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {optional.map((def) => (
            <DocumentCard
              key={def.id}
              definition={def}
              documents={documents}
              onUpload={addDocument}
              onRemove={removeByType}
              requiredBadge={t(`${docNs}.requiredBadge`)}
              attachLabel={t(`${docNs}.attach`)}
              replaceLabel={t(`${docNs}.replace`)}
              removeLabel={t(`${docNs}.remove`)}
              statusLabel={statusLabel}
            />
          ))}
        </div>
      </div>

      {documents.length > 0 && (
        <ul className="space-y-2 rounded-xl border bg-gray-50/80 p-3" aria-label={t(`${docNs}.summaryAria`)}>
          {documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center gap-3 text-sm">
              {isPdf(doc.file) ? (
                <FileText className="h-4 w-4 text-red-600" aria-hidden />
              ) : (
                <ImageIcon className="h-4 w-4 text-blue-600" aria-hidden />
              )}
              <span className="min-w-0 flex-1 truncate font-medium">{doc.typeLabel}</span>
              <StatusBadge status={doc.status} label={statusLabel(doc.status)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
