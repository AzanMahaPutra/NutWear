/**
 * Format tanggal ISO menjadi format Indonesia, contoh: "2026-07-02" -> "02/07/2026"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Format waktu notifikasi jadi relatif ("Baru saja", "5 menit lalu", dst) untuk
 * notifikasi yang masih baru, lalu jatuh ke format tanggal biasa untuk yang lebih lama.
 * Dipakai NotificationBell (Update 1 — Sistem Notifikasi User).
 */
export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return formatDate(dateString);
}
