"use client";

import { useEffect, useState } from "react";
import { Plus, ImageOff } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { RowActions } from "@/components/shared/RowActions";
import { Modal } from "@/components/ui/Modal";
import { CategoryForm } from "@/features/admin/components/CategoryForm";
import { useAdminCategoryStore } from "@/stores/adminCategoryStore";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { Category } from "@/types/product";

export function CategoryManagementView() {
  const categories = useAdminCategoryStore((s) => s.categories);
  const isLoading = useAdminCategoryStore((s) => s.isLoading);
  const fetchCategories = useAdminCategoryStore((s) => s.fetchCategories);
  const deleteCategory = useAdminCategoryStore((s) => s.deleteCategory);
  const showToast = useToastStore((s) => s.showToast);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>(undefined);

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    try {
      await deleteCategory(id);
      showToast("Kategori dihapus");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
          className="flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Tambah Kategori
        </button>
      </div>

      <DataTable
        rowKey={(c) => c.id}
        data={categories}
        emptyTitle={isLoading ? "Memuat..." : "Belum ada kategori"}
        columns={[
          {
            key: "gambar",
            header: "Gambar",
            render: (c) => (
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-neutral-100">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt={c.namaKategori} className="h-full w-full object-cover" />
                ) : (
                  <ImageOff className="h-5 w-5 text-neutral-300" />
                )}
              </div>
            ),
          },
          { key: "nama", header: "Nama Kategori", render: (c) => c.namaKategori },
          {
            key: "aksi",
            header: "Aksi",
            render: (c) => (
              <RowActions
                onEdit={() => {
                  setEditing(c);
                  setFormOpen(true);
                }}
                onDelete={() => handleDelete(c.id)}
              />
            ),
          },
        ]}
      />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Kategori" : "Tambah Kategori"}>
        <CategoryForm initialData={editing} onSuccess={() => setFormOpen(false)} />
      </Modal>
    </div>
  );
}
