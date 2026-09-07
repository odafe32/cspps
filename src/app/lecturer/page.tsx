import { redirect } from "next/navigation";

export default function LecturerRedirect() {
  redirect("/lecturer/dashboard");
}
