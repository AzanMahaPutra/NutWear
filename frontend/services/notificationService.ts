import { apiClient } from "@/lib/apiClient";
import { ApiResponse } from "@/lib/apiTypes";
import { AppNotification } from "@/types/user";

interface NotificationListMeta {
  page: number;
  pageSize: number;
  total: number;
  unreadCount: number;
}

/**
 * Service Notifikasi User — dipakai NotificationBell di Navbar. Bentuk response
 * backend sudah camelCase (lihat notificationService.js toResponse).
 */
export const notificationService = {
  async getAll(params: { page?: number; pageSize?: number } = {}) {
    const { data } = await apiClient.get<ApiResponse<AppNotification[]> & { meta: NotificationListMeta }>(
      "/notifications",
      { params }
    );
    return { items: data.data, meta: data.meta };
  },

  async getUnreadCount() {
    const { data } = await apiClient.get<ApiResponse<{ unreadCount: number }>>("/notifications/unread-count");
    return data.data.unreadCount;
  },

  async markRead(id: string) {
    const { data } = await apiClient.patch<ApiResponse<AppNotification>>(`/notifications/${id}/read`);
    return data.data;
  },

  async markAllRead() {
    await apiClient.patch("/notifications/read-all");
  },
};
