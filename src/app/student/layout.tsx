import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import DashboardShell from "@/components/dashboard/shell";
import { StudentSidebar } from "@/components/dashboard/student-sidebar";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/login");
  if (session.role !== "STUDENT") redirect(`/${session.role.toLowerCase()}/dashboard`);

  return (
    <DashboardShell
      sidebar={<StudentSidebar />}
      userName={`${session.firstName} ${session.lastName}`}
      role="Student"
    >
      {children}
    </DashboardShell>
  );
}
