"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { unbanRequestService, UnbanRequest, UnbanRequestStatus } from "@/services/unbanRequestService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { formatDate } from "@/utils/formatDate";
import { cn } from "@/utils/cn";

const STATUS_LABEL: Record<UnbanRequestStatus, string> = {
  menunggu: "Menunggu",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
};

const STATUS_COLOR: Record<UnbanRequestStatus, string> = {
  menunggu: "bg-amber-50 text-amber-700",
  disetujui: "bg-emerald-50 text-emerald-700",
  ditolak: "bg-red-50 text-red-600",
};

/**
 * View Admin — Permohonan Unban. Menampilkan seluruh riwayat pengajuan
 * pembukaan blokir akun dari user yang dibanned, lengkap dengan tombol
 * Setujui/Tolak untuk permohonan yang masih berstatus "Menunggu".
 */
export function UnbanRequestManagementView() {
  const [requests, setRequests] = useState<UnbanRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRequests() {
    setIsLoading(true);
    try {
      const data = await unbanRequestService.getAll();
      setRequests(data);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal memuat permohonan unban"), "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(request: UnbanRequest) {
    setProcessingId(request.id);
    try {
      const updated = await unbanRequestService.approve(request.id);
      setRequests((prev) => prev.map((r) => (r.id === request.id ? updated : r)));
      showToast(`Permohonan ${request.namaUser ?? "user"} disetujui, akun kembali aktif`);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal menyetujui permohonan"), "error");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(request: UnbanRequest) {
    setProcessingId(request.id);
    try {
      const updated = await unbanRequestService.reject(request.id);
      setRequests((prev) => prev.map((r) => (r.id === request.id ? updated : r)));
      showToast(`Permohonan ${request.namaUser ?? "user"} ditolak`);
    } catch (err) {
      showToast(getApiErrorMessage(err, "Gagal menolak permohonan"), "error");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="p-6">
      <DataTable
        rowKey={(r) => r.id}
        data={requests}
        emptyTitle={isLoading ? "Memuat..." : "Belum ada permohonan unban"}
        columns={[
          { key: "nama", header: "Nama User", render: (r) => r.namaUser ?? "-" },
          { key: "email", header: "Email", render: (r) => r.email ?? "-" },
          { key: "tanggal", header: "Tanggal Permohonan", render: (r) => formatDate(r.createdAt) },
          {
            key: "alasanBanned",
            header: "Alasan Banned",
            render: (r) => <span className="line-clamp-2 max-w-xs">{r.bannedReason ?? "-"}</span>,
          },
          {
            key: "alasanUnban",
            header: "Alasan Permohonan Unban",
            render: (r) => <span className="line-clamp-2 max-w-xs">{r.requestReason}</span>,
          },
          {
            key: "status",
            header: "Status Permohonan",
            render: (r) => (
              <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", STATUS_COLOR[r.status])}>
                {STATUS_LABEL[r.status]}
              </span>
            ),
          },
          {
            key: "aksi",
            header: "Aksi",
            render: (r) =>
              r.status !== "menunggu" ? (
                <span className="text-xs text-neutral-400">Sudah diproses</span>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprove(r)}
                    disabled={processingId === r.id}
                    className="flex items-center gap-1.5 rounded-md border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" /> Setujui
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(r)}
                    disabled={processingId === r.id}
                    className="flex items-center gap-1.5 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" /> Tolak
                  </button>
                </div>
              ),
          },
        ]}
      />
    </div>
  );
}
