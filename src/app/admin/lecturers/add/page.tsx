"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function AddLecturerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
  });

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email) {
      toast.error("Missing Fields", { description: "First name, last name, and email are required" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/lecturers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Failed to Add Lecturer", { description: data.error });
        setLoading(false);
        return;
      }

      toast.success("Lecturer Added", {
        description: `${form.firstName} ${form.lastName} has been added`,
      });
      router.push("/admin/lecturers");
      router.refresh();
    } catch {
      toast.error("Network Error", { description: "Failed to add lecturer" });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/lecturers" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Lecturers
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Add Lecturer</h2>
        <p className="text-sm text-muted-foreground">
          Create a new lecturer account
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Lecturer Information</CardTitle>
            <CardDescription>Basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" value={form.department} onChange={(e) => update("department", e.target.value)} placeholder="e.g. Computer Science" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Default password will be: <code className="rounded bg-muted px-1.5 py-0.5">lecturer123</code>
            </p>
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-end gap-2">
          <Link href="/admin/lecturers">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Lecturer
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
