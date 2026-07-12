"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { userService, AdminCustomer } from "@/services/userService";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { formatDate } from "@/utils/formatDate";

/**
 * View Manajemen Pelanggan — read-only, data dari User API sungguhan (GET /users, admin only).
 */
export function CustomerManagementView() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    (async () => {
      try {
        const data = await userService.getAllCustomers();
        setCustomers(data);
      } catch (err) {
        showToast(getApiErrorMessage(err, "Gagal memuat pelanggan"), "error");
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6">
      <DataTable
        rowKey={(c) => c.id}
        data={customers}
        emptyTitle={isLoading ? "Memuat..." : "Belum ada pelanggan"}
        columns={[
          { key: "nama", header: "Nama", render: (c) => c.namaLengkap },
          { key: "email", header: "Email", render: (c) => c.email },
          { key: "hp", header: "No. HP", render: (c) => c.noHp },
          { key: "bergabung", header: "Bergabung", render: (c) => formatDate(c.joinedAt) },
        ]}
      />
    </div>
  );
}
