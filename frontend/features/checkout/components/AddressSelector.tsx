"use client";

import { useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { UserAddress } from "@/types/user";
import { Modal } from "@/components/ui/Modal";
import { AddressForm } from "@/features/profile/components/AddressForm";
import { cn } from "@/utils/cn";

interface AddressSelectorProps {
  addresses: UserAddress[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Pemilih alamat pengiriman di Checkout. Reuse AddressForm yang sama
 * dengan yang dipakai di halaman Profile.
 */
export function AddressSelector({ addresses, selectedId, onSelect }: AddressSelectorProps) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-neutral-900">Alamat Pengiriman</h2>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1 text-xs font-medium text-neutral-600 underline"
        >
          <Plus className="h-3.5 w-3.5" /> Tambah Alamat
        </button>
      </div>

      {addresses.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-400">
          Belum ada alamat. Tambahkan alamat pengiriman terlebih dahulu.
        </p>
      ) : (
        <div className="space-y-2">
          {addresses.map((addr) => (
            <label
              key={addr.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3.5",
                selectedId === addr.id ? "border-neutral-900" : "border-neutral-200"
              )}
            >
              <input
                type="radio"
                name="address"
                checked={selectedId === addr.id}
                onChange={() => onSelect(addr.id)}
                className="mt-1 accent-neutral-900"
              />
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
              <div className="text-sm">
                <p className="font-semibold text-neutral-800">{addr.receiverName} · {addr.phone}</p>
                <p className="text-neutral-500">
                  {addr.address}, {addr.district}, {addr.city}, {addr.province} {addr.postalCode}
                </p>
              </div>
            </label>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Tambah Alamat">
        <AddressForm onSuccess={() => setAddOpen(false)} />
      </Modal>
    </div>
  );
}
