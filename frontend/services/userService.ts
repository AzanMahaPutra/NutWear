import { apiClient } from "@/lib/apiClient";
import { ApiResponse } from "@/lib/apiTypes";
import { User, UserAddress } from "@/types/user";

export interface AdminCustomer {
  id: string;
  namaLengkap: string;
  email: string;
  noHp: string;
  joinedAt: string;
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
};
