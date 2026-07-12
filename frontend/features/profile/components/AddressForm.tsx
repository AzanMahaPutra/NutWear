"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormInput } from "@/components/ui/FormInput";
import { useAddressStore } from "@/stores/addressStore";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";

const addressSchema = z.object({
  receiverName: z.string().min(3, "Nama penerima minimal 3 karakter"),
  phone: z.string().min(9, "Nomor telepon tidak valid"),
  province: z.string().min(2, "Provinsi wajib diisi"),
  city: z.string().min(2, "Kota wajib diisi"),
  district: z.string().min(2, "Kecamatan wajib diisi"),
  postalCode: z.string().min(5, "Kode pos tidak valid").max(6, "Kode pos tidak valid"),
  address: z.string().min(10, "Alamat lengkap minimal 10 karakter"),
});
type AddressFormValues = z.infer<typeof addressSchema>;

/**
 * Form tambah alamat pengiriman. Mendukung banyak alamat per user sesuai dokumen perencanaan.
 */
export function AddressForm({ onSuccess }: { onSuccess: () => void }) {
  const addAddress = useAddressStore((s) => s.addAddress);
  const showToast = useToastStore((s) => s.showToast);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({ resolver: zodResolver(addressSchema) });

  async function onSubmit(values: AddressFormValues) {
    try {
      await addAddress(values);
      showToast("Alamat berhasil ditambahkan");
      onSuccess();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <FormInput label="Nama" placeholder="Nama penerima" {...register("receiverName")} error={errors.receiverName?.message} />
      <FormInput label="Telepon" placeholder="08xxxxxxxxxx" {...register("phone")} error={errors.phone?.message} />
      <FormInput label="Provinsi" placeholder="Jawa Barat" {...register("province")} error={errors.province?.message} />
      <FormInput label="Kota" placeholder="Bandung" {...register("city")} error={errors.city?.message} />
      <FormInput label="Kecamatan" placeholder="Coblong" {...register("district")} error={errors.district?.message} />
      <FormInput label="Kode Pos" placeholder="40132" {...register("postalCode")} error={errors.postalCode?.message} />
      <FormInput label="Alamat" placeholder="Jalan, nomor rumah, RT/RW" {...register("address")} error={errors.address?.message} />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? "Menyimpan..." : "Simpan Alamat"}
      </button>
    </form>
  );
}
