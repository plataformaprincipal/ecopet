"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  onFilter: (params: Record<string, string>) => void;
  showSearch?: boolean;
  showStatus?: boolean;
};

export function FilterBar({ onFilter, showSearch = true, showStatus = true }: Props) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border bg-white p-3 dark:bg-white/5">
      {showSearch && (
        <div className="min-w-[180px] flex-1">
          <label className="text-xs text-muted-foreground">Busca</label>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome ou e-mail" />
        </div>
      )}
      {showStatus && (
        <div>
          <label className="text-xs text-muted-foreground">Status</label>
          <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Status" className="w-32" />
        </div>
      )}
      <div>
        <label className="text-xs text-muted-foreground">De</label>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Até</label>
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
      </div>
      <Button
        type="button"
        onClick={() =>
          onFilter({
            ...(q ? { q } : {}),
            ...(status ? { status } : {}),
            ...(dateFrom ? { dateFrom } : {}),
            ...(dateTo ? { dateTo } : {}),
            page: "1",
          })
        }
      >
        Filtrar
      </Button>
    </div>
  );
}
