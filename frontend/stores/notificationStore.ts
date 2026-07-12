import { create } from "zustand";
import { AppNotification } from "@/types/user";
import { notificationService } from "@/services/notificationService";

interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  pollTimer: ReturnType<typeof setInterval> | null;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

// Interval polling unread-count — hanya query ringan (count saja, lihat
// notificationRepository.countUnread), bukan mengambil seluruh daftar notifikasi,
// supaya tidak membebani server (Update 1, bagian Performa).
const POLL_INTERVAL_MS = 60_000;

/**
 * Store Notifikasi User global, sinkron dengan Notification API sungguhan.
 * Dipakai NotificationBell di Navbar.
 */
export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  isLoading: false,
  pollTimer: null,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const { items, meta } = await notificationService.getAll({ pageSize: 30 });
      set({ items, unreadCount: meta.unreadCount });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    const unreadCount = await notificationService.getUnreadCount();
    set({ unreadCount });
  },

  markAsRead: async (id) => {
    const target = get().items.find((n) => n.id === id);
    if (!target || target.isRead) return;
    await notificationService.markRead(id);
    set((state) => ({
      items: state.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: async () => {
    await notificationService.markAllRead();
    set((state) => ({ items: state.items.map((n) => ({ ...n, isRead: true })), unreadCount: 0 }));
  },

  startPolling: () => {
    if (get().pollTimer) return;
    const timer = setInterval(() => {
      get().fetchUnreadCount().catch(() => {});
    }, POLL_INTERVAL_MS);
    set({ pollTimer: timer });
  },

  stopPolling: () => {
    const timer = get().pollTimer;
    if (timer) clearInterval(timer);
    set({ pollTimer: null, items: [], unreadCount: 0 });
  },
}));
