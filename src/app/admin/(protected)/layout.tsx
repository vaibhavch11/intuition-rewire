import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/admin/auth";
import AdminSignOutButton from "@/components/admin/AdminSignOutButton";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!(await isAdminRequest())) redirect("/admin/login");

  return (
    <div className="mx-auto w-full max-w-5xl px-gutter-mobile py-space-xl lg:px-gutter-desktop">
      <div className="mb-space-lg flex items-center justify-between gap-space-md border-b border-outline-variant/50 pb-space-md">
        <Link
          href="/admin"
          className="font-headline-md text-headline-md text-on-surface"
        >
          Content admin
        </Link>
        <AdminSignOutButton />
      </div>
      {children}
    </div>
  );
}
