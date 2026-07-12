import { Pencil, Trash2 } from "lucide-react";

interface RowActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Tombol aksi baris tabel (Edit/Hapus) reusable di seluruh halaman Admin CRUD.
 */
export function RowActions({ onEdit, onDelete }: RowActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
          aria-label="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-500 hover:bg-red-50"
          aria-label="Hapus"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
