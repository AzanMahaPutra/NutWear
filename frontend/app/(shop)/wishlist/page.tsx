import type { Metadata } from "next";
import { WishlistView } from "@/features/wishlist/components/WishlistView";
import { AuthGuard } from "@/components/shared/AuthGuard";

export const metadata: Metadata = {
  title: "Wishlist",
};

export default function WishlistPage() {
  return (
    <AuthGuard>
      <WishlistView />
    </AuthGuard>
  );
}
