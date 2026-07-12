import { ReactNode } from "react";
import { EmptyState } from "@/components/shared/EmptyState";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyTitle?: string;
}

/**
 * Tabel data generic reusable — dipakai di seluruh halaman Admin CRUD
 * (Produk, Kategori, Banner, Pesanan, Pelanggan, Review) supaya tidak
 * menulis ulang markup <table> di tiap halaman.
 */
export function DataTable<T>({ columns, data, rowKey, emptyTitle = "Belum ada data" }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-100 bg-white">
        <EmptyState title={emptyTitle} />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-100 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-500">
            {columns.map((col) => (
              <th key={col.key} className={`px-5 py-3 font-medium ${col.className ?? ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={rowKey(row)} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50">
              {columns.map((col) => (
                <td key={col.key} className={`px-5 py-3.5 text-neutral-700 ${col.className ?? ""}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
