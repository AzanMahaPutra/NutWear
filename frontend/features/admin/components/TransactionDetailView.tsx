import Image from "next/image";
import { ImageOff } from "lucide-react";
import { Order } from "@/types/user";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { PAYMENT_TYPE_LABEL, PAYMENT_STATUS_LABEL } from "@/constants/order";

interface TransactionDetailViewProps {
  order: Order;
}

/**
 * UPDATE — Halaman Laporan Transaksi & Export Excel: konten Detail Transaksi (dibuka
 * lewat tombol "Lihat Detail"/klik baris pada TransactionReportView). Komponen BARU,
 * terpisah dari OrderDetailView.tsx milik halaman Pesanan (supaya halaman Pesanan tidak
 * ikut berubah), tapi menampilkan Metode & Status Pembayaran yang tidak ada di sana.
 *
 * CATATAN — Diskon & Voucher: skema database project ini belum punya kolom
 * diskon/voucher sama sekali (lihat backend/src/database/schema.sql & CHANGELOG.md),
 * jadi baris tersebut sengaja TIDAK ditampilkan di sini (bukan mengarang data Rp0 di
 * tampilan admin) — beda dengan file Excel yang tetap menyertakan kolom "Diskon" sesuai
 * format kolom yang diminta dokumen.
 */
export function TransactionDetailView({ order }: TransactionDetailViewProps) {
  const paymentTypeLabel = order.payment?.paymentType
    ? (PAYMENT_TYPE_LABEL[order.payment.paymentType] ?? order.payment.paymentType)
    : "-";
  const paymentStatusLabel = order.payment?.transactionStatus
    ? (PAYMENT_STATUS_LABEL[order.payment.transactionStatus] ?? order.payment.transactionStatus)
    : "-";

  return (
    <div className="space-y-6">
      {/* Informasi Customer */}
      <div>
        <h4 className="mb-3 text-sm font-bold text-neutral-900">Informasi Customer</h4>
        <div className="grid grid-cols-1 gap-3 rounded-lg bg-neutral-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-neutral-400">Nama</p>
            <p className="font-semibold text-neutral-900">{order.customer?.namaLengkap ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Email</p>
            <p className="font-semibold text-neutral-900">{order.customer?.email ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Nomor HP</p>
            <p className="font-semibold text-neutral-900">
              {order.customer?.noHp ?? order.shippingAddress?.phone ?? "-"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-neutral-400">Alamat Lengkap</p>
            {order.shippingAddress ? (
              <p className="font-semibold text-neutral-900">
                {order.shippingAddress.address}, {order.shippingAddress.district}, {order.shippingAddress.city},{" "}
                {order.shippingAddress.province} {order.shippingAddress.postalCode}
              </p>
            ) : (
              <p className="text-neutral-400">Alamat tidak tersedia</p>
            )}
          </div>
        </div>
      </div>

      {/* Informasi Order */}
      <div>
        <h4 className="mb-3 text-sm font-bold text-neutral-900">Informasi Order</h4>
        <div className="grid grid-cols-1 gap-3 rounded-lg bg-neutral-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-neutral-400">Order ID</p>
            <p className="font-semibold text-neutral-900">#{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Tanggal</p>
            <p className="font-semibold text-neutral-900">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Status Pembayaran</p>
            <p className="font-semibold text-neutral-900">{paymentStatusLabel}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Metode Pembayaran</p>
            <p className="font-semibold text-neutral-900">{paymentTypeLabel}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Total Pembayaran</p>
            <p className="font-semibold text-neutral-900">{formatCurrency(order.grandTotal)}</p>
          </div>
        </div>
      </div>

      {/* Daftar Produk */}
      <div>
        <h4 className="mb-3 text-sm font-bold text-neutral-900">Daftar Produk</h4>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3 rounded-lg border border-neutral-100 p-3">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-50">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.namaProduk ?? ""} fill sizes="64px" className="object-cover" />
                ) : (
                  <ImageOff className="h-5 w-5 text-neutral-300" />
                )}
              </div>
              <div className="flex-1 text-sm">
                <p className="font-semibold text-neutral-900">{item.namaProduk ?? "Produk tidak ditemukan"}</p>
                <p className="text-xs text-neutral-500">
                  Warna: {item.warna ?? "-"} · Ukuran: {item.ukuran ?? "-"} · Jumlah: {item.quantity}
                </p>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Harga Satuan: {formatCurrency(item.harga)}</span>
                  <span className="font-bold text-neutral-900">Subtotal: {formatCurrency(item.harga * item.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ongkos Kirim, Diskon (jika ada), Voucher (jika ada), Grand Total */}
      <div className="space-y-1 border-t border-neutral-100 pt-4 text-sm">
        <div className="flex justify-between text-neutral-500">
          <span>Subtotal Produk</span>
          <span>{formatCurrency(order.totalPrice)}</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Ongkos Kirim</span>
          <span>{formatCurrency(order.shippingCost)}</span>
        </div>
        {/* Diskon/Voucher tidak ditampilkan — lihat catatan komponen di atas. */}
        <div className="flex justify-between text-base font-bold text-neutral-900">
          <span>Grand Total</span>
          <span>{formatCurrency(order.grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
