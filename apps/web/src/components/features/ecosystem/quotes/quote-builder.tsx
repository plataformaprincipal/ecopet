"use client";

import { useState } from "react";
import { Plus, Trash2, Send, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CustomQuote } from "@/lib/ecosystem/types";

interface QuoteBuilderProps {
  partnerId: string;
  partnerName: string;
  clientId?: string;
  clientName?: string;
  onSend?: (quote: Omit<CustomQuote, "id" | "issuedAt" | "status" | "version">) => void;
  onSaveDraft?: (quote: Partial<CustomQuote>) => void;
}

export function QuoteBuilder({ partnerId, partnerName, clientId = "client1", clientName = "Cliente", onSend, onSaveDraft }: QuoteBuilderProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [executionDeadline, setExecutionDeadline] = useState("");
  const [included, setIncluded] = useState<string[]>([""]);
  const [excluded, setExcluded] = useState<string[]>([""]);
  const [conditions, setConditions] = useState("");
  const [notes, setNotes] = useState("");

  function updateList(list: string[], setList: (v: string[]) => void, idx: number, val: string) {
    const next = [...list];
    next[idx] = val;
    setList(next);
  }

  function addRow(list: string[], setList: (v: string[]) => void) {
    setList([...list, ""]);
  }

  function removeRow(list: string[], setList: (v: string[]) => void, idx: number) {
    setList(list.filter((_, i) => i !== idx));
  }

  function buildPayload() {
    return {
      name,
      description,
      value: parseFloat(value) || 0,
      validUntil,
      executionDeadline,
      partnerId,
      partnerName,
      partnerAvatar: "",
      clientId,
      clientName,
      includedItems: included.filter(Boolean),
      excludedItems: excluded.filter(Boolean),
      conditions,
      notes: notes || undefined,
    };
  }

  return (
    <div className="card-premium space-y-5 rounded-[16px] border border-ecopet-gray/10 p-4 lg:p-6">
      <div>
        <h3 className="font-display text-lg font-bold">Gerar Orçamento Personalizado</h3>
        <p className="text-sm text-ecopet-gray">Para {clientName} · Parceiro: {partnerName}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="q-name" className="text-sm font-medium">Nome do orçamento</label>
          <Input id="q-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Pacote banho & tosa mensal" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="q-desc" className="text-sm font-medium">Descrição detalhada</label>
          <textarea id="q-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-ecopet-gray/20 bg-transparent px-3 py-2 text-sm" />
        </div>
        <div className="space-y-2">
          <label htmlFor="q-value" className="text-sm font-medium">Valor (R$)</label>
          <Input id="q-value" type="number" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label htmlFor="q-valid" className="text-sm font-medium">Validade do orçamento</label>
          <Input id="q-valid" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label htmlFor="q-exec" className="text-sm font-medium">Prazo de execução</label>
          <Input id="q-exec" type="date" value={executionDeadline} onChange={(e) => setExecutionDeadline(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Itens incluídos</label>
          {included.map((item, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <Input value={item} onChange={(e) => updateList(included, setIncluded, i, e.target.value)} placeholder="Item incluído" />
              <Button size="icon" variant="ghost" onClick={() => removeRow(included, setIncluded, i)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => addRow(included, setIncluded)}><Plus className="h-4 w-4" /> Adicionar</Button>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Itens não incluídos</label>
          {excluded.map((item, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <Input value={item} onChange={(e) => updateList(excluded, setExcluded, i, e.target.value)} placeholder="Item excluído" />
              <Button size="icon" variant="ghost" onClick={() => removeRow(excluded, setExcluded, i)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => addRow(excluded, setExcluded)}><Plus className="h-4 w-4" /> Adicionar</Button>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="q-cond" className="text-sm font-medium">Condições</label>
        <textarea id="q-cond" value={conditions} onChange={(e) => setConditions(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-ecopet-gray/20 bg-transparent px-3 py-2 text-sm" />
      </div>
      <div className="space-y-2">
        <label htmlFor="q-notes" className="text-sm font-medium">Observações</label>
        <textarea id="q-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-ecopet-gray/20 bg-transparent px-3 py-2 text-sm" />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-ecopet-gray/10 pt-4">
        <Button onClick={() => onSend?.(buildPayload())}><Send className="h-4 w-4" /> Enviar orçamento</Button>
        <Button variant="outline" onClick={() => onSaveDraft?.(buildPayload())}><Save className="h-4 w-4" /> Salvar rascunho</Button>
      </div>
    </div>
  );
}
