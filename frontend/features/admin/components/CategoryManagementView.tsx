"use client";

import { useEffect, useState } from "react";
import { Plus, ImageOff, GripVertical } from "lucide-react";
import { RowActions } from "@/components/shared/RowActions";
import { EmptyState } from "@/components/shared/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { CategoryForm } from "@/features/admin/components/CategoryForm";
import { useAdminCategoryStore } from "@/stores/adminCategoryStore";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { Category } from "@/types/product";
import { cn } from "@/utils/cn";

/**
 * UPDATE — Pengaturan Urutan Kategori (Drag & Drop).
 *
 * Halaman Category Admin sebelumnya memakai komponen <DataTable> generic yang
 * dipakai bersama di seluruh halaman Admin CRUD lain (Produk, Banner, Pesanan,
 * dst). <DataTable> tidak mendukung baris yang bisa di-drag, dan supaya
 * perubahan ini tidak berdampak ke halaman Admin lain, tabel kategori di sini
 * ditulis ulang sebagai tabel kustom (hanya dipakai di halaman ini) dengan
 * kolom tambahan "handle" drag di paling kiri.
 *
 * Mekanismenya: HTML5 native drag & drop (draggable + onDragStart/onDragOver/
 * onDrop), sama seperti konsep pengaturan urutan Banner yang sudah ada di
 * project (tetap simpan sort_order per baris, lihat stores/adminBannerStore.ts
 * -> moveBanner), hanya di sini urutan bisa dipindah bebas ke posisi mana pun
 * (bukan cuma naik/turun satu posisi) karena pakai drag & drop sungguhan.
 * Urutan baru langsung disimpan ke database lewat reorderCategories (lihat
 * stores/adminCategoryStore.ts), yang memanggil endpoint PATCH /categories/reorder.
 */
export function CategoryManagementView() {
  const categories = useAdminCategoryStore((s) => s.categories);
  const isLoading = useAdminCategoryStore((s) => s.isLoading);
  const fetchCategories = useAdminCategoryStore((s) => s.fetchCategories);
  const deleteCategory = useAdminCategoryStore((s) => s.deleteCategory);
  const reorderCategories = useAdminCategoryStore((s) => s.reorderCategories);
  const showToast = useToastStore((s) => s.showToast);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>(undefined);

  // Salinan lokal urutan kategori supaya baris bisa langsung "geser" secara
  // visual selagi di-drag, sebelum akhirnya disimpan ke database saat di-drop.
  const [items, setItems] = useState<Category[]>(categories);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setItems(categories);
  }, [categories]);

  async function handleDelete(id: string) {
    try {
      await deleteCategory(id);
      showToast("Kategori dihapus");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  function handleDragStart(id: string) {
    setDragId(id);
  }

  function handleDragOver(e: React.DragEvent<HTMLTableRowElement>, overId: string) {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    setDragOverId(overId);

    setItems((prev) => {
      const fromIndex = prev.findIndex((c) => c.id === dragId);
      const toIndex = prev.findIndex((c) => c.id === overId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  async function handleDrop() {
    const draggedId = dragId;
    setDragId(null);
    setDragOverId(null);
    if (!draggedId) return;

    setIsSaving(true);
    try {
      await reorderCategories(items.map((c) => c.id));
      showToast("Urutan kategori disimpan");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setIsSaving(false);
    }
  }

  function handleDragEnd() {
    setDragId(null);
    setDragOverId(null);
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-neutral-500">Tahan ikon di kiri, lalu geser untuk mengatur urutan kategori.</p>
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

      {items.length === 0 ? (
        <div className="rounded-xl border border-neutral-100 bg-white">
          <EmptyState title={isLoading ? "Memuat..." : "Belum ada kategori"} />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 text-neutral-500">
                <th className="w-10 px-5 py-3 font-medium" aria-hidden="true" />
                <th className="px-5 py-3 font-medium">Gambar</th>
                <th className="px-5 py-3 font-medium">Nama Kategori</th>
                <th className="px-5 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((category) => (
                <tr
                  key={category.id}
                  draggable
                  onDragStart={() => handleDragStart(category.id)}
                  onDragOver={(e) => handleDragOver(e, category.id)}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "border-b border-neutral-50 last:border-0 hover:bg-neutral-50",
                    dragId === category.id && "opacity-50",
                    dragOverId === category.id && dragId !== category.id && "bg-neutral-100"
                  )}
                >
                  <td className="cursor-grab px-5 py-3.5 text-neutral-300 active:cursor-grabbing">
                    <GripVertical className="h-4 w-4" />
                  </td>
                  <td className="px-5 py-3.5 text-neutral-700">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-neutral-100">
                      {category.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={category.imageUrl} alt={category.namaKategori} className="h-full w-full object-cover" />
                      ) : (
                        <ImageOff className="h-5 w-5 text-neutral-300" />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-700">{category.namaKategori}</td>
                  <td className="px-5 py-3.5 text-neutral-700">
                    <RowActions
                      onEdit={() => {
                        setEditing(category);
                        setFormOpen(true);
                      }}
                      onDelete={() => handleDelete(category.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {isSaving && <p className="px-5 py-2 text-xs text-neutral-400">Menyimpan urutan...</p>}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Kategori" : "Tambah Kategori"}>
        <CategoryForm initialData={editing} onSuccess={() => setFormOpen(false)} />
      </Modal>
    </div>
  );
}

