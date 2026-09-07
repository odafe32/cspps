import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();

  if (!session) redirect("/login");

  const redirectMap: Record<string, string> = {
    ADMIN: "/admin/dashboard",
    LECTURER: "/lecturer/dashboard",
    STUDENT: "/student/dashboard",
  };

  redirect(redirectMap[session.role] || "/login");
}
