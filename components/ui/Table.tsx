"use client";

import { cn } from "@/lib/utils/cn";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  width?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  rowTestId,
  empty = "Sin registros.",
  testId,
  dense,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowTestId?: (row: T) => string;
  empty?: React.ReactNode;
  testId?: string;
  dense?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-ink-200 bg-white">
      <table className="w-full border-collapse text-sm" data-testid={testId}>
        <thead>
          <tr className="border-b border-ink-200 bg-ink-50/80 text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ width: c.width }}
                className={cn(
                  "px-3 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500",
                  c.align === "right" && "text-right",
                  c.align === "center" && "text-center",
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-sm text-ink-400">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const id = getRowId(row);
              return (
                <tr
                  key={id}
                  data-testid={rowTestId ? rowTestId(row) : `row-${id}`}
                  data-row-id={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-b border-ink-100 last:border-0",
                    onRowClick && "cursor-pointer hover:bg-clinical-50/50",
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        dense ? "px-3 py-1.5" : "px-3 py-2.5",
                        "text-ink-700 align-middle",
                        c.align === "right" && "text-right",
                        c.align === "center" && "text-center",
                        c.className,
                      )}
                    >
                      {c.render ? c.render(row) : (row as any)[c.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
