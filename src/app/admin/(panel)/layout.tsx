import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import AdminSidebar from "./AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");
  return (
    <div className="min-h-screen bg-stone-100 flex">
      <AdminSidebar adminName={admin.name} />
      <main className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto p-4 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
