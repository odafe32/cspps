import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import DashboardShell from "@/components/dashboard/shell";
import { LecturerSidebar } from "@/components/dashboard/lecturer-sidebar";

export default async function LecturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/login");
  if (session.role !== "LECTURER")
    redirect(`/${session.role.toLowerCase()}/dashboard`);

  return (
    <DashboardShell
      sidebar={<LecturerSidebar />}
      userName={`${session.firstName} ${session.lastName}`}
      role="Lecturer"
    >
      {children}
    </DashboardShell>
  );
}
