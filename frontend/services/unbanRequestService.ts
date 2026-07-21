import { apiClient } from "@/lib/apiClient";
import { ApiResponse } from "@/lib/apiTypes";

// UPDATE — Pengajuan Unban: status permohonan ("menunggu" | "disetujui" | "ditolak").
export type UnbanRequestStatus = "menunggu" | "disetujui" | "ditolak";

export interface UnbanRequest {
  id: string;
  userId: string;
  namaUser: string | null;
  email: string | null;
  bannedReason: string | null;
  requestReason: string;
  status: UnbanRequestStatus;
  createdAt: string;
  processedAt: string | null;
}

/**
 * Service Pengajuan Unban — dipakai user yang dibanned (ProfileView) untuk
 * mengajukan permohonan, dan Admin (halaman "Permohonan Unban") untuk
 * menyetujui/menolak.
 */
export const unbanRequestService = {
  // --- Customer ---
  async submit(requestReason: string) {
    const { data } = await apiClient.post<ApiResponse<UnbanRequest>>("/unban-requests", { requestReason });
    return data.data;
  },

  /** Permohonan terbaru milik user yang sedang login (atau null kalau belum pernah mengajukan). */
  async getMyLatest() {
    const { data } = await apiClient.get<ApiResponse<UnbanRequest | null>>("/unban-requests/my/latest");
    return data.data;
  },

  // --- Admin ---
  async getAll() {
    const { data } = await apiClient.get<ApiResponse<UnbanRequest[]>>("/unban-requests");
    return data.data;
  },

  async approve(id: string) {
    const { data } = await apiClient.patch<ApiResponse<UnbanRequest>>(`/unban-requests/${id}/approve`);
    return data.data;
  },

  async reject(id: string) {
    const { data } = await apiClient.patch<ApiResponse<UnbanRequest>>(`/unban-requests/${id}/reject`);
    return data.data;
  },
};
