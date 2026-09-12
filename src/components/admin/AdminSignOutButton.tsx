"use client";

import { useRouter } from "next/navigation";

export default function AdminSignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.replace("/admin/login");
        router.refresh();
      }}
      className="font-label-md text-label-md rounded-lg border border-outline-variant px-space-md py-space-xs text-on-surface-variant hover:text-primary"
    >
      Sign out
    </button>
  );
}
