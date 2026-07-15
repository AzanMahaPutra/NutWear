import Image from "next/image";
import { ImageOff } from "lucide-react";
import { Order } from "@/types/user";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";

interface OrderDetailViewProps {
  order: Order;
}

/**
 * Konten Detail Pesanan Admin (Update 3, poin 8) — menampilkan seluruh produk
 * yang dipesan (thumbnail, SKU, varian, qty, harga, subtotal) dan informasi
 * pengiriman lengkap. Dipakai di dalam Modal generic yang sudah ada.
 */
export function OrderDetailView({ order }: OrderDetailViewProps) {
  return (
    <div className="space-y-6">
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
          <p className="text-xs text-neutral-400">Jumlah Item</p>
          <p className="font-semibold text-neutral-900">{order.items.length}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">Status</p>
          <OrderStatusBadge status={order.status} />
          {order.status === "dibatalkan" && order.cancelledBy === "user" && (
            <p className="mt-1 text-[11px] font-medium text-neutral-400">Dibatalkan oleh customer</p>
          )}
        </div>
        {order.customer && (
          <div className="col-span-2 border-t border-neutral-200 pt-3">
            <p className="text-xs text-neutral-400">Pemesan</p>
            <p className="font-semibold text-neutral-900">{order.customer.namaLengkap}</p>
            <p className="text-xs text-neutral-500">
              {order.customer.email}
              {order.customer.noHp ? ` · ${order.customer.noHp}` : ""}
            </p>
          </div>
        )}
      </div>

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
                {item.sku && <p className="text-xs text-neutral-400">SKU: {item.sku}</p>}
                <p className="text-xs text-neutral-500">
                  Warna: {item.warna ?? "-"} · Ukuran: {item.ukuran ?? "-"}
                </p>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-neutral-500">
                    {item.quantity} x {formatCurrency(item.harga)}
                  </span>
                  <span className="font-bold text-neutral-900">{formatCurrency(item.harga * item.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-bold text-neutral-900">Informasi Pengiriman</h4>
        {order.shippingAddress ? (
          <div className="rounded-lg border border-neutral-100 p-4 text-sm text-neutral-700">
            <p className="font-semibold text-neutral-900">{order.shippingAddress.receiverName}</p>
            <p className="text-neutral-500">{order.shippingAddress.phone}</p>
            <p className="mt-2">{order.shippingAddress.address}</p>
            <p>
              {order.shippingAddress.district}, {order.shippingAddress.city}
            </p>
            <p>
              {order.shippingAddress.province} {order.shippingAddress.postalCode}
            </p>
          </div>
        ) : (
          <p className="text-sm text-neutral-400">Alamat pengiriman tidak tersedia.</p>
        )}
      </div>

      <div className="space-y-1 border-t border-neutral-100 pt-4 text-sm">
        <div className="flex justify-between text-neutral-500">
          <span>Subtotal Produk</span>
          <span>{formatCurrency(order.totalPrice)}</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Ongkos Kirim</span>
          <span>{formatCurrency(order.shippingCost)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-neutral-900">
          <span>Total</span>
          <span>{formatCurrency(order.grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
