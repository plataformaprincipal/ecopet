"use client";

type Props = {
  rows: Record<string, unknown>[];
  emptyLabel?: string;
};

export function DataTable({ rows, emptyLabel = "Nenhum registro encontrado." }: Props) {
  if (!rows.length) {
    return <p className="rounded-xl border bg-white p-6 text-sm text-muted-foreground dark:bg-white/5">{emptyLabel}</p>;
  }
  const columns = Object.keys(rows[0]).filter((k) => !k.startsWith("_"));
  return (
    <div className="overflow-x-auto rounded-xl border bg-white dark:bg-white/5">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 font-medium">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              {columns.map((col) => (
                <td key={col} className="max-w-[240px] truncate px-3 py-2">
                  {formatCell(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
