"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2 } from "lucide-react";
import { FormInput } from "@/components/ui/FormInput";
import { Category } from "@/types/product";
import { useAdminCategoryStore } from "@/stores/adminCategoryStore";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";

const categorySchema = z.object({
  namaKategori: z.string().min(2, "Nama kategori minimal 2 karakter"),
});
type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  initialData?: Category;
  onSuccess: () => void;
}

export function CategoryForm({ initialData, onSuccess }: CategoryFormProps) {
  const addCategory = useAdminCategoryStore((s) => s.addCategory);
  const updateCategory = useAdminCategoryStore((s) => s.updateCategory);
  const showToast = useToastStore((s) => s.showToast);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData ? { namaKategori: initialData.namaKategori } : undefined,
  });

  const previewUrl = imageFile
    ? URL.createObjectURL(imageFile)
    : removeImage
      ? null
      : (initialData?.imageUrl ?? null);

  function handlePickImage(file: File | null) {
    setImageFile(file);
    if (file) setRemoveImage(false);
  }

  function handleRemoveImage() {
    setImageFile(null);
    setRemoveImage(true);
  }

  async function onSubmit(values: CategoryFormValues) {
    try {
      if (initialData) {
        await updateCategory(initialData.id, values.namaKategori, imageFile, removeImage);
        showToast("Kategori berhasil diperbarui");
      } else {
        await addCategory(values.namaKategori, imageFile);
        showToast("Kategori berhasil ditambahkan");
      }
      onSuccess();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormInput
        label="Nama Kategori"
        placeholder="Nama kategori"
        {...register("namaKategori")}
        error={errors.namaKategori?.message}
      />

      <div>
        <label className="mb-1 block text-sm font-semibold text-neutral-800">Gambar Kategori</label>

        {previewUrl && (
          <div className="mb-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview gambar kategori"
              className="h-24 w-24 rounded-lg border border-neutral-200 object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:underline"
            >
              <Trash2 className="h-4 w-4" /> Hapus gambar
            </button>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => handlePickImage(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-neutral-500"
        />
        <p className="mt-1 text-xs text-neutral-400">
          {previewUrl ? "Pilih file baru untuk mengganti gambar." : "Opsional — tampil di halaman beranda & kategori."}
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? "Menyimpan..." : initialData ? "Simpan Perubahan" : "Tambah Kategori"}
      </button>
    </form>
  );
}
