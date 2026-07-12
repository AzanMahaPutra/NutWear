"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { ProductFeature } from "@/types/product";
import { productService } from "@/services/productService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";

interface ProductFeatureManagerProps {
  productId: string;
  initialFeatures: ProductFeature[];
}

interface EditableFields {
  deskripsi: string;
  file: File | null;
  previewUrl: string | null;
}

/**
 * Manajemen Fitur Produk dengan Gambar (UPDATE 4, layout & form direvisi UPDATE 6)
 * — dalam form produk Admin.
 *
 * Setiap fitur = satu baris di tabel `product_features` (gambar, deskripsi,
 * urutan). Admin bisa menambah (+ Tambah Fitur), mengedit, menghapus, dan
 * mengubah urutan lewat tombol naik/turun (project belum mendukung drag &
 * drop, jadi dipakai tombol sesuai instruksi).
 *
 * UPDATE 6 — Field Judul Fitur dihapus dari form karena tidak lagi
 * ditampilkan di frontend. Admin sekarang hanya mengisi Upload Gambar dan
 * Deskripsi untuk setiap fitur.
 *
 * Naik/turun bekerja dengan menukar nilai sortOrder dua fitur yang
 * bersebelahan lewat dua panggilan PUT /products/features/:featureId.
 */
export function ProductFeatureManager({ productId, initialFeatures }: ProductFeatureManagerProps) {
  const [features, setFeatures] = useState(
    [...initialFeatures].sort((a, b) => a.sortOrder - b.sortOrder)
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditableFields | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const [newDeskripsi, setNewDeskripsi] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreviewUrl, setNewPreviewUrl] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const showToast = useToastStore((s) => s.showToast);

  function handleNewFileChange(file: File | null) {
    setNewFile(file);
    setNewPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function handleAddFeature() {
    if (!newFile) {
      showToast("Gambar fitur wajib diupload", "error");
      return;
    }
    if (!newDeskripsi.trim()) {
      showToast("Deskripsi fitur wajib diisi", "error");
      return;
    }
    setIsAdding(true);
    try {
      const feature = await productService.addFeature(productId, {
        file: newFile,
        deskripsi: newDeskripsi.trim(),
        sortOrder: features.length,
      });
      setFeatures((prev) => [...prev, feature]);
      setNewDeskripsi("");
      handleNewFileChange(null);
      showToast("Fitur produk berhasil ditambahkan");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setIsAdding(false);
    }
  }

  function startEdit(feature: ProductFeature) {
    setEditingId(feature.id);
    setEditValues({ deskripsi: feature.deskripsi, file: null, previewUrl: null });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues(null);
  }

  async function handleSaveEdit(featureId: string) {
    if (!editValues) return;
    if (!editValues.deskripsi.trim()) {
      showToast("Deskripsi fitur wajib diisi", "error");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await productService.updateFeature(featureId, {
        deskripsi: editValues.deskripsi.trim(),
        file: editValues.file ?? undefined,
      });
      setFeatures((prev) => prev.map((f) => (f.id === featureId ? updated : f)));
      showToast("Fitur produk berhasil diperbarui");
      cancelEdit();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteFeature(featureId: string) {
    setIsDeleting(featureId);
    try {
      await productService.removeFeature(featureId);
      setFeatures((prev) => prev.filter((f) => f.id !== featureId));
      showToast("Fitur produk berhasil dihapus");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setIsDeleting(null);
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= features.length) return;

    setIsReordering(true);
    const current = features[index];
    const target = features[targetIndex];
    try {
      const [updatedCurrent, updatedTarget] = await Promise.all([
        productService.updateFeature(current.id, { sortOrder: target.sortOrder }),
        productService.updateFeature(target.id, { sortOrder: current.sortOrder }),
      ]);
      setFeatures((prev) => {
        const next = [...prev];
        next[index] = updatedTarget;
        next[targetIndex] = updatedCurrent;
        return next.sort((a, b) => a.sortOrder - b.sortOrder);
      });
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setIsReordering(false);
    }
  }

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-neutral-800">Fitur Produk (Gambar, Deskripsi)</h4>

      {features.length > 0 && (
        <div className="mb-3 space-y-2">
          {features.map((feature, index) => {
            const isEditing = editingId === feature.id;
            return (
              <div key={feature.id} className="rounded-md bg-neutral-50 p-2.5 text-xs">
                {isEditing && editValues ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={editValues.previewUrl ?? feature.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            setEditValues({
                              ...editValues,
                              file,
                              previewUrl: file ? URL.createObjectURL(file) : null,
                            });
                          }}
                          className="w-full text-[11px] text-neutral-500"
                        />
                        <textarea
                          value={editValues.deskripsi}
                          onChange={(e) => setEditValues({ ...editValues, deskripsi: e.target.value })}
                          placeholder="Deskripsi fitur"
                          rows={2}
                          className="w-full rounded-md border border-neutral-200 px-2 py-1.5 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex items-center gap-1 rounded-md border border-neutral-300 px-2 py-1 font-semibold text-neutral-600"
                      >
                        <X className="h-3 w-3" /> Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(feature.id)}
                        disabled={isSaving}
                        className="flex items-center gap-1 rounded-md bg-neutral-900 px-2 py-1 font-semibold text-white disabled:opacity-60"
                      >
                        <Check className="h-3 w-3" /> Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={feature.imageUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-neutral-700">{feature.deskripsi}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleMove(index, "up")}
                          disabled={index === 0 || isReordering}
                          aria-label="Naikkan urutan"
                          className="rounded-md border border-neutral-200 p-1 text-neutral-600 hover:bg-white disabled:opacity-30"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, "down")}
                          disabled={index === features.length - 1 || isReordering}
                          aria-label="Turunkan urutan"
                          className="rounded-md border border-neutral-200 p-1 text-neutral-600 hover:bg-white disabled:opacity-30"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(feature)}
                          aria-label="Edit fitur"
                          className="rounded-md border border-neutral-200 p-1 text-neutral-600 hover:bg-white"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeature(feature.id)}
                          disabled={isDeleting === feature.id}
                          aria-label="Hapus fitur"
                          className="rounded-md border border-red-200 p-1 text-red-500 hover:bg-white disabled:opacity-60"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 p-3">
        <h5 className="mb-2 text-xs font-bold text-neutral-900">Tambah Fitur Baru</h5>
        <div className="flex gap-2">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
            {newPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={newPreviewUrl} alt="Preview fitur baru" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                Preview
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1.5">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleNewFileChange(e.target.files?.[0] ?? null)}
              className="w-full text-[11px] text-neutral-500"
            />
            <textarea
              value={newDeskripsi}
              onChange={(e) => setNewDeskripsi(e.target.value)}
              placeholder="Deskripsi fitur"
              rows={2}
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-xs outline-none"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddFeature}
          disabled={isAdding}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-md bg-neutral-900 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" />
          {isAdding ? "Menambahkan..." : "+ Tambah Fitur"}
        </button>
      </div>
    </div>
  );
}
