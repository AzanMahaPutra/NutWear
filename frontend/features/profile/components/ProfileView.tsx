"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, LogOut, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useAddressStore } from "@/stores/addressStore";
import { useToastStore } from "@/stores/toastStore";
import { Modal } from "@/components/ui/Modal";
import { AddressForm } from "@/features/profile/components/AddressForm";
import { authService } from "@/services/authService";
import { unbanRequestService, UnbanRequest } from "@/services/unbanRequestService";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { ROUTES } from "@/constants/routes";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";

/**
 * View halaman Profile: data diri + daftar alamat pengiriman.
 * Data diambil dari User API & Address API sungguhan (bukan lagi dummy).
 */
export function ProfileView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { addresses, isLoading, fetchAddresses, removeAddress } = useAddressStore();
  const showToast = useToastStore((s) => s.showToast);
  const [addAddressOpen, setAddAddressOpen] = useState(false);

  // UPDATE — Pengajuan Unban: state untuk modal "Ajukan Pembukaan Blokir Akun",
  // hanya relevan/ditampilkan kalau akun sedang berstatus "banned".
  const [unbanModalOpen, setUnbanModalOpen] = useState(false);
  const [unbanReason, setUnbanReason] = useState("");
  const [isSubmittingUnban, setIsSubmittingUnban] = useState(false);
  const [latestUnbanRequest, setLatestUnbanRequest] = useState<UnbanRequest | null>(null);

  useEffect(() => {
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.status !== "banned") return;
    unbanRequestService
      .getMyLatest()
      .then(setLatestUnbanRequest)
      .catch(() => setLatestUnbanRequest(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.status]);

  const hasPendingUnbanRequest = latestUnbanRequest?.status === "menunggu";

  // UPDATE — Notifikasi Banned User: tombol "Ajukan Permohonan Unban" pada
  // detail notifikasi (NotificationDetailModal) mengarahkan ke sini dengan
  // query "?unban=1" supaya form permohonan unban yang sudah ada langsung
  // terbuka, tanpa user perlu mencari tombolnya sendiri di banner atas.
  useEffect(() => {
    if (searchParams.get("unban") !== "1") return;
    if (user?.status !== "banned") return;
    if (hasPendingUnbanRequest) return;
    setUnbanModalOpen(true);
    router.replace(ROUTES.profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user?.status, hasPendingUnbanRequest]);

  async function handleSubmitUnbanRequest() {
    if (!unbanReason.trim()) {
      showToast("Alasan permohonan unban wajib diisi", "error");
      return;
    }
    setIsSubmittingUnban(true);
    try {
      const created = await unbanRequestService.submit(unbanReason.trim());
      setLatestUnbanRequest(created);
      setUnbanModalOpen(false);
      setUnbanReason("");
      showToast("Permohonan unban berhasil dikirim");
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal mengirim permohonan unban"), "error");
    } finally {
      setIsSubmittingUnban(false);
    }
  }

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

      {/* UPDATE — Banned User & Pengajuan Unban: banner ini hanya tampil kalau akun
          sedang berstatus "banned". Selagi dibanned, tombol Checkout/Review/Wishlist/
          Keranjang tetap dikirim ke backend seperti biasa dan akan ditolak dengan pesan
          alasan banned (lihat middlewares/authMiddleware.js -> blockIfBanned). */}
      {user.status === "banned" && (
        <div className="mb-8 rounded-lg border border-red-200 bg-red-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-red-700">Akun Anda sedang dibanned</p>
              {user.bannedReason && (
                <p className="mt-1 text-red-600">
                  Alasan: <span className="font-medium">{user.bannedReason}</span>
                </p>
              )}
              <p className="mt-1 text-red-600">
                Anda masih bisa login dan melihat produk/riwayat pesanan, tetapi tidak dapat checkout, memberi
                ulasan, atau menambah wishlist/keranjang sampai permohonan unban Anda disetujui Admin.
              </p>

              {hasPendingUnbanRequest ? (
                <p className="mt-3 text-xs font-semibold text-red-500">
                  Permohonan unban Anda sedang menunggu diproses Admin.
                </p>
              ) : latestUnbanRequest?.status === "ditolak" ? (
                <div className="mt-3">
                  <p className="mb-2 text-xs font-semibold text-red-500">
                    Permohonan unban sebelumnya ditolak. Anda dapat mengajukan permohonan baru.
                  </p>
                  <button
                    type="button"
                    onClick={() => setUnbanModalOpen(true)}
                    className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    Ajukan Pembukaan Blokir Akun
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setUnbanModalOpen(true)}
                  className="mt-3 rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Ajukan Pembukaan Blokir Akun
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* UPDATE — Pengajuan Unban: form permohonan hanya bisa diakses lewat banner
          di atas, yang hanya tampil untuk akun berstatus "banned" (lihat kondisi
          user.status === "banned" di atas). */}
      <Modal
        open={unbanModalOpen}
        onClose={() => !isSubmittingUnban && setUnbanModalOpen(false)}
        title="Ajukan Pembukaan Blokir Akun"
      >
        <p className="mb-3 text-sm text-neutral-600">
          Jelaskan alasan Anda mengajukan pembukaan blokir akun. Admin akan meninjau permohonan ini.
        </p>
        <label className="mb-1.5 block text-xs font-semibold text-neutral-600">
          Alasan Permohonan Unban <span className="text-red-500">*</span>
        </label>
        <textarea
          value={unbanReason}
          onChange={(e) => setUnbanReason(e.target.value)}
          rows={4}
          placeholder="Contoh: Saya sudah memahami kesalahan saya dan berjanji tidak akan mengulanginya..."
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900"
        />
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setUnbanModalOpen(false)}
            disabled={isSubmittingUnban}
            className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmitUnbanRequest}
            disabled={isSubmittingUnban}
            className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {isSubmittingUnban ? "Mengirim..." : "Kirim Permohonan"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
