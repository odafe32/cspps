import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { PerformanceRecords } from "@/components/forms/performance-records";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: true,
      performanceRecords: {
        orderBy: { createdAt: "asc" },
      },
      predictions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!student) notFound();

  const latestPrediction = student.predictions[0];
  const latestRecord = student.performanceRecords[student.performanceRecords.length - 1];

  const riskBadge = (level: string) => {
    const styles: Record<string, string> = {
      HIGH: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      MEDIUM:
        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
      LOW: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    };
    return styles[level] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/lecturer/students"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </Link>

      {/* Student header */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-medium">
          {student.user.firstName[0]}
          {student.user.lastName[0]}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {student.user.firstName} {student.user.lastName}
          </h2>
          <p className="text-sm text-muted-foreground">
            {student.studentNumber} · Enrolled{" "}
            {new Date(student.enrollmentDate).toLocaleDateString()}
          </p>
        </div>
        {latestPrediction && (
          <Badge
            variant="secondary"
            className={`text-sm ${riskBadge(latestPrediction.riskLevel)}`}
          >
            {latestPrediction.riskLevel} RISK
          </Badge>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current GPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestRecord?.gpa.toFixed(2) || "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Predicted GPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestPrediction?.predictedGpa.toFixed(2) || "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestRecord ? `${latestRecord.attendanceRate.toFixed(0)}%` : "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Study Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestRecord ? `${latestRecord.studyHours.toFixed(0)} hrs` : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance history + Prediction details */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Performance history */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  Performance History
                </CardTitle>
                <CardDescription>GPA and attendance by semester</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PerformanceRecords
              studentId={student.id}
              records={student.performanceRecords.map((r) => ({
                id: r.id,
                semester: r.semester,
                gpa: r.gpa,
                attendanceRate: r.attendanceRate,
                studyHours: r.studyHours,
                assignmentAverage: r.assignmentAverage,
                testAverage: r.testAverage,
                libraryVisits: r.libraryVisits,
                classParticipation: r.classParticipation,
              }))}
            />
          </CardContent>
        </Card>

        {/* Prediction details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              Latest Prediction
            </CardTitle>
            <CardDescription>Most recent ML prediction result</CardDescription>
          </CardHeader>
          <CardContent>
            {!latestPrediction ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <p className="text-sm text-muted-foreground">
                  No predictions generated yet
                </p>
                <Link href="/lecturer/predictions">
                  <Button size="sm">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Run Prediction
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Predicted GPA</p>
                    <p className="mt-1 text-2xl font-bold">
                      {latestPrediction.predictedGpa.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Risk Level</p>
                    <div className="mt-1">
                      <Badge
                        variant="secondary"
                        className={riskBadge(latestPrediction.riskLevel)}
                      >
                        {latestPrediction.riskLevel}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model Used</span>
                    <span className="font-medium capitalize">
                      {latestPrediction.modelUsed.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">
                      {latestPrediction.confidenceScore
                        ? `${(latestPrediction.confidenceScore * 100).toFixed(0)}%`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prediction Date</span>
                    <span className="font-medium">
                      {new Date(latestPrediction.predictionDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
