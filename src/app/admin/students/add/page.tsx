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

export default function AddStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentNumber: "",
    semester: "2025/2026-1",
    gpa: "",
    attendanceRate: "",
    studyHours: "",
    assignmentAverage: "",
    testAverage: "",
    libraryVisits: "",
    classParticipation: "",
  });

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email || !form.studentNumber) {
      toast.error("Missing Fields", { description: "First name, last name, email, and student number are required" });
      return;
    }

    const gpa = parseFloat(form.gpa);
    if (form.gpa && (isNaN(gpa) || gpa < 0 || gpa > 5.0)) {
      toast.error("Invalid GPA", { description: "GPA must be between 0 and 5.0" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Failed to Add Student", { description: data.error });
        setLoading(false);
        return;
      }

      toast.success("Student Added", {
        description: `${form.firstName} ${form.lastName} has been added`,
      });
      router.push("/admin/students");
      router.refresh();
    } catch {
      toast.error("Network Error", { description: "Failed to add student" });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/students" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Students
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Add Student</h2>
        <p className="text-sm text-muted-foreground">
          Create a new student account with initial performance data
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
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
                <Label htmlFor="studentNumber">Student Number *</Label>
                <Input id="studentNumber" value={form.studentNumber} onChange={(e) => update("studentNumber", e.target.value)} required />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Default password will be: <code className="rounded bg-muted px-1.5 py-0.5">student123</code>
            </p>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Initial Performance Data</CardTitle>
            <CardDescription>Optional — you can add records later</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Input id="semester" value={form.semester} onChange={(e) => update("semester", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gpa">GPA (0-5.0)</Label>
                <Input id="gpa" type="number" step="0.01" min="0" max="5" value={form.gpa} onChange={(e) => update("gpa", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendanceRate">Attendance (%)</Label>
                <Input id="attendanceRate" type="number" min="0" max="100" value={form.attendanceRate} onChange={(e) => update("attendanceRate", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="studyHours">Study Hours/week</Label>
                <Input id="studyHours" type="number" min="0" value={form.studyHours} onChange={(e) => update("studyHours", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignmentAverage">Assignment Avg (%)</Label>
                <Input id="assignmentAverage" type="number" min="0" max="100" value={form.assignmentAverage} onChange={(e) => update("assignmentAverage", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testAverage">Test Avg (%)</Label>
                <Input id="testAverage" type="number" min="0" max="100" value={form.testAverage} onChange={(e) => update("testAverage", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="libraryVisits">Library Visits/semester</Label>
                <Input id="libraryVisits" type="number" min="0" value={form.libraryVisits} onChange={(e) => update("libraryVisits", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="classParticipation">Class Participation (0-10)</Label>
                <Input id="classParticipation" type="number" min="0" max="10" step="0.1" value={form.classParticipation} onChange={(e) => update("classParticipation", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-end gap-2">
          <Link href="/admin/students">
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
                Add Student
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
