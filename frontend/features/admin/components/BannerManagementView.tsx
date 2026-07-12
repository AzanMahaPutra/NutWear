"use client";

import { useEffect, useState } from "react";
import { Plus, ChevronUp, ChevronDown } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { RowActions } from "@/components/shared/RowActions";
import { StatusToggle } from "@/components/shared/StatusToggle";
import { Modal } from "@/components/ui/Modal";
import { BannerForm } from "@/features/admin/components/BannerForm";
import { useAdminBannerStore } from "@/stores/adminBannerStore";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { Banner } from "@/services/bannerService";
import { formatCurrency } from "@/utils/formatCurrency";

export function BannerManagementView() {
  const banners = useAdminBannerStore((s) => s.banners);
  const isLoading = useAdminBannerStore((s) => s.isLoading);
  const fetchBanners = useAdminBannerStore((s) => s.fetchBanners);
  const deleteBanner = useAdminBannerStore((s) => s.deleteBanner);
  const toggleActive = useAdminBannerStore((s) => s.toggleActive);
  const moveBanner = useAdminBannerStore((s) => s.moveBanner);
  const showToast = useToastStore((s) => s.showToast);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | undefined>(undefined);

  useEffect(() => {
    fetchBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    try {
      await deleteBanner(id);
      showToast("Banner dihapus");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  async function handleToggle(banner: Banner) {
    try {
      await toggleActive(banner.id, banner.isActive);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  async function handleMove(id: string, direction: "up" | "down") {
    try {
      await moveBanner(id, direction);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  const sorted = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
          className="flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Tambah Banner
        </button>
      </div>

      <DataTable
        rowKey={(b) => b.id}
        data={sorted}
        emptyTitle={isLoading ? "Memuat..." : "Belum ada banner"}
        columns={[
          {
            key: "urutan",
            header: "Urutan",
            render: (b) => (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMove(b.id, "up")}
                  disabled={sorted.findIndex((s) => s.id === b.id) === 0}
                  className="rounded border border-neutral-200 p-1 disabled:opacity-30"
                  aria-label="Naikkan urutan"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(b.id, "down")}
                  disabled={sorted.findIndex((s) => s.id === b.id) === sorted.length - 1}
                  className="rounded border border-neutral-200 p-1 disabled:opacity-30"
                  aria-label="Turunkan urutan"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            ),
          },
          {
            key: "preview",
            header: "Preview",
            render: (b) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.backgroundImageUrl} alt={b.title.text} className="h-12 w-20 rounded-md object-cover" />
            ),
          },
          { key: "judul", header: "Judul", render: (b) => b.title.text },
          { key: "harga", header: "Harga Promo", render: (b) => formatCurrency(b.pricePromo.value) },
          {
            key: "status",
            header: "Status",
            render: (b) => <StatusToggle active={b.isActive} onToggle={() => handleToggle(b)} />,
          },
          {
            key: "aksi",
            header: "Aksi",
            render: (b) => (
              <RowActions
                onEdit={() => {
                  setEditing(b);
                  setFormOpen(true);
                }}
                onDelete={() => handleDelete(b.id)}
              />
            ),
          },
        ]}
      />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Banner" : "Tambah Banner"} size="xl">
        <BannerForm initialData={editing} onSuccess={() => setFormOpen(false)} />
      </Modal>
    </div>
  );
}
