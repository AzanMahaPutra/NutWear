import { useEffect, useState } from "react";

/**
 * Hook debounce reusable — dipakai untuk search produk (Navbar & filter Shop)
 * supaya tidak memanggil ulang filter/API di setiap ketikan huruf.
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
