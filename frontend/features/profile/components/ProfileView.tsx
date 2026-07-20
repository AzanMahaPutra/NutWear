"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useAddressStore } from "@/stores/addressStore";
import { useToastStore } from "@/stores/toastStore";
import { Modal } from "@/components/ui/Modal";
import { AddressForm } from "@/features/profile/components/AddressForm";
import { authService } from "@/services/authService";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { ROUTES } from "@/constants/routes";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";

/**
 * View halaman Profile: data diri + daftar alamat pengiriman.
 * Data diambil dari User API & Address API sungguhan (bukan lagi dummy).
 */
export function ProfileView() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { addresses, isLoading, fetchAddresses, removeAddress } = useAddressStore();
  const showToast = useToastStore((s) => s.showToast);
  const [addAddressOpen, setAddAddressOpen] = useState(false);

  useEffect(() => {
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    try {
      await authService.logout();
      showToast("Anda telah keluar");
    } catch (err) {
      // Tetap anggap logout berhasil di sisi client walaupun request ke server
      // gagal (mis. koneksi terputus) — access token in-memory & cookie refresh
      // sudah/akan dibersihkan (lihat authService.logout), jadi sesi lama tidak
      // boleh tetap "nyangkut" hanya karena network error di request ini.
      showToast(getApiErrorMessage(err), "error");
    } finally {
      // INI YANG SEBELUMNYA HILANG: state user di authStore tidak pernah
      // dikosongkan saat logout, jadi isAuthenticated tetap true (Navbar & AuthGuard
      // masih menganggap user login) walaupun token/cookie sudah dihapus. Sekarang
      // dikosongkan tanpa syarat supaya logout benar-benar mengakhiri sesi di client.
      setUser(null);
      router.push(ROUTES.login);
    }
  }

  async function handleRemoveAddress(id: string) {
    try {
      await removeAddress(id);
      showToast("Alamat berhasil dihapus");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  if (!user) {
    return (
      <div className="space-y-3">
        <ProductCardSkeleton />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">{user.namaLengkap}</h1>
        <button type="button" className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium">
          Edit
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3.5">
        <span className="text-sm font-semibold text-neutral-800">Email</span>
        <span className="text-sm text-neutral-600">{user.email}</span>
      </div>
      <div className="mb-8 flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3.5">
        <span className="text-sm font-semibold text-neutral-800">Nomor Telepon</span>
        <span className="text-sm text-neutral-600">{user.noHp}</span>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900">Alamat</h2>
        <button
          type="button"
          onClick={() => setAddAddressOpen(true)}
          className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium"
        >
          + Tambah
        </button>
      </div>

      {isLoading ? (
        <p className="mb-8 text-sm text-neutral-400">Memuat alamat...</p>
      ) : addresses.length === 0 ? (
        <div className="mb-8 flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3.5 text-neutral-400">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">Belum ada alamat yang di tambahkan</span>
        </div>
      ) : (
        <div className="mb-8 space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="flex items-start gap-3 rounded-lg border border-neutral-200 px-4 py-3.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-neutral-800">
                  {addr.receiverName} {addr.isDefault && <span className="text-xs text-green-600">(Utama)</span>}
                </p>
                <p className="text-neutral-500">
                  {addr.address}, {addr.district}, {addr.city}, {addr.province} {addr.postalCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveAddress(addr.id)}
                className="text-xs font-medium text-red-500 underline"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-2 rounded-full border border-red-500 px-5 py-2.5 text-sm font-semibold text-red-500"
      >
        <LogOut className="h-4 w-4" /> Keluar
      </button>

      <Modal open={addAddressOpen} onClose={() => setAddAddressOpen(false)} title="Tambah Alamat">
        <AddressForm onSuccess={() => setAddAddressOpen(false)} />
      </Modal>
    </div>
  );
}
