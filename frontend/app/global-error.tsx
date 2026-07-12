"use client";

/**
 * global-error.tsx menangani error yang terjadi di RootLayout itu sendiri
 * (di luar jangkauan app/error.tsx biasa). Wajib menyertakan <html>/<body> sendiri
 * karena root layout dianggap sudah gagal me-render.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="id">
      <body>
        <div style={{ padding: 48, textAlign: "center", fontFamily: "sans-serif" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Terjadi Kesalahan Fatal</h1>
          <p style={{ color: "#666", marginTop: 8 }}>Silakan muat ulang halaman.</p>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "10px 24px",
              borderRadius: 999,
              background: "#111",
              color: "#fff",
              border: "none",
            }}
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
