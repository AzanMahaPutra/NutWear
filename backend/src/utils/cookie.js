const env = require("../config/env");

const REFRESH_TOKEN_COOKIE = "nutwear_refresh_token";

function getRefreshCookieOptions() {
  // Kita bypass pengecekan env, langsung paksa true dan none untuk server production
  return {
    httpOnly: true,
    secure: true,        // WAJIB true untuk HTTPS di Railway
    sameSite: "none",    // WAJIB "none" agar lintas domain (Vercel <-> Railway) tidak diblokir
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
    path: "/",
  };
}

module.exports = { REFRESH_TOKEN_COOKIE, getRefreshCookieOptions };