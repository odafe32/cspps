import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import DashboardShell from "@/components/dashboard/shell";
import { AdminSidebar } from "@/components/dashboard/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect(`/${session.role.toLowerCase()}/dashboard`);

  return (
    <DashboardShell
      sidebar={<AdminSidebar />}
      userName={`${session.firstName} ${session.lastName}`}
      role="Administrator"
    >
      {children}
    </DashboardShell>
  );
}
