"use client";

import { Button } from "@/components/ui/button";
import { exportReportPdf, exportRowsCsv, exportRowsExcel, kpiAndItemsForExport } from "@/lib/admin/erp/export-client";
import type { ErpModuleResponse } from "@/lib/admin/erp/types";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

type Props = {
  moduleId: string;
  title: string;
  data: ErpModuleResponse;
};

export function ErpExportBar({ moduleId, title, data }: Props) {
  const { kpis, items } = kpiAndItemsForExport(data);
  const filename = `ecopet_${moduleId}_${new Date().toISOString().slice(0, 10)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" onClick={() => exportRowsCsv(filename, items)} disabled={!items.length}>
        <Download className="mr-1 h-4 w-4" />
        CSV
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => exportRowsExcel(filename, items)} disabled={!items.length}>
        <FileSpreadsheet className="mr-1 h-4 w-4" />
        Excel
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => exportReportPdf(title, kpis, items)}>
        <FileText className="mr-1 h-4 w-4" />
        PDF
      </Button>
    </div>
  );
}
