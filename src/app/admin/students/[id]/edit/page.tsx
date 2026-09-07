"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Save, GraduationCap, Mail, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentNumber: string;
  enrollmentDate: string;
  latestRecord: {
    id: string;
    semester: string;
    gpa: number;
    attendanceRate: number;
    studyHours: number;
    assignmentAverage: number | null;
    testAverage: number | null;
    libraryVisits: number | null;
    classParticipation: number | null;
  } | null;
  latestPrediction: {
    predictedGpa: number;
    riskLevel: string;
    modelUsed: string;
    confidenceScore: number | null;
  } | null;
}

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [studentData, setStudentData] = useState<StudentData | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentNumber: "",
  });

  const [recordForm, setRecordForm] = useState({
    semester: "",
    gpa: "",
    attendanceRate: "",
    studyHours: "",
    assignmentAverage: "",
    testAverage: "",
    libraryVisits: "",
    classParticipation: "",
  });

  useEffect(() => {
    async function fetchStudent() {
      try {
        const res = await fetch(`/api/students/${params.id}`);
        if (!res.ok) {
          toast.error("Failed to load student");
          setFetching(false);
          return;
        }
        const data: StudentData = await res.json();
        setStudentData(data);
        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          studentNumber: data.studentNumber || "",
        });
        if (data.latestRecord) {
          setRecordForm({
            semester: data.latestRecord.semester || "",
            gpa: String(data.latestRecord.gpa ?? ""),
            attendanceRate: String(data.latestRecord.attendanceRate ?? ""),
            studyHours: String(data.latestRecord.studyHours ?? ""),
            assignmentAverage: data.latestRecord.assignmentAverage != null ? String(data.latestRecord.assignmentAverage) : "",
            testAverage: data.latestRecord.testAverage != null ? String(data.latestRecord.testAverage) : "",
            libraryVisits: data.latestRecord.libraryVisits != null ? String(data.latestRecord.libraryVisits) : "",
            classParticipation: data.latestRecord.classParticipation != null ? String(data.latestRecord.classParticipation) : "",
          });
        }
      } catch {
        toast.error("Network Error", { description: "Failed to fetch student data" });
      }
      setFetching(false);
    }
    fetchStudent();
  }, [params.id]);

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateRecord(key: string, value: string) {
    setRecordForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email) {
      toast.error("Missing Fields", { description: "First name, last name, and email are required" });
      return;
    }

    setLoading(true);
    try {
      // Update student info
      const res = await fetch(`/api/students/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Failed to Update", { description: data.error });
        setLoading(false);
        return;
      }

      // Update performance record if we have one
      if (studentData?.latestRecord && recordForm.semester) {
        await fetch(`/api/students/${params.id}/records/${studentData.latestRecord.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            semester: recordForm.semester,
            gpa: parseFloat(recordForm.gpa) || 0,
            attendanceRate: parseFloat(recordForm.attendanceRate) || 0,
            studyHours: parseFloat(recordForm.studyHours) || 0,
            assignmentAverage: recordForm.assignmentAverage ? parseFloat(recordForm.assignmentAverage) : null,
            testAverage: recordForm.testAverage ? parseFloat(recordForm.testAverage) : null,
            libraryVisits: recordForm.libraryVisits ? parseInt(recordForm.libraryVisits) : null,
            classParticipation: recordForm.classParticipation ? parseFloat(recordForm.classParticipation) : null,
          }),
        });
      }

      toast.success("Student Updated", {
        description: `${form.firstName} ${form.lastName} has been updated`,
      });
      router.push("/admin/students");
      router.refresh();
    } catch {
      toast.error("Network Error", { description: "Failed to update student" });
    }
    setLoading(false);
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Fetching student data...</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm font-medium">Student not found</p>
        <Link href="/admin/students" className="mt-4">
          <Button variant="outline" size="sm">Back to Students</Button>
        </Link>
      </div>
    );
  }

  const riskBadge = (level: string) => {
    const styles: Record<string, string> = {
      HIGH: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
      LOW: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    };
    return styles[level] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/students" className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Students
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Edit Student</h2>
        <p className="text-sm text-muted-foreground">
          Update student account and performance data
        </p>
      </div>

      {/* Student summary card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {studentData.firstName[0]}
              {studentData.lastName[0]}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {studentData.firstName} {studentData.lastName}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {studentData.studentNumber}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {studentData.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Enrolled {new Date(studentData.enrollmentDate).toLocaleDateString()}
                </span>
                {studentData.latestPrediction && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Predicted: {studentData.latestPrediction.predictedGpa.toFixed(2)}
                    <Badge variant="secondary" className={`ml-1 ${riskBadge(studentData.latestPrediction.riskLevel)}`}>
                      {studentData.latestPrediction.riskLevel}
                    </Badge>
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Edit student account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => updateForm("firstName", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => updateForm("lastName", e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentNumber">Student Number</Label>
                <Input id="studentNumber" value={form.studentNumber} onChange={(e) => updateForm("studentNumber", e.target.value)} disabled />
                <p className="text-xs text-muted-foreground">Student number cannot be changed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance record */}
        {studentData.latestRecord ? (
          <Card>
            <CardHeader>
              <CardTitle>Performance Record</CardTitle>
              <CardDescription>
                Latest record for {studentData.latestRecord.semester}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Input id="semester" value={recordForm.semester} onChange={(e) => updateRecord("semester", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gpa">GPA (0-5.0)</Label>
                  <Input id="gpa" type="number" step="0.01" min="0" max="5" value={recordForm.gpa} onChange={(e) => updateRecord("gpa", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendanceRate">Attendance (%)</Label>
                  <Input id="attendanceRate" type="number" min="0" max="100" value={recordForm.attendanceRate} onChange={(e) => updateRecord("attendanceRate", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="studyHours">Study Hours/week</Label>
                  <Input id="studyHours" type="number" min="0" value={recordForm.studyHours} onChange={(e) => updateRecord("studyHours", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignmentAverage">Assignment Avg (%)</Label>
                  <Input id="assignmentAverage" type="number" min="0" max="100" value={recordForm.assignmentAverage} onChange={(e) => updateRecord("assignmentAverage", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testAverage">Test Avg (%)</Label>
                  <Input id="testAverage" type="number" min="0" max="100" value={recordForm.testAverage} onChange={(e) => updateRecord("testAverage", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="libraryVisits">Library Visits/semester</Label>
                  <Input id="libraryVisits" type="number" min="0" value={recordForm.libraryVisits} onChange={(e) => updateRecord("libraryVisits", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classParticipation">Class Participation (0-10)</Label>
                  <Input id="classParticipation" type="number" min="0" max="10" step="0.1" value={recordForm.classParticipation} onChange={(e) => updateRecord("classParticipation", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">No performance records yet</p>
              <Link href={`/admin/students/${params.id}`}>
                <Button variant="outline" size="sm" className="mt-3">
                  Add Record from Student Detail
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Prediction info (read-only) */}
        {studentData.latestPrediction && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                Latest Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Predicted GPA</p>
                  <p className="text-lg font-bold">{studentData.latestPrediction.predictedGpa.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Risk Level</p>
                  <Badge variant="secondary" className={riskBadge(studentData.latestPrediction.riskLevel)}>
                    {studentData.latestPrediction.riskLevel}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Model</p>
                  <p className="text-sm font-medium capitalize">{studentData.latestPrediction.modelUsed.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p className="text-sm font-medium">
                    {studentData.latestPrediction.confidenceScore
                      ? `${(studentData.latestPrediction.confidenceScore * 100).toFixed(0)}%`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          <Link href="/admin/students">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
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
