import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileView } from "@/features/profile/components/ProfileView";

export const metadata: Metadata = {
  title: "Profile Saya",
};

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileView />
    </Suspense>
  );
}
