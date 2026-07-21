import { apiClient } from "@/lib/apiClient";
import { ApiResponse } from "@/lib/apiTypes";
import { User, UserAccountStatus, UserAddress } from "@/types/user";

// UPDATE — Manajemen User: data pelanggan sekarang menyertakan Status Akun,
// Total Pesanan, dan Total Review (lihat CustomerManagementView).
export interface AdminCustomer {
  id: string;
  namaLengkap: string;
  email: string;
  noHp: string;
  joinedAt: string;
  status: UserAccountStatus;
  bannedReason?: string | null;
  bannedAt?: string | null;
  orderCount: number;
  reviewCount: number;
}

/**
 * Service User Profile & Address — dipakai ProfileView, AddressForm, dan Checkout.
 */
export const userService = {
  async getProfile() {
    const { data } = await apiClient.get<ApiResponse<User>>("/users/me/profile");
    return data.data;
  },

  async updateProfile(payload: { namaLengkap?: string; noHp?: string }) {
    const { data } = await apiClient.put<ApiResponse<User>>("/users/me/profile", payload);
    return data.data;
  },

  async getAddresses() {
    const { data } = await apiClient.get<ApiResponse<UserAddress[]>>("/users/me/addresses");
    return data.data;
  },

  async addAddress(payload: Omit<UserAddress, "id" | "userId" | "isDefault">) {
    const { data } = await apiClient.post<ApiResponse<UserAddress>>("/users/me/addresses", payload);
    return data.data;
  },

  async updateAddress(id: string, payload: Partial<UserAddress>) {
    const { data } = await apiClient.put<ApiResponse<UserAddress>>(`/users/me/addresses/${id}`, payload);
    return data.data;
  },

  async deleteAddress(id: string) {
    await apiClient.delete(`/users/me/addresses/${id}`);
  },

  async setDefaultAddress(id: string) {
    const { data } = await apiClient.patch<ApiResponse<UserAddress>>(`/users/me/addresses/${id}/default`);
    return data.data;
  },

  // --- Admin ---
  async getAllCustomers() {
    const { data } = await apiClient.get<ApiResponse<AdminCustomer[]>>("/users");
    return data.data;
  },

  // UPDATE — Banned User: Admin melakukan banned terhadap satu user.
  async banUser(id: string, reason: string) {
    const { data } = await apiClient.patch<ApiResponse<User>>(`/users/${id}/ban`, { reason });
    return data.data;
  },
};
