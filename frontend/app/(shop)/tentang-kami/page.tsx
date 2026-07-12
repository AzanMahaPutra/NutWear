import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: "Asia's Online Fashion Destination — kenali lebih dekat NutWear.",
};

const PARAGRAPHS = [
  `NutWear didirikan dengan sebuah misi sederhana: menghadirkan kenyamanan harian tanpa mengorbankan gaya personal Anda. Saat ini, NutWear berkembang menjadi salah satu destinasi retail fashion online lokal yang berfokus pada penyediaan pakaian kasual minimalis dengan kualitas premium.`,
  `Kami percaya bahwa pakaian yang baik dimulai dari bahan yang baik. Oleh karena itu, setiap helai produk NutWear dibuat menggunakan serat alami pilihan yang nyaman, sejuk, dan tahan lama.`,
  `Mengapa harus bingung mencari tempat lain ketika NutWear adalah toko fashion online yang siap melayani segala keperluan gaya harian Anda? Temukan koleksi original dan berkualitas kami untuk melengkapi kebutuhan fashion Anda sekarang juga.`,
];

export default function TentangKamiPage() {
  return (
    <Container className="py-10">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="mb-8 text-4xl font-extrabold text-neutral-900">
          Asia&apos;s Online
          <br />
          Fashion Destination
        </h1>

        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">Tentang NutWear</h2>
        <div className="space-y-4 text-left text-sm leading-relaxed text-neutral-600">
          {PARAGRAPHS.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </Container>
  );
}
