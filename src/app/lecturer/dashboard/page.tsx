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
  GraduationCap,
  AlertTriangle,
  TrendingUp,
  Upload,
  ArrowRight,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { RiskDistributionChart } from "@/components/charts/risk-distribution-chart";
import { GpaTrendChart } from "@/components/charts/gpa-trend-chart";
import { formatTimeAgo } from "@/lib/utils/format";

export default async function LecturerDashboard() {
  const [
    totalStudents,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    totalPredictions,
    avgGpaResult,
    atRiskStudents,
    recentPredictions,
    gpaBySemester,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.prediction.count({ where: { riskLevel: "HIGH" } }),
    prisma.prediction.count({ where: { riskLevel: "MEDIUM" } }),
    prisma.prediction.count({ where: { riskLevel: "LOW" } }),
    prisma.prediction.count(),
    prisma.performanceRecord.aggregate({ _avg: { gpa: true } }),
    prisma.student.findMany({
      where: {
        predictions: { some: { riskLevel: "HIGH" } },
      },
      take: 5,
      include: {
        user: true,
        predictions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        performanceRecords: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.prediction.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        student: { include: { user: true } },
      },
    }),
    prisma.performanceRecord.groupBy({
      by: ["semester"],
      _avg: { gpa: true },
      orderBy: { semester: "asc" },
      take: 8,
    }),
  ]);

  const avgGpa = avgGpaResult._avg.gpa
    ? Number(avgGpaResult._avg.gpa.toFixed(2))
    : 0;

  const stats = [
    {
      label: "Total Students",
      value: totalStudents,
      icon: GraduationCap,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "High-Risk",
      value: highRiskCount,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950",
    },
    {
      label: "Predictions Run",
      value: totalPredictions,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Average GPA",
      value: avgGpa,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
    },
  ];

  const riskData = [
    { name: "Low Risk", value: lowRiskCount, fill: "#22c55e" },
    { name: "Medium Risk", value: mediumRiskCount, fill: "#f59e0b" },
    { name: "High Risk", value: highRiskCount, fill: "#ef4444" },
  ];

  const gpaTrendData = gpaBySemester
    .filter((s) => s._avg.gpa !== null)
    .map((s) => ({
      name: s.semester,
      gpa: Number(s._avg.gpa!.toFixed(2)),
    }));

  const riskBadge = (level: string) => {
    const styles: Record<string, string> = {
      HIGH: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      MEDIUM:
        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
      LOW: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    };
    return styles[level] || styles.LOW;
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lecturer Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Monitor student performance and run predictions
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/lecturer/upload">
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Upload Data
            </Button>
          </Link>
          <Link href="/lecturer/predictions">
            <Button size="sm">
              <TrendingUp className="mr-2 h-4 w-4" />
              Run Prediction
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts + At-risk students */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Risk distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              Risk Distribution
            </CardTitle>
            <CardDescription>
              Student risk classification across all predictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RiskDistributionChart data={riskData} />
          </CardContent>
        </Card>

        {/* At-risk students */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  At-Risk Students
                </CardTitle>
                <CardDescription>Students flagged as high risk</CardDescription>
              </div>
              <Link href="/lecturer/students">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {atRiskStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No at-risk students identified
              </p>
            ) : (
              <div className="space-y-3">
                {atRiskStudents.map((student) => (
                  <Link
                    key={student.id}
                    href={`/lecturer/students/${student.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-xs font-medium text-red-600 dark:bg-red-950">
                        {student.user.firstName[0]}
                        {student.user.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {student.user.firstName} {student.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {student.studentNumber} · GPA{" "}
                          {student.performanceRecords[0]?.gpa.toFixed(2) || "N/A"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={riskBadge(
                        student.predictions[0]?.riskLevel || "LOW"
                      )}
                    >
                      {student.predictions[0]?.riskLevel || "N/A"}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* GPA trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            GPA Trend by Semester
          </CardTitle>
          <CardDescription>
            Average student GPA across recent semesters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GpaTrendChart data={gpaTrendData} />
        </CardContent>
      </Card>

      {/* Recent predictions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                Recent Predictions
              </CardTitle>
              <CardDescription>Latest prediction results</CardDescription>
            </div>
            <Link href="/lecturer/predictions">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentPredictions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No predictions generated yet
            </p>
          ) : (
            <div className="space-y-1">
              {recentPredictions.map((pred, i) => (
                <div key={pred.id}>
                  <Link
                    href={`/lecturer/students/${pred.studentId}`}
                    className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-muted/30 rounded-md px-2 -mx-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {pred.student.user.firstName[0]}
                        {pred.student.user.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {pred.student.user.firstName}{" "}
                          {pred.student.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Predicted GPA: {pred.predictedGpa.toFixed(2)} ·{" "}
                          {pred.modelUsed}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(pred.createdAt)}
                      </span>
                      <Badge
                        variant="secondary"
                        className={riskBadge(pred.riskLevel)}
                      >
                        {pred.riskLevel}
                      </Badge>
                    </div>
                  </Link>
                  {i < recentPredictions.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
