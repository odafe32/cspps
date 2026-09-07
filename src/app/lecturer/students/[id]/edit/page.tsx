"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Save, ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadStudent() {
      try {
        const res = await fetch(`/api/students/${params.id}`);
        if (!res.ok) return;
        const data = await res.json();
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setEmail(data.email || "");
        setStudentNumber(data.studentNumber || "");
      } catch {
        toast.error("Failed to load student");
      }
      setLoading(false);
    }
    loadStudent();
  }, [params.id]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!firstName) e.firstName = "Required";
    if (!lastName) e.lastName = "Required";
    if (!email) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email";
    if (!studentNumber) e.studentNumber = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/students/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, studentNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Update Failed", { description: data.error });
        setSaving(false);
        return;
      }

      toast.success("Student Updated", {
        description: `${firstName} ${lastName} has been updated`,
      });
      router.push(`/lecturer/students/${params.id}`);
      router.refresh();
    } catch {
      toast.error("Network Error", { description: "Failed to update student" });
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/lecturer/students/${params.id}`}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Student
      </Link>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Student</h2>
        <p className="text-sm text-muted-foreground">
          Update student information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-muted-foreground" />
              Student Information
            </CardTitle>
            <CardDescription>Update identity and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName) setErrors({ ...errors, firstName: "" });
                  }}
                  disabled={saving}
                  className={errors.firstName ? "border-destructive" : ""}
                />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (errors.lastName) setErrors({ ...errors, lastName: "" });
                  }}
                  disabled={saving}
                  className={errors.lastName ? "border-destructive" : ""}
                />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                  disabled={saving}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentNumber">Student Number</Label>
                <Input
                  id="studentNumber"
                  value={studentNumber}
                  onChange={(e) => {
                    setStudentNumber(e.target.value);
                    if (errors.studentNumber) setErrors({ ...errors, studentNumber: "" });
                  }}
                  disabled={saving}
                  className={errors.studentNumber ? "border-destructive" : ""}
                />
                {errors.studentNumber && <p className="text-xs text-destructive">{errors.studentNumber}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Link href={`/lecturer/students/${params.id}`}>
            <Button type="button" variant="outline" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
