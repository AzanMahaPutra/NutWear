import { create } from "zustand";
import { UserAddress } from "@/types/user";
import { userService } from "@/services/userService";

interface AddressState {
  addresses: UserAddress[];
  isLoading: boolean;
  fetchAddresses: () => Promise<void>;
  addAddress: (payload: Omit<UserAddress, "id" | "userId" | "isDefault">) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
}

/**
 * Store alamat pengiriman — cache di client, sumber data sebenarnya dari
 * Address API (lihat services/userService.ts). Dipakai ProfileView,
 * AddressForm, dan AddressSelector di Checkout supaya semua komponen
 * melihat daftar alamat yang sama tanpa fetch berulang.
 */
export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  isLoading: false,

  fetchAddresses: async () => {
    set({ isLoading: true });
    try {
      const addresses = await userService.getAddresses();
      set({ addresses });
    } catch {
      // Dibiarkan diam di sini; komponen pemanggil menampilkan toast bila perlu.
    } finally {
      set({ isLoading: false });
    }
  },

  addAddress: async (payload) => {
    const created = await userService.addAddress(payload);
    set({ addresses: [...get().addresses, created] });
  },

  removeAddress: async (id) => {
    await userService.deleteAddress(id);
    set({ addresses: get().addresses.filter((a) => a.id !== id) });
  },

  setDefaultAddress: async (id) => {
    await userService.setDefaultAddress(id);
    set({ addresses: get().addresses.map((a) => ({ ...a, isDefault: a.id === id })) });
  },
}));
