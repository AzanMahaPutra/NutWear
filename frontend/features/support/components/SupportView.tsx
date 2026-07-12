import { MessageCircle, Mail, Instagram, Clock } from "lucide-react";
import { AccordionItem } from "@/components/shared/AccordionItem";

/**
 * Data contoh (placeholder) untuk tiap section — sengaja dipisah sebagai konstanta
 * di atas file supaya mudah diedit developer di kemudian hari tanpa menyentuh
 * markup/JSX. Bisa dipindah ke tabel database (mis. `faqs`, `size_guides`,
 * `store_settings`) nanti tanpa mengubah struktur SupportView di bawah.
 */
const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "Bagaimana cara melakukan pemesanan?",
    answer:
      "Pilih produk yang diinginkan, tentukan ukuran dan warna, lalu tambahkan ke keranjang. Setelah itu lanjutkan ke halaman Checkout untuk mengisi alamat pengiriman dan menyelesaikan pembayaran.",
  },
  {
    question: "Bagaimana cara melakukan pembayaran?",
    answer:
      "Pembayaran dapat dilakukan melalui berbagai metode yang tersedia di halaman Checkout, termasuk transfer bank, e-wallet, dan kartu kredit/debit.",
  },
  {
    question: "Berapa lama proses pengiriman?",
    answer:
      "Estimasi pengiriman umumnya 2-5 hari kerja untuk wilayah dalam negeri, tergantung lokasi tujuan dan kurir yang dipilih saat checkout.",
  },
  {
    question: "Bagaimana jika produk yang diterima rusak?",
    answer:
      "Segera hubungi tim Hubungi Kami maksimal 2x24 jam setelah barang diterima, sertakan foto/video produk sebagai bukti untuk proses klaim.",
  },
  {
    question: "Apakah produk dapat ditukar?",
    answer:
      "Penukaran ukuran/warna dapat diajukan selama stok tersedia dan syarat pada Kebijakan Pengembalian terpenuhi.",
  },
];

/** Data kontak toko — belum ada tabel/API pengaturan toko yang aktif (lihat app/admin/pengaturan/page.tsx,
 * masih dummy/Fase 1), jadi nilai di bawah sengaja disamakan dengan nilai dummy di halaman itu. */
const CONTACT_INFO = {
  whatsapp: "+62 812 3456 7890",
  email: "hello@nutwear.co",
  instagram: "@nutwear.id",
  jamOperasional: "Senin - Sabtu, 09.00 - 18.00 WIB",
};

const RETURN_POLICY_ITEMS: { title: string; description: string }[] = [
  {
    title: "Batas Waktu Pengajuan",
    description: "Pengajuan retur dapat dilakukan maksimal 14 hari sejak produk diterima oleh pembeli.",
  },
  {
    title: "Syarat Produk",
    description:
      "Produk belum dicuci/dipakai, label & tag masih terpasang lengkap, serta dikembalikan beserta kemasan asli.",
  },
  {
    title: "Proses Pengajuan",
    description:
      "Hubungi tim Hubungi Kami dengan menyertakan nomor pesanan dan foto produk, tim kami akan memandu langkah pengembalian selanjutnya.",
  },
];

const SIZE_GUIDE_ATASAN: { size: string; lebarDada: string; panjangBadan: string; panjangLengan: string }[] = [
  { size: "S", lebarDada: "48 cm", panjangBadan: "68 cm", panjangLengan: "20 cm" },
  { size: "M", lebarDada: "50 cm", panjangBadan: "70 cm", panjangLengan: "21 cm" },
  { size: "L", lebarDada: "52 cm", panjangBadan: "72 cm", panjangLengan: "22 cm" },
  { size: "XL", lebarDada: "54 cm", panjangBadan: "74 cm", panjangLengan: "23 cm" },
  { size: "XXL", lebarDada: "56 cm", panjangBadan: "76 cm", panjangLengan: "24 cm" },
  { size: "3XL", lebarDada: "58 cm", panjangBadan: "78 cm", panjangLengan: "25 cm" },
];

const SIZE_GUIDE_BAWAHAN: { size: string; lingkarPinggang: string; lingkarPinggul: string; panjangCelana: string }[] = [
  { size: "S", lingkarPinggang: "70 cm", lingkarPinggul: "94 cm", panjangCelana: "98 cm" },
  { size: "M", lingkarPinggang: "74 cm", lingkarPinggul: "98 cm", panjangCelana: "99 cm" },
  { size: "L", lingkarPinggang: "78 cm", lingkarPinggul: "102 cm", panjangCelana: "100 cm" },
  { size: "XL", lingkarPinggang: "82 cm", lingkarPinggul: "106 cm", panjangCelana: "101 cm" },
  { size: "XXL", lingkarPinggang: "86 cm", lingkarPinggul: "110 cm", panjangCelana: "102 cm" },
  { size: "3XL", lingkarPinggang: "90 cm", lingkarPinggul: "114 cm", panjangCelana: "103 cm" },
];

const TERMS_SECTIONS: { title: string; content: string }[] = [
  {
    title: "Ketentuan Pembelian",
    content:
      "Dengan melakukan pemesanan di NutWear, pembeli dianggap telah membaca dan menyetujui ketersediaan stok, deskripsi, serta harga produk yang tertera pada saat transaksi dilakukan.",
  },
  {
    title: "Pembayaran",
    content:
      "Transaksi dianggap sah setelah pembayaran diterima dan diverifikasi melalui metode pembayaran yang tersedia di halaman Checkout.",
  },
  {
    title: "Pengiriman",
    content:
      "Estimasi waktu pengiriman bersifat perkiraan dan dapat berubah tergantung kondisi kurir, cuaca, atau lokasi tujuan di luar kendali NutWear.",
  },
  {
    title: "Penggunaan Website",
    content:
      "Pengguna wajib memberikan data yang benar dan tidak menyalahgunakan website untuk tujuan yang melanggar hukum yang berlaku.",
  },
  {
    title: "Privasi",
    content:
      "Data pribadi pengguna hanya digunakan untuk keperluan transaksi dan layanan, dan tidak akan dibagikan ke pihak ketiga tanpa persetujuan, kecuali diwajibkan oleh hukum.",
  },
];

/** Tabel ukuran reusable — dipakai untuk Atasan & Celana/Bawahan, horizontal scroll di layar kecil. */
function SizeGuideTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200">
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap py-2 pr-4 font-semibold text-neutral-900">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-neutral-100 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="whitespace-nowrap py-2 pr-4 text-neutral-600">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * View halaman "Pelayanan & Dukungan" — satu halaman berisi seluruh informasi
 * bantuan (FAQ, Hubungi Kami, Kebijakan Pengembalian, Panduan Ukuran, Syarat &
 * Ketentuan) memakai AccordionItem yang sama dengan section Deskripsi di
 * Detail Produk, supaya tampilan tetap konsisten dan tidak perlu halaman terpisah
 * per menu. Setiap section id-nya dipakai Footer untuk deep-link (mis. #faq).
 */
export function SupportView() {
  return (
    <div className="mx-auto max-w-3xl">
      <div id="faq">
        <AccordionItem title="FAQ" defaultOpen>
          <div className="space-y-1">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.question} title={item.question}>
                <p>{item.answer}</p>
              </AccordionItem>
            ))}
          </div>
        </AccordionItem>
      </div>

      <div id="hubungi-kami">
        <AccordionItem title="Hubungi Kami">
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <MessageCircle className="h-4 w-4 shrink-0 text-neutral-400" />
              <span>WhatsApp: {CONTACT_INFO.whatsapp}</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-neutral-400" />
              <span>Email: {CONTACT_INFO.email}</span>
            </li>
            <li className="flex items-center gap-3">
              <Instagram className="h-4 w-4 shrink-0 text-neutral-400" />
              <span>Instagram: {CONTACT_INFO.instagram}</span>
            </li>
            <li className="flex items-center gap-3">
              <Clock className="h-4 w-4 shrink-0 text-neutral-400" />
              <span>Jam Operasional: {CONTACT_INFO.jamOperasional}</span>
            </li>
          </ul>
        </AccordionItem>
      </div>

      <div id="kebijakan-pengembalian">
        <AccordionItem title="Kebijakan Pengembalian">
          <div className="space-y-3">
            {RETURN_POLICY_ITEMS.map((item) => (
              <div key={item.title}>
                <p className="font-medium text-neutral-900">{item.title}</p>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </AccordionItem>
      </div>

      <div id="panduan-ukuran">
        <AccordionItem title="Panduan Ukuran">
          <div className="space-y-1">
            <AccordionItem title="Panduan Ukuran Atasan">
              <SizeGuideTable
                headers={["Size", "Lebar Dada", "Panjang Badan", "Panjang Lengan"]}
                rows={SIZE_GUIDE_ATASAN.map((r) => [r.size, r.lebarDada, r.panjangBadan, r.panjangLengan])}
              />
            </AccordionItem>
            <AccordionItem title="Panduan Ukuran Celana / Bawahan">
              <SizeGuideTable
                headers={["Size", "Lingkar Pinggang", "Lingkar Pinggul", "Panjang Celana"]}
                rows={SIZE_GUIDE_BAWAHAN.map((r) => [r.size, r.lingkarPinggang, r.lingkarPinggul, r.panjangCelana])}
              />
            </AccordionItem>
          </div>
        </AccordionItem>
      </div>

      <div id="syarat-ketentuan">
        <AccordionItem title="Syarat & Ketentuan">
          <div className="space-y-3">
            {TERMS_SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="font-medium text-neutral-900">{section.title}</p>
                <p>{section.content}</p>
              </div>
            ))}
          </div>
        </AccordionItem>
      </div>
    </div>
  );
}
