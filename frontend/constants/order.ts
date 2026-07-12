import { OrderStatus } from "@/types/user";

// Label dan warna badge untuk setiap status pesanan.
// Dipakai di halaman Riwayat Pesanan (user) dan Manajemen Pesanan (admin)
// supaya konsisten dan tidak duplikasi logic mapping status di banyak tempat.

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  menunggu_pembayaran: "Menunggu Pembayaran",
  sudah_dibayar: "Sudah Dibayar",
  diproses: "Diproses",
  dikemas: "Dikemas",
  dikirim: "Dikirim",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
  expired: "Expired",
  refund: "Refund",
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  menunggu_pembayaran: "bg-amber-100 text-amber-700",
  sudah_dibayar: "bg-blue-100 text-blue-700",
  diproses: "bg-indigo-100 text-indigo-700",
  dikemas: "bg-purple-100 text-purple-700",
  dikirim: "bg-cyan-100 text-cyan-700",
  selesai: "bg-green-100 text-green-700",
  dibatalkan: "bg-gray-200 text-gray-700",
  expired: "bg-red-100 text-red-700",
  refund: "bg-orange-100 text-orange-700",
};

// Label metode & status pembayaran untuk Detail Pesanan (Update 5, Bagian A) —
// key mengikuti nilai payment_type / transaction_status dari Midtrans.
export const PAYMENT_TYPE_LABEL: Record<string, string> = {
  credit_card: "Kartu Kredit/Debit",
  bank_transfer: "Transfer Bank (Virtual Account)",
  echannel: "Mandiri Bill (Echannel)",
  gopay: "GoPay",
  shopeepay: "ShopeePay",
  qris: "QRIS",
  cstore: "Gerai Retail (Indomaret/Alfamart)",
  akulaku: "Akulaku PayLater",
  kredivo: "Kredivo",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  capture: "Pembayaran Diterima",
  settlement: "Pembayaran Berhasil",
  pending: "Menunggu Pembayaran",
  deny: "Pembayaran Ditolak",
  cancel: "Pembayaran Dibatalkan",
  expire: "Pembayaran Kedaluwarsa",
  failure: "Pembayaran Gagal",
  refund: "Dana Dikembalikan",
  partial_refund: "Dana Dikembalikan Sebagian",
};

// Nama bulan Indonesia untuk filter Bulan di halaman Pesanan Admin.
export const MONTH_OPTIONS = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

// Status yang boleh ikut terhapus lewat tombol "Hapus Semua" (harus sinkron dengan
// BULK_DELETE_ALLOWED_STATUSES di backend/src/repositories/orderRepository.js) —
// pesanan yang masih aktif (menunggu pembayaran, diproses, dikemas, dikirim) tidak boleh terhapus massal.
export const BULK_DELETE_ALLOWED_STATUSES: OrderStatus[] = ["selesai", "dibatalkan", "expired"];
