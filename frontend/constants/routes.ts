// Konstanta path routing. Semua Link/href di komponen mengacu ke sini
// supaya kalau ada perubahan struktur URL, cukup ubah di satu tempat.

export const ROUTES = {
  home: "/",
  produk: "/produk",
  produkDetail: (slug: string) => `/produk/${slug}`,
  /** Halaman Pasangan Produk untuk satu foto gallery tertentu (UPDATE 3). */
  produkPasangan: (slug: string, imageId: string) => `/produk/${slug}/pasangan?imageId=${imageId}`,
  /** Halaman Produk dengan filter kategori aktif (dipakai Footer & CategoryGrid). */
  produkKategori: (kategoriId: string) => `/produk?kategori=${kategoriId}`,
  /** Halaman Produk dengan filter New Arrival aktif. */
  produkNewArrival: "/produk?newArrival=1",
  kategori: "/kategori",
  kategoriDetail: (id: string) => `/kategori/${id}`,
  keranjang: "/keranjang",
  wishlist: "/wishlist",
  checkout: "/checkout",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  profile: "/profile",
  profileAlamat: "/profile/alamat",
  riwayatPesanan: "/profile/riwayat-pesanan",
  tentangKami: "/tentang-kami",
  pelayananDukungan: "/pelayanan-dukungan",
  admin: {
    dashboard: "/admin",
    produk: "/admin/produk",
    kategori: "/admin/kategori",
    banner: "/admin/banner",
    heroBanner: "/admin/hero-banner",
    pesanan: "/admin/pesanan",
    // UPDATE — Laporan Transaksi & Export Excel: halaman baru khusus transaksi yang
    // sudah berhasil dibayar (berbeda dari halaman Pesanan di atas).
    laporanTransaksi: "/admin/laporan-transaksi",
    // UPDATE — Halaman Inventory Stock Admin: khusus manajemen stok seluruh varian
    // produk (berbeda dari halaman Produk/Edit Produk di atas).
    inventoryStok: "/admin/inventory-stok",
    pelanggan: "/admin/pelanggan",
    // UPDATE — Pengajuan Unban: halaman Admin "Permohonan Unban".
    permohonanUnban: "/admin/permohonan-unban",
    review: "/admin/review",
    pengaturan: "/admin/pengaturan",
  },
} as const;
