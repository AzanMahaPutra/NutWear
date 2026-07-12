"use client";

import { useEffect, useState } from "react";
import { Plus, ChevronUp, ChevronDown } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { RowActions } from "@/components/shared/RowActions";
import { StatusToggle } from "@/components/shared/StatusToggle";
import { Modal } from "@/components/ui/Modal";
import { HeroBannerForm } from "@/features/admin/components/HeroBannerForm";
import { useAdminHeroBannerStore } from "@/stores/adminHeroBannerStore";
import { useToastStore } from "@/stores/toastStore";
import { getApiErrorMessage } from "@/lib/apiTypes";
import { HeroBanner } from "@/services/heroBannerService";

const LINK_TYPE_LABEL: Record<HeroBanner["link"]["type"], string> = {
  none: "Tidak ada",
  product: "Produk",
  category: "Kategori",
  custom: "Link Lain",
};

export function HeroBannerManagementView() {
  const heroBanners = useAdminHeroBannerStore((s) => s.heroBanners);
  const isLoading = useAdminHeroBannerStore((s) => s.isLoading);
  const fetchHeroBanners = useAdminHeroBannerStore((s) => s.fetchHeroBanners);
  const deleteHeroBanner = useAdminHeroBannerStore((s) => s.deleteHeroBanner);
  const toggleActive = useAdminHeroBannerStore((s) => s.toggleActive);
  const moveHeroBanner = useAdminHeroBannerStore((s) => s.moveHeroBanner);
  const showToast = useToastStore((s) => s.showToast);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HeroBanner | undefined>(undefined);

  useEffect(() => {
    fetchHeroBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    try {
      await deleteHeroBanner(id);
      showToast("Hero banner dihapus");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  async function handleToggle(banner: HeroBanner) {
    try {
      await toggleActive(banner.id, banner.isActive);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  async function handleMove(id: string, direction: "up" | "down") {
    try {
      await moveHeroBanner(id, direction);
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  }

  const sorted = [...heroBanners].sort((a, b) => a.sortOrder - b.sortOrder);

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
          <Plus className="h-4 w-4" /> Tambah Hero Banner
        </button>
      </div>

      <DataTable
        rowKey={(b) => b.id}
        data={sorted}
        emptyTitle={isLoading ? "Memuat..." : "Belum ada hero banner"}
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
              <img src={b.imageUrl} alt={b.title ?? "Hero banner"} className="h-12 w-20 rounded-md object-cover" />
            ),
          },
          { key: "judul", header: "Judul", render: (b) => b.title || "-" },
          {
            key: "tujuan",
            header: "Link Tujuan",
            render: (b) => {
              const label = LINK_TYPE_LABEL[b.link.type];
              if (b.link.type === "product" && b.link.product) return `${label}: ${b.link.product.namaProduk}`;
              if (b.link.type === "category" && b.link.category) return `${label}: ${b.link.category.namaKategori}`;
              if (b.link.type === "custom" && b.link.customUrl) return `${label}: ${b.link.customUrl}`;
              return label;
            },
          },
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

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Hero Banner" : "Tambah Hero Banner"}
        size="xl"
      >
        <HeroBannerForm initialData={editing} onSuccess={() => setFormOpen(false)} />
      </Modal>
    </div>
  );
}
