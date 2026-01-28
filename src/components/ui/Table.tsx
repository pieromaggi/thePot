import type { ReactNode } from "react";

type TableRow = {
  key: string;
  cells: ReactNode[];
};

type TableProps = {
  headers: string[];
  rows: TableRow[];
};

export default function Table({ headers, rows }: TableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 text-left font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((row) => (
            <tr key={row.key} className="hover:bg-gray-50">
              {row.cells.map((cell, index) => (
                <td key={`${row.key}-${index}`} className="px-4 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
