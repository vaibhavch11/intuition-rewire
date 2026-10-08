import { redirect } from "next/navigation";
import { isAdminConfigured, isAdminRequest } from "@/lib/admin/auth";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await isAdminRequest()) redirect("/admin");

  return (
    <main className="mx-auto w-full max-w-sm px-gutter-mobile py-space-2xl">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">
        Admin sign in
      </h1>

      {isAdminConfigured() ? (
        <>
          <p className="font-body-md text-body-md mt-space-sm text-on-surface-variant">
            Enter the admin password to write lesson content.
          </p>
          <AdminLoginForm />
        </>
      ) : (
        <div className="mt-space-base rounded-xl border border-outline-variant/70 bg-surface-container-low p-space-lg">
          <p className="font-body-md text-body-md text-on-surface-variant">
            The admin area is closed because no password is configured. Add this
            to <code className="font-code-sm text-code-sm">.env.local</code> and
            restart the dev server:
          </p>
          <pre className="font-code-md text-code-md mt-space-md overflow-x-auto rounded-lg bg-surface-container p-space-md text-on-surface">
            <code>ADMIN_PASSWORD=choose-a-long-random-string</code>
          </pre>
        </div>
      )}
    </main>
  );
}
