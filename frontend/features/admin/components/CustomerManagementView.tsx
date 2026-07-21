"use client";

import { useEffect, useState } from "react";
import { Ban } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { Modal } from "@/components/ui/Modal";
import { userService, AdminCustomer } from "@/services/userService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/utils/cn";

// UPDATE — Banned User: badge status akun di tabel Manajemen User.
const STATUS_LABEL: Record<AdminCustomer["status"], string> = {
  aktif: "Aktif",
  banned: "Banned",
};

const STATUS_COLOR: Record<AdminCustomer["status"], string> = {
  aktif: "bg-emerald-50 text-emerald-700",
  banned: "bg-red-50 text-red-600",
};

// Contoh alasan banned yang bisa dipilih cepat oleh Admin (opsional, Admin tetap
// bisa mengetik alasan lain sendiri di textarea).
const REASON_SUGGESTIONS = [
  "Spam Review",
  "Menggunakan kata-kata tidak pantas",
  "Penipuan",
  "Melanggar aturan website",
  "Penyalahgunaan sistem",
];

/**
 * View Manajemen User — data dari User API sungguhan (GET /users, admin only).
 * UPDATE — Banned User: sekarang menampilkan Status Akun, Total Pesanan, Total
 * Review, dan tombol "Banned" (dengan modal alasan wajib) untuk tiap user.
 * Riwayat pengajuan unban ditangani di halaman terpisah "Permohonan Unban"
 * (lihat UnbanRequestManagementView).
 */
export function CustomerManagementView() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [banTarget, setBanTarget] = useState<AdminCustomer | null>(null);
  const [banReason, setBanReason] = useState("");
  const [isSubmittingBan, setIsSubmittingBan] = useState(false);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCustomers() {
    setIsLoading(true);
    try {
      const data = await userService.getAllCustomers();
      setCustomers(data);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal memuat pelanggan"), "error");
    } finally {
      setIsLoading(false);
    }
  }

  function openBanModal(customer: AdminCustomer) {
    setBanTarget(customer);
    setBanReason("");
  }

  function closeBanModal() {
    if (isSubmittingBan) return;
    setBanTarget(null);
    setBanReason("");
  }

  async function handleConfirmBan() {
    if (!banTarget) return;
    if (!banReason.trim()) {
      showToast("Alasan banned wajib diisi", "error");
      return;
    }

    setIsSubmittingBan(true);
    try {
      await userService.banUser(banTarget.id, banReason.trim());
      showToast(`Akun ${banTarget.namaLengkap} berhasil dibanned`);
      setBanTarget(null);
      setBanReason("");
      loadCustomers();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal melakukan banned"), "error");
    } finally {
      setIsSubmittingBan(false);
    }
  }

  return (
    <div className="p-6">
      <DataTable
        rowKey={(c) => c.id}
        data={customers}
        emptyTitle={isLoading ? "Memuat..." : "Belum ada pelanggan"}
        columns={[
          { key: "nama", header: "Nama", render: (c) => c.namaLengkap },
          { key: "email", header: "Email", render: (c) => c.email },
          { key: "bergabung", header: "Tanggal Bergabung", render: (c) => formatDate(c.joinedAt) },
          {
            key: "status",
            header: "Status Akun",
            render: (c) => (
              <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", STATUS_COLOR[c.status])}>
                {STATUS_LABEL[c.status]}
              </span>
            ),
          },
          { key: "pesanan", header: "Total Pesanan", render: (c) => c.orderCount },
          { key: "review", header: "Total Review", render: (c) => c.reviewCount },
          {
            key: "aksi",
            header: "Aksi",
            render: (c) =>
              c.status === "banned" ? (
                <span className="text-xs text-neutral-400">Sudah dibanned</span>
              ) : (
                <button
                  type="button"
                  onClick={() => openBanModal(c)}
                  className="flex items-center gap-1.5 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  <Ban className="h-3.5 w-3.5" /> Banned
                </button>
              ),
          },
        ]}
      />

      <Modal open={!!banTarget} onClose={closeBanModal} title="Banned User">
        <p className="mb-4 text-sm text-neutral-600">
          Anda akan melakukan banned terhadap akun <span className="font-semibold">{banTarget?.namaLengkap}</span>{" "}
          ({banTarget?.email}). Akun tetap bisa login, tetapi tidak dapat checkout, memberi ulasan, atau menambah
          wishlist/keranjang sampai permohonan unban-nya disetujui.
        </p>

        <label className="mb-1.5 block text-xs font-semibold text-neutral-600">
          Alasan Banned <span className="text-red-500">*</span>
        </label>
        <textarea
          value={banReason}
          onChange={(e) => setBanReason(e.target.value)}
          rows={4}
          placeholder="Contoh: Spam Review, Menggunakan kata-kata tidak pantas, Penipuan, dll."
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900"
        />

        <div className="mt-2 flex flex-wrap gap-1.5">
          {REASON_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setBanReason(suggestion)}
              className="rounded-full border border-neutral-200 px-2.5 py-1 text-xs text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={closeBanModal}
            disabled={isSubmittingBan}
            className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirmBan}
            disabled={isSubmittingBan}
            className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmittingBan ? "Memproses..." : "Konfirmasi"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
